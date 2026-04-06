/**
 * Rule-based insight engine for Klaro.
 * Generates 3-5 actionable business insights from confirmed transaction data.
 *
 * Design principles:
 * - Simple rules that any business owner can act on
 * - Direct, non-technical tone
 * - Each insight has a title, explanation, and concrete recommendation
 *
 * TODO: Replace or augment with LLM-based insight generation for more nuanced analysis.
 */

export interface GeneratedInsight {
  title: string;
  description: string;
  recommendation: string;
  periodLabel: string;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
}

interface MonthData {
  income: number;
  expenses: number;
  count: number;
}

function groupByMonth(transactions: Transaction[]): Map<string, MonthData> {
  const map = new Map<string, MonthData>();

  for (const t of transactions) {
    const month = t.date.substring(0, 7); // YYYY-MM
    const existing = map.get(month) ?? { income: 0, expenses: 0, count: 0 };
    if (t.type === "income") existing.income += t.amount;
    else existing.expenses += t.amount;
    existing.count++;
    map.set(month, existing);
  }

  return map;
}

function groupByCategory(transactions: Transaction[]): Map<string, { total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>();

  for (const t of transactions) {
    const existing = map.get(t.category) ?? { total: 0, count: 0 };
    existing.total += t.amount;
    existing.count++;
    map.set(t.category, existing);
  }

  return map;
}

export function generateInsights(transactions: Transaction[]): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  if (transactions.length === 0) {
    insights.push({
      title: "Nenhuma transação encontrada",
      description: "Você ainda não tem transações confirmadas para analisar.",
      recommendation: "Faça upload de um extrato ou planilha para começar a ver insights sobre seu negócio.",
      periodLabel: "Geral",
    });
    return insights;
  }

  const income = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const monthlyData = groupByMonth(transactions);
  const months = [...monthlyData.keys()].sort();
  const categoryData = groupByCategory(transactions);

  const currentPeriod = months[months.length - 1] ?? "Período atual";

  // ── Insight 1: Net balance health ─────────────────────────────────────────
  if (netBalance < 0) {
    insights.push({
      title: "Despesas maiores que receitas",
      description: `Suas despesas (R$ ${totalExpenses.toFixed(2)}) estão acima das suas receitas (R$ ${totalIncome.toFixed(2)}), resultando em um saldo negativo de R$ ${Math.abs(netBalance).toFixed(2)}.`,
      recommendation: "Revise suas maiores despesas e identifique o que pode ser reduzido ou renegociado. Foque em aumentar as receitas ou cortar custos não essenciais.",
      periodLabel: currentPeriod,
    });
  } else if (totalIncome > 0) {
    const margin = ((netBalance / totalIncome) * 100).toFixed(1);
    insights.push({
      title: "Margem de lucro positiva",
      description: `Seu negócio está com margem positiva de ${margin}% sobre as receitas. Receita total: R$ ${totalIncome.toFixed(2)}, despesas: R$ ${totalExpenses.toFixed(2)}.`,
      recommendation: "Continue monitorando mensalmente. Uma margem saudável para pequenos negócios fica entre 10% e 20%. Se estiver acima disso, considere reinvestir no crescimento.",
      periodLabel: currentPeriod,
    });
  }

  // ── Insight 2: Income trend (last two months) ──────────────────────────────
  if (months.length >= 2) {
    const lastMonth = monthlyData.get(months[months.length - 1])!;
    const prevMonth = monthlyData.get(months[months.length - 2])!;

    if (prevMonth.income > 0) {
      const change = ((lastMonth.income - prevMonth.income) / prevMonth.income) * 100;

      if (change < -10) {
        insights.push({
          title: "Queda na receita no período recente",
          description: `Sua receita caiu ${Math.abs(change).toFixed(1)}% em relação ao mês anterior (de R$ ${prevMonth.income.toFixed(2)} para R$ ${lastMonth.income.toFixed(2)}).`,
          recommendation: "Investigue quais clientes ou produtos geraram menos receita. Considere ações de reativação de clientes inativos ou promoções pontuais.",
          periodLabel: `${months[months.length - 2]} → ${months[months.length - 1]}`,
        });
      } else if (change > 15) {
        insights.push({
          title: "Crescimento de receita acelerado",
          description: `Sua receita cresceu ${change.toFixed(1)}% em relação ao mês anterior (de R$ ${prevMonth.income.toFixed(2)} para R$ ${lastMonth.income.toFixed(2)}).`,
          recommendation: "Ótimo sinal! Garanta que sua capacidade operacional e estoque acompanhem esse crescimento para não perder vendas por falta de estrutura.",
          periodLabel: `${months[months.length - 2]} → ${months[months.length - 1]}`,
        });
      }
    }
  }

  // ── Insight 3: Expense concentration by category ───────────────────────────
  const expenseByCategory = new Map<string, number>();
  for (const t of expenses) {
    expenseByCategory.set(t.category, (expenseByCategory.get(t.category) ?? 0) + t.amount);
  }

  if (expenseByCategory.size > 0 && totalExpenses > 0) {
    const topExpCat = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    const pct = ((topExpCat[1] / totalExpenses) * 100).toFixed(1);

    if (parseFloat(pct) > 40) {
      insights.push({
        title: `Alta concentração em "${topExpCat[0]}"`,
        description: `${pct}% das suas despesas estão concentradas em "${topExpCat[0]}" (R$ ${topExpCat[1].toFixed(2)} de R$ ${totalExpenses.toFixed(2)} total).`,
        recommendation: `Diversifique seus custos se possível. Uma dependência tão alta de uma única categoria pode ser um risco. Revise contratos ou busque alternativas para reduzir essa concentração.`,
        periodLabel: currentPeriod,
      });
    }
  }

  // ── Insight 4: Low transaction value (ticket size) ────────────────────────
  if (income.length > 0) {
    const avgTicket = totalIncome / income.length;

    if (income.length > 5 && avgTicket < 100) {
      insights.push({
        title: "Ticket médio baixo nas receitas",
        description: `Você tem muitas transações de receita (${income.length} entradas) com um valor médio de R$ ${avgTicket.toFixed(2)} por transação.`,
        recommendation: "Considere estratégias para aumentar o valor médio por venda: pacotes de produtos/serviços, upsell, ou foco em clientes com maior potencial de compra.",
        periodLabel: currentPeriod,
      });
    }
  }

  // ── Insight 5: Peak activity detection ────────────────────────────────────
  if (months.length > 1) {
    const peakMonth = months.reduce((best, m) => {
      const d = monthlyData.get(m)!;
      const bestD = monthlyData.get(best)!;
      return d.income > bestD.income ? m : best;
    }, months[0]);

    const peakData = monthlyData.get(peakMonth)!;
    const peakIncome = peakData.income;

    if (peakIncome > 0 && peakMonth !== months[months.length - 1]) {
      insights.push({
        title: `Melhor mês de receita: ${peakMonth}`,
        description: `Seu pico de receita foi em ${peakMonth}, com R$ ${peakIncome.toFixed(2)} em entradas.`,
        recommendation: `Analise o que aconteceu nesse período (sazonalidade, campanhas, eventos) e repita as ações que funcionaram. Planeje os meses seguintes com base nesse padrão.`,
        periodLabel: peakMonth,
      });
    }
  }

  return insights.slice(0, 5);
}
