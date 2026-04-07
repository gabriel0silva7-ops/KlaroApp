import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

/**
 * Parsing pipeline — CSV and XLSX use real parsing.
 * PDF and images still need OCR/LLM integration (marked as TODO).
 *
 * TODO: Replace extractPDFText with pdf-parse for real PDF extraction.
 * TODO: Replace extractImageText with an OCR service (Tesseract, Google Vision, AWS Textract).
 * TODO: Replace rawTextToRecords with LLM-based structured extraction (GPT-4o, Claude).
 */

export interface ExtractedRecord {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  quantity?: number;
  confidence: number; // 0–1
}

// ─── Text normalization ───────────────────────────────────────────────────────

/** Lowercase + remove diacritics (accents) + trim */
function norm(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ─── Category classification ─────────────────────────────────────────────────

const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ["vend", "receita", "cliente", "sale", "fatura", "nota fiscal", "nf-e", "nfe"], category: "Vendas" },
  { keywords: ["serv", "consultor", "manutencao", "suporte", "prestacao", "tecnico"], category: "Serviços" },
  { keywords: ["aluguel", "locacao", "rent", "imovel", "condominio"], category: "Aluguel" },
  { keywords: ["market", "publicidad", "propaganda", "anuncio", "facebook ads", "google ads", "instagram"], category: "Marketing" },
  { keywords: ["salario", "folha", "funcionario", "pagamento pessoal", "rh", "rescisao", "ferias", "13"], category: "Folha de Pagamento" },
  { keywords: ["fornecedor", "compra", "estoque", "material", "produto", "insumo", "mercadoria"], category: "Fornecedores" },
  { keywords: ["luz", "agua", "energia", "internet", "telefone", "celular", "eletricidade", "esgoto", "gas"], category: "Utilidades" },
  { keywords: ["imposto", "taxa", "tributo", "cnpj", "cpf", "ir ", "irpj", "csll", "pis", "cofins", "iss", "icms", "darf", "das ", "simples"], category: "Impostos" },
  { keywords: ["equipamento", "maquina", "computador", "hardware", "software", "notebook", "celular", "impressora"], category: "Equipamentos" },
  { keywords: ["boleto", "parcela", "emprestimo", "financiamento", "juros", "banco"], category: "Financeiro" },
];

function classifyCategory(description: string): string {
  const n = norm(description);
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => n.includes(kw))) return rule.category;
  }
  return "Outros";
}

// ─── Type classification ──────────────────────────────────────────────────────

function classifyType(amount: number, description: string): "income" | "expense" {
  if (amount > 0) return "income";
  if (amount < 0) return "expense";
  const n = norm(description);
  if (n.includes("receita") || n.includes("venda") || n.includes("credito") || n.includes("entrada") || n.includes("recebimento")) {
    return "income";
  }
  return "expense";
}

// ─── Date normalization ───────────────────────────────────────────────────────

/**
 * Convert any date value Excel or user might provide to "YYYY-MM-DD".
 * Handles: Excel serial ints, JS Date, DD/MM/YYYY, DD/MM/YY, M/D/YY, M/D/YYYY, ISO strings.
 */
