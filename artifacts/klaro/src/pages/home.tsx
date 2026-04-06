import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="max-w-4xl px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Transforme dados bagunçados em <span className="text-primary">gestão clara</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Envie extratos, fotos ou planilhas. O Klaro organiza e mostra o que está acontecendo no seu negócio.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="px-8 py-4 bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            Criar conta
          </Link>
          <Link href="/login" className="px-8 py-4 bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 transition-colors">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
