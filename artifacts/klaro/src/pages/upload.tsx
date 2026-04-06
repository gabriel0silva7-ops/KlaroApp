import { useCallback, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useUploadFile } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, FileType2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const { isLoading: isAuthLoading } = useRequireAuth();
  const [, setLocation] = useLocation();
  const uploadFile = useUploadFile();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    
    uploadFile.mutate(formData as any, {
      onSuccess: (data) => {
        setLocation(`/review/${data.id}`);
      },
      onError: (err: any) => {
        setError(err.message || "Erro ao fazer upload do arquivo");
      }
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  if (isAuthLoading) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Upload de Dados</h1>
          <p className="text-muted-foreground">Envie extratos bancários, planilhas ou fotos de anotações. O Klaro fará a leitura e organização automaticamente.</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors flex flex-col items-center justify-center gap-4 ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {uploadFile.isPending ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium text-white">Processando arquivo...</h3>
                    <p className="text-sm text-muted-foreground">A inteligência artificial está extraindo os dados.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium text-white">Arraste um arquivo ou clique para selecionar</h3>
                    <p className="text-sm text-muted-foreground">Suporta CSV, Excel (.xlsx), PDF e Imagens</p>
                  </div>
                  <div className="mt-6">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold transition-colors">
                        Selecionar Arquivo
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls,.pdf,image/*"
                        onChange={onFileInput}
                      />
                    </label>
                  </div>
                  {error && (
                    <p className="text-destructive text-sm mt-4">{error}</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