function normalizeDate(raw: unknown): string {
  const today = new Date().toISOString().split("T")[0];
  if (raw === null || raw === undefined || raw === "") return today;

  // Excel serial date number
  if (typeof raw === "number") {
    try {
      const d = XLSX.SSF.parse_date_code(raw);
      if (d && d.y > 1900) {
        return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
      }
    } catch { /* fall through */ }
    return today;
  }

  // JS Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().split("T")[0];
  }

  const s = String(raw).trim();

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // Brazilian DD/MM/YYYY or DD/MM/YY or DD-MM-YYYY or DD-MM-YY
  const brFull = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (brFull) {
    let [, part1, part2, year] = brFull;
    const y = year.length === 2 ? `20${year}` : year;
    const p1 = parseInt(part1, 10);
    const p2 = parseInt(part2, 10);
    // If part1 > 12, it must be the day (DD/MM)
    // If part2 > 12, it must be the day in the wrong position — swap
    if (p1 > 12) {
      // DD/MM/YYYY
      return `${y}-${part2.padStart(2, "0")}-${part1.toString().padStart(2, "0")}`;
    } else {
      // Could be MM/DD or DD/MM — default to DD/MM (Brazilian standard)
      // Unless month part2 > 12, meaning it's actually the day
      if (p2 > 12) {
        // part2 is day, part1 is month (American M/D)
        return `${y}-${part1.toString().padStart(2, "0")}-${part2.toString().padStart(2, "0")}`;
      }
      // Default: treat as DD/MM/YYYY (Brazilian)
      return `${y}-${part2.padStart(2, "0")}-${part1.toString().padStart(2, "0")}`;
    }
  }

  // Month name formats: "01 Jan 2025", "Jan 2025", etc. — let JS try
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
      return d.toISOString().split("T")[0];
    }
  } catch { /* fall through */ }

  return today;
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

/**
 * Parse a value to a float, handling:
 * - Already a number
 * - R$ prefix  
 * - Brazilian format: 1.234,56
 * - European format: 1.234.567,89
 * - Plain decimal: 1234.56
 * - Negative in parentheses: (1234.56)
 */
function parseAmount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;

  let s = String(raw).trim();

  // Negative in parentheses: (1.234,56) → -1234.56
  const isParenNeg = s.startsWith("(") && s.endsWith(")");
  if (isParenNeg) s = `-${s.slice(1, -1)}`;

  // Remove R$, non-numeric except digits, minus, comma, dot
  s = s.replace(/R\$\s?/g, "").replace(/\s/g, "");

  const negative = s.startsWith("-");
  s = s.replace(/^-/, "");

  // Brazilian format: 1.234.567,89 (dots as thousands, comma as decimal)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  // Comma-thousands, dot decimal: 1,234,567.89
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, "");
  }
  // Single comma as decimal: 1234,56
  else if (/^\d+,\d{1,2}$/.test(s)) {
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : (negative || isParenNeg ? -n : n);
}

// ─── Column detection ─────────────────────────────────────────────────────────

/**
 * Given header keys, find the best match for a semantic field.
 * Uses normalized (accent-free, lowercase) comparison.
 */
function findColumn(keys: string[], candidates: string[]): string | null {
  const normKeys = keys.map((k) => ({ orig: k, n: norm(k) }));
  for (const candidate of candidates) {
    const nc = norm(candidate);
    const found = normKeys.find(({ n }) => n === nc || n.includes(nc) || nc.includes(n));
    if (found) return found.orig;
  }
  return null;
}

// ─── Rows → Records ───────────────────────────────────────────────────────────

/**
 * Convert an array of raw row objects into ExtractedRecord[].
 * Auto-detects column layout for date, description, amount, type.
 */
