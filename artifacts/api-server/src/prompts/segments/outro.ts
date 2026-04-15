import type { SegmentProfile } from "../types";

export const outro: SegmentProfile = {
  label: "Outro",
  terminologia: {
    receita: "receita",
    despesa: "despesa",
    cliente: "cliente",
    produto: "produto/serviço",
  },
  categoriasComuns: [
    "Vendas", "Serviços", "Fornecedores", "Aluguel", "Folha de Pagamento",
    "Utilidades", "Impostos", "Marketing", "Equipamentos",
  ],
  focoInsights: "equilíbrio entre receitas e despesas, tendência mensal, categorias que mais impactam o resultado e oportunidades de melhoria",
  tom: "amigável e acessível, como um consultor financeiro que fala com qualquer tipo de negócio — explique os números de forma simples e acionável",
  exemplosDocumentos: [
    "nota fiscal", "boleto", "recibo", "extrato bancário", "planilha financeira",
  ],
  desafiosComuns: [
    "despesas crescendo mais rápido que receitas",
    "fluxo de caixa imprevisível",
    "falta de separação entre finanças pessoais e do negócio",
    "concentração de receita em poucos clientes ou períodos",
  ],
};
