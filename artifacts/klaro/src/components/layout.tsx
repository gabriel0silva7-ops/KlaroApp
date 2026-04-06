import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Home, Upload, FileText, Lightbulb, List } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Klaro</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-secondary p-3">
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/upload" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-secondary p-3">
            <Upload className="w-5 h-5" />
            Upload
          </Link>
          <Link href="/transactions" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-secondary p-3">
            <List className="w-5 h-5" />
            Transações
          </Link>
          <Link href="/insights" className="flex items-center gap-3 text-muted-foreground hover:text-white hover:bg-secondary p-3">
            <Lightbulb className="w-5 h-5" />
            Insights
          </Link>
        </nav>
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground truncate">{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden min-h-screen relative p-6">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
