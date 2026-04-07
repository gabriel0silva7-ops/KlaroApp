import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useLogin();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setServerError(null);
    login.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "";
          if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("senha") || msg.toLowerCase().includes("email")) {
            setServerError("E-mail ou senha incorretos. Tente novamente.");
          } else {
            setServerError("Erro ao fazer login. Tente novamente em instantes.");
          }
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 border border-border">
        <h1 className="text-3xl font-bold mb-6 text-white">Entrar</h1>

        {serverError && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="seu@email.com" {...field} className="bg-input border-none text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">Senha</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="bg-input border-none text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-bold" disabled={login.isPending}>
              {login.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-muted-foreground">
          Não tem uma conta? <Link href="/signup" className="text-primary hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