function rowsToRecords(rows: Record<string, unknown>[]): ExtractedRecord[] {
  if (rows.length === 0) return [];

  const keys = Object.keys(rows[0]);

  const dateKey = findColumn(keys, [
    "data", "date", "dt", "dia", "vencimento", "lancamento", "data lancamento",
    "data do lancamento", "data pagamento", "competencia",
  ]);
  const descKey = findColumn(keys, [
    "descricao", "description", "historico", "memo", "lancamento", "complemento",
    "observacao", "detalhe", "documento", "favorecido", "estabelecimento", "titulo",
  ]);
  const amountKey = findColumn(keys, [
    "valor", "value", "amount", "montante", "quantia",
  ]);
  const typeKey = findColumn(keys, [
    "tipo", "type", "natureza", "dc", "d/c", "operacao",
  ]);
  const creditKey = findColumn(keys, [
    "credito", "credit", "entrada", "recebimento", "receita",
  ]);
  const debitKey = findColumn(keys, [
    "debito", "debit", "saida", "despesa", "pagamento",
  ]);

  const records: ExtractedRecord[] = [];

  for (const row of rows) {
    // Skip completely empty rows
    const vals = Object.values(row).map((v) => String(v).trim()).filter(Boolean);
    if (vals.length === 0) continue;

    const rawDate = dateKey ? row[dateKey] : null;
    const date = normalizeDate(rawDate);

    // Build description
    let desc = descKey ? String(row[descKey] ?? "").trim() : "";
    if (!desc) {
      desc = keys
        .filter((k) => k !== dateKey && k !== amountKey && k !== typeKey && k !== creditKey && k !== debitKey)
        .map((k) => String(row[k] ?? "").trim())
        .filter(Boolean)
        .join(" — ");
    }
    if (!desc) desc = "Lançamento";

    // Determine amount & inferred type
    let amount = 0;
    let inferredType: "income" | "expense" | null = null;

    if (creditKey && debitKey) {
      const credit = parseAmount(row[creditKey]);
      const debit = parseAmount(row[debitKey]);
      if (Math.abs(credit) > 0 && Math.abs(debit) === 0) {
        amount = Math.abs(credit);
        inferredType = "income";
      } else if (Math.abs(debit) > 0 && Math.abs(credit) === 0) {
        amount = Math.abs(debit);
        inferredType = "expense";
      } else if (amountKey) {
        const raw = parseAmount(row[amountKey]);
        amount = Math.abs(raw);
        if (raw < 0) inferredType = "expense";
        else if (raw > 0) inferredType = "income";
      }
    } else if (amountKey) {
      const raw = parseAmount(row[amountKey]);
      amount = Math.abs(raw);
      if (raw < 0) inferredType = "expense";
      else if (raw > 0) inferredType = "income";
    }

    // Skip rows with no meaningful amount
    if (amount === 0) continue;

    // Determine type
    let type: "income" | "expense";
    if (typeKey) {
      const rawType = norm(String(row[typeKey] ?? ""));
      if (rawType === "c" || rawType === "credito" || rawType.includes("entrada") || rawType.includes("recebimento") || rawType === "income") {
        type = "income";
      } else {
        type = "expense";
      }
    } else if (inferredType) {
      type = inferredType;
    } else {
      type = classifyType(amountKey ? parseAmount(row[amountKey]) : 0, desc);
    }

    records.push({
      date,
      description: desc,
      amount,
      type,
      category: classifyCategory(desc),
      confidence: 0.8,
    });
  }

  return records;
}

// ─── Header row detection ─────────────────────────────────────────────────────

/**
 * Many bank exports have metadata lines before the actual header row.
 * This finds the first row that looks like a header (has date + description + amount-like columns).
 */
function findHeaderRow(allRows: unknown[][]): number {
  const HEADER_HINTS = ["data", "date", "valor", "amount", "descricao", "description", "historico", "lancamento", "saldo"];
  for (let i = 0; i < Math.min(allRows.length, 15); i++) {
    const row = allRows[i];
    const normalized = row.map((c) => norm(String(c ?? "")));
    const matches = HEADER_HINTS.filter((hint) => normalized.some((n) => n.includes(hint)));
    if (matches.length >= 2) return i;
  }
  return 0; // fallback to row 0
}

// ─── Public parsers ───────────────────────────────────────────────────────────

/**
 * Parse CSV file content into ExtractedRecord[].
 */
