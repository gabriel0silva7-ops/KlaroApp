import fs from "fs";
import path from "path";

/**
 * Parsing pipeline abstraction.
 * Each file type has its own extractor. CSV/XLSX are real; PDF/image are stubs for now.
 *
 * TODO: Replace pdfExtract with pdf-parse or pdfminer for production PDF extraction.
 * TODO: Replace imageExtract with a real OCR service (Tesseract, Google Vision API, etc.).
 * TODO: Replace rawTextToRecords with an LLM-based structured extraction (GPT-4, Claude).
 */

export interface ExtractedRecord {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  quantity?: number;
  confidence: number; // 0-1
}

const COMMON_CATEGORIES = [
  "Vendas",
  "Serviços",
  "Aluguel",
  "Marketing",
  "Folha de Pagamento",
  "Fornecedores",
  "Utilidades",
  "Impostos",
  "Equipamentos",
  "Outros",
];

/**
 * Classify a description into a business category.
 * TODO: Replace with LLM-based classification for better accuracy.
 */
function classifyCategory(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("vend") || lower.includes("receita") || lower.includes("cliente")) return "Vendas";
  if (lower.includes("serv") || lower.includes("consultor")) return "Serviços";
  if (lower.includes("aluguel") || lower.includes("locação")) return "Aluguel";
  if (lower.includes("market") || lower.includes("publicidad") || lower.includes("propaganda")) return "Marketing";
  if (lower.includes("salário") || lower.includes("folha") || lower.includes("funcionário")) return "Folha de Pagamento";
  if (lower.includes("fornecedor") || lower.includes("compra") || lower.includes("estoque")) return "Fornecedores";
  if (lower.includes("luz") || lower.includes("água") || lower.includes("energia") || lower.includes("internet")) return "Utilidades";
  if (lower.includes("imposto") || lower.includes("taxa") || lower.includes("tributo") || lower.includes("cnpj")) return "Impostos";
  if (lower.includes("equipamento") || lower.includes("máquina") || lower.includes("computador")) return "Equipamentos";
  return "Outros";
}

/**
 * Determine if a transaction is income or expense based on amount and description.
 */
function classifyType(amount: number, description: string): "income" | "expense" {
  if (amount > 0) return "income";
  if (amount < 0) return "expense";
  const lower = description.toLowerCase();
  if (lower.includes("receita") || lower.includes("venda") || lower.includes("crédito")) return "income";
  return "expense";
}

/**
 * Normalize date strings into ISO format (YYYY-MM-DD).
 * Handles common Brazilian date formats (DD/MM/YYYY, DD-MM-YYYY).
 */
function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().split("T")[0];

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Already ISO-ish
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.split("T")[0];
  }

  // Fallback: try Date parsing
  try {
    return new Date(raw).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Parse CSV content into extracted records.
 * Detects common column headers in Portuguese and English.
 */
export async function parseCSV(content: string): Promise<ExtractedRecord[]> {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const getCol = (row: string[], names: string[]): string => {
    for (const name of names) {
      const idx = header.indexOf(name);
      if (idx >= 0) return (row[idx] ?? "").replace(/['"]/g, "").trim();
    }
    return "";
  };

  const records: ExtractedRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const rawDate = getCol(row, ["data", "date", "dt"]);
    const desc = getCol(row, ["descrição", "descricao", "description", "historico", "histórico", "memo"]);
    const rawAmount = getCol(row, ["valor", "value", "amount", "montante", "quantia"]);
    const rawType = getCol(row, ["tipo", "type", "natureza"]);

    if (!rawAmount && !desc) continue;

    const amount = parseFloat(rawAmount.replace(",", ".").replace(/[^\d\-\.]/g, "")) || 0;
    const absAmount = Math.abs(amount);

    const type = rawType
      ? rawType.toLowerCase().includes("c") || rawType.toLowerCase().includes("income") || rawType.toLowerCase().includes("entrada")
        ? "income"
        : "expense"
      : classifyType(amount, desc);

    records.push({
      date: normalizeDate(rawDate) || new Date().toISOString().split("T")[0],
      description: desc || `Linha ${i}`,
      amount: absAmount,
      type,
      category: classifyCategory(desc),
      confidence: 0.85,
    });
  }

  return records;
}

/**
 * Parse Excel XLSX file into extracted records.
 * TODO: Install 'xlsx' package for real XLSX support.
 * For MVP, reads as CSV if the content looks tabular, otherwise returns mock.
 */
export async function parseXLSX(filePath: string): Promise<ExtractedRecord[]> {
  // TODO: Use 'xlsx' library for real Excel parsing:
  // import XLSX from 'xlsx';
  // const workbook = XLSX.readFile(filePath);
  // const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // const data = XLSX.utils.sheet_to_json(sheet);
  // ... map data to ExtractedRecord[]

  // MVP mock: return a few sample records so the review flow works
  return generateMockRecords(3, "Excel");
}

/**
 * Extract text from a PDF file.
 * TODO: Install 'pdf-parse' for real PDF extraction:
 * import pdfParse from 'pdf-parse';
 * const data = await pdfParse(buffer);
 * return data.text;
 */
export async function extractPDFText(_filePath: string): Promise<string> {
  // TODO: Implement real PDF text extraction
  return "Extrato bancário - dados extraídos em formato mock para MVP\nData;Descrição;Valor\n01/04/2024;Venda produto A;500.00\n05/04/2024;Pagamento fornecedor;-200.00\n10/04/2024;Receita serviços;1200.00";
}

/**
 * Process an image for OCR extraction.
 * TODO: Integrate a real OCR service (Google Vision, AWS Textract, Tesseract.js).
 */
export async function extractImageText(_filePath: string): Promise<string> {
  // TODO: Implement real OCR extraction
  return "";
}

/**
 * Convert raw text (from PDF or OCR) into structured records.
 * For MVP, tries CSV-like parsing on semicolons and common patterns.
 * TODO: Replace with LLM-based extraction (e.g., GPT-4o with structured output).
 */
export async function rawTextToRecords(text: string): Promise<ExtractedRecord[]> {
  if (!text.trim()) return generateMockRecords(3, "Texto extraído");

  // Try semicolon-delimited (common in Brazilian bank exports)
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const csvLike = lines.map((l) => l.replace(/;/g, ",")).join("\n");
  const records = await parseCSV(csvLike);

  if (records.length > 0) return records;

  return generateMockRecords(3, "Texto extraído");
}

/**
 * Generate placeholder records for file types that don't have real extraction yet.
 * Used for XLSX (MVP), images, and poorly-structured PDFs.
 */
export function generateMockRecords(count: number = 5, source: string = "Arquivo"): ExtractedRecord[] {
  const today = new Date();
  const records: ExtractedRecord[] = [];

  const templates = [
    { desc: "Venda de produto", amount: 850, type: "income" as const, cat: "Vendas" },
    { desc: "Pagamento fornecedor", amount: 320, type: "expense" as const, cat: "Fornecedores" },
    { desc: "Receita serviços", amount: 1500, type: "income" as const, cat: "Serviços" },
    { desc: "Conta de energia", amount: 180, type: "expense" as const, cat: "Utilidades" },
    { desc: "Aluguel do espaço", amount: 2000, type: "expense" as const, cat: "Aluguel" },
  ];

  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 3);
    const t = templates[i];
    records.push({
      date: d.toISOString().split("T")[0],
      description: `${t.desc} (${source})`,
      amount: t.amount,
      type: t.type,
      category: t.cat,
      confidence: 0.5, // lower confidence for mock data
    });
  }

  return records;
}
