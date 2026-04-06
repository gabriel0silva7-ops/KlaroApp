import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useGetDashboardSummary, useGetMonthlyTrend, useGetTransactionsByCategory, useListInsights, useListUploads } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

export default function Dashboard() {
  const { isLoading: isAuthLoading } = useRequireAuth();
  
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: monthlyTrend, isLoading: isMonthlyLoading } = useGetMonthlyTrend();
  const { data: categoryBreakdown, isLoading: isCategoryLoading } = useGetTransactionsByCategory();
  const { data: insights, isLoading: isInsightsLoading } = useListInsights();
  const { data: uploads, isLoading: isUploadsLoading } = useListUploads();

  if (isAuthLoading) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const COLORS = ['#39FF14', '#2ECC10', '#24990C', '#196608', '#0F3304'];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Líquido</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div className={`text-2xl font-bold ${summary?.netBalance && summary.netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(summary?.netBalance || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(summary?.totalIncome || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(summary?.totalExpenses || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transações</CardTitle>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-16 bg-muted" />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {summary?.transactionCount || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="col-span-1 lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Fluxo Mensal</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isMonthlyLoading ? (
                <Skeleton className="w-full h-full bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#888" tickFormatter={(val) => {
                      try {
                        return format(new Date(val), 'MMM/yy', { locale: ptBR });
                      } catch {
                        return val;
                      }
                    }} />
                    <YAxis stroke="#888" tickFormatter={(val) => `R$ ${val / 1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label), 'MMMM yyyy', { locale: ptBR });
                        } catch {
                          return label;
                        }
                      }}
                    />
                    <Bar dataKey="income" fill="#39FF14" name="Entradas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ff4d4d" name="Saídas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="col-span-1 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Saídas por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isCategoryLoading ? (
                <Skeleton className="w-full h-full bg-muted" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="category"
                    >
                      {(categoryBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights Snippet */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Insights Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isInsightsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full bg-muted" />
                  <Skeleton className="h-16 w-full bg-muted" />
                </div>
              ) : (
                <div className="space-y-4">
                  {insights && insights.length > 0 ? (
                    insights.slice(0, 3).map((insight) => (
                      <div key={insight.id} className="p-4 border border-border rounded-lg bg-background">
                        <h4 className="font-semibold text-primary mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Nenhum insight gerado ainda.
                    </div>
                  )}
                  <Link href="/insights" className="block text-center text-sm text-primary hover:underline mt-4">
                    Ver todos os insights
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uploads Snippet */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Uploads Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isUploadsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full bg-muted" />
                  <Skeleton className="h-12 w-full bg-muted" />
                </div>
              ) : (
                <div className="space-y-4">
                  {uploads && uploads.length > 0 ? (
                    uploads.slice(0, 5).map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-white truncate">{upload.fileName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(upload.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            upload.processingStatus === 'done' ? 'bg-primary/20 text-primary' :
                            upload.processingStatus === 'failed' ? 'bg-destructive/20 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {upload.processingStatus}
                          </span>
                          {upload.processingStatus === 'done' && (
                            <Link href={`/review/${upload.id}`} className="text-sm text-primary hover:underline">
                              Revisar
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground flex flex-col items-center gap-2">
                      <p>Nenhum upload feito ainda.</p>
                      <Link href="/upload" className="text-primary hover:underline">Fazer primeiro upload</Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
