import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useListInsights, useGenerateInsights, getListInsightsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Insights() {
  const { isLoading: isAuthLoading } = useRequireAuth();
  const queryClient = useQueryClient();
  
  const { data: insights, isLoading } = useListInsights();
  const generateInsights = useGenerateInsights();

  const handleGenerate = () => {
    generateInsights.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInsightsQueryKey() });
      }
    });
  };

  if (isAuthLoading) return null;

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('aumento') || t.includes('crescimento') || t.includes('positivo')) return <TrendingUp className="w-5 h-5 text-primary" />;
    if (t.includes('queda') || t.includes('redução') || t.includes('negativo')) return <TrendingDown className="w-5 h-5 text-destructive" />;
    if (t.includes('alerta') || t.includes('atenção')) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <Lightbulb className="w-5 h-5 text-primary" />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Insights</h1>
            <p className="text-muted-foreground">Análises automáticas sobre a saúde do seu negócio.</p>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={generateInsights.isPending}
            className="gap-2 font-bold"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${generateInsights.isPending ? 'animate-spin' : ''}`} />
            {generateInsights.isPending ? "Analisando..." : "Gerar Novos Insights"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="pt-4 mt-4 border-t border-border">
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : insights?.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-card border border-border rounded-lg">
              <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Nenhum insight disponível</h3>
              <p className="text-muted-foreground mb-6">Adicione mais transações para que nossa IA possa analisar seu negócio.</p>
              <Button onClick={handleGenerate} disabled={generateInsights.isPending}>
                Gerar Análise
              </Button>
            </div>
          ) : (
            insights?.map((insight) => (
              <Card key={insight.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="p-2 bg-muted rounded-md shrink-0">
                    {getIcon(insight.title)}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white mb-1">{insight.title}</CardTitle>
                    <CardDescription className="text-xs">{insight.periodLabel}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Recomendação</h4>
                    <p className="text-sm text-primary">
                      {insight.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
