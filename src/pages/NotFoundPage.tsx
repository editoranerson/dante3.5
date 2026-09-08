import { useEffect } from 'react';
import { MapPin, Smartphone, WifiOff } from 'lucide-react';
import { navigateTo } from '@/lib/router';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Página não encontrada — Querido Dante';
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center animate-fade-in">
        <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-grape-500/10 animate-pulse" />
          <Smartphone className="relative h-20 w-20 text-grape-300" strokeWidth={1.5} />
          <MapPin className="absolute -right-1 top-5 h-9 w-9 text-rose-400 animate-bounce" strokeWidth={2} />
          <WifiOff className="absolute bottom-4 left-4 h-8 w-8 text-grape-200/60" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-5xl font-bold text-grape-50">404</h1>
        <p className="mt-4 text-lg font-medium text-grape-100/90">
          O Dante se perdeu no caminho antes de chegar aqui.
        </p>
        <p className="mt-2 text-sm text-grape-200/70">
          A página que você procurou não existe ou foi movida.
        </p>

        <button
          type="button"
          onClick={() => navigateTo({ name: 'home' })}
          className="btn-primary mt-8"
        >
          Voltar para o início
        </button>
      </div>
    </div>
  );
}
