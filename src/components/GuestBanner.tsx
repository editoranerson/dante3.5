import { LogIn } from 'lucide-react';
import { navigateTo } from '@/lib/router';

export function GuestBanner() {
  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/5 px-4 py-3 text-center sm:flex-row sm:text-left">
      <p className="text-sm text-grape-100/80">
        Faça login para uma melhor experiência e salvar seu progresso!
      </p>
      <button
        onClick={() => navigateTo({ name: 'login' })}
        className="btn-primary inline-flex flex-shrink-0 items-center gap-2 text-sm"
      >
        <LogIn size={16} /> Entrar / Criar Conta
      </button>
    </div>
  );
}