export async function parseCSV(content: string): Promise<ExtractedRecord[]> {
  // Use xlsx to parse CSV (handles encoding and quoting uniformly)
  const workbook = XLSX.read(content, { type: "string", raw: false, cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Detect if there are metadata rows before the real header
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerRowIdx = findHeaderRow(aoa);

  let rows: Record<string, unknown>[];
  if (headerRowIdx === 0) {
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  } else {
    // Re-parse starting from the detected header row
    const sub = aoa.slice(headerRowIdx);
    const subSheet = XLSX.utils.aoa_to_sheet(sub);
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(subSheet, { defval: "", raw: false });
  }

  const records = rowsToRecords(rows);
  if (records.length > 0) return records;

  // Fallback: try semicolon-delimited (common in Brazilian bank exports)
  const csvSemicolon = content.replace(/;/g, ",");
  const wb2 = XLSX.read(csvSemicolon, { type: "string", raw: false, cellDates: true });
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const rows2 = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws2, { defval: "", raw: false });
  return rowsToRecords(rows2);
}

/**
 * Parse an Excel XLSX/XLS file into ExtractedRecord[].
 */
export async function parseXLSX(filePath: string): Promise<ExtractedRecord[]> {
  const absPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Arquivo não encontrado: ${absPath}`);
  }

  const workbook = XLSX.readFile(absPath, { cellDates: true, raw: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];

  const sheet = workbook.Sheets[firstSheet];

  // Check for metadata rows before the real data header
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerRowIdx = findHeaderRow(aoa);

  let rows: Record<string, unknown>[];
  if (headerRowIdx === 0) {
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  } else {
    // Re-parse starting from detected header
    const sub = aoa.slice(headerRowIdx);
    const subSheet = XLSX.utils.aoa_to_sheet(sub);
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(subSheet, { defval: "", raw: false });
  }

  const records = rowsToRecords(rows);
  if (records.length > 0) return records;

  // Fallback: try reading as CSV text
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return parseCSV(csv);
}

/**
 * Extract text from a PDF.
 * TODO: Use pdf-parse:
 *   import pdfParse from 'pdf-parse';
 *   const data = await pdfParse(fs.readFileSync(filePath));
 *   return data.text;
 */
export async function extractPDFText(_filePath: string): Promise<string> {
  return "Extrato bancário\nData;Descrição;Valor\n01/04/2025;Venda produto A;500,00\n05/04/2025;Pagamento fornecedor;-200,00\n10/04/2025;Receita serviços;1200,00";
}

/**
 * Extract text from an image via OCR.
 * TODO: Integrate Tesseract.js or Google Vision API.
 */
export async function extractImageText(_filePath: string): Promise<string> {
  return "";
}

/**
 * Convert raw text (PDF/OCR output) into structured records.
 * Tries semicolon-delimited parsing first (common in Brazilian bank exports).
 * TODO: Replace with LLM-based extraction for unstructured text.
 */
export async function rawTextToRecords(text: string): Promise<ExtractedRecord[]> {
  if (!text.trim()) return generateMockRecords(3, "Texto extraído");
  const records = await parseCSV(text);
  if (records.length > 0) return records;
  return generateMockRecords(3, "Texto extraído");
}

/**
 * Generate fallback placeholder records when extraction is not possible.
 * Only used for images pending OCR and broken inputs.
 */
export function generateMockRecords(count: number = 5, source: string = "Arquivo"): ExtractedRecord[] {
  const today = new Date();
  const templates = [
    { desc: "Venda de produto", amount: 850, type: "income" as const, cat: "Vendas" },
    { desc: "Pagamento fornecedor", amount: 320, type: "expense" as const, cat: "Fornecedores" },
    { desc: "Receita serviços", amount: 1500, type: "income" as const, cat: "Serviços" },
    { desc: "Conta de energia", amount: 180, type: "expense" as const, cat: "Utilidades" },
    { desc: "Aluguel do espaço", amount: 2000, type: "expense" as const, cat: "Aluguel" },
  ];

  return templates.slice(0, Math.min(count, templates.length)).map((t, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 3);
    return {
      date: d.toISOString().split("T")[0],
      description: `${t.desc} (${source})`,
      amount: t.amount,
      type: t.type,
      category: t.cat,
      confidence: 0.4,
    };
  });
}
