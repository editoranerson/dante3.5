import { useRef } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { ToastProvider } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DanteChat } from '@/components/DanteChat';
import { CookieBanner } from '@/components/CookieBanner';
import { RequireAuth, RequireAdmin } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { PersonagensPage } from '@/pages/PersonagensPage';
import { SegredosPage } from '@/pages/SegredosPage';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { AlbumPage } from '@/pages/AlbumPage';
import { TarefasPage } from '@/pages/TarefasPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AdminPage } from '@/pages/AdminPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TermsPage, PrivacyPage } from '@/pages/LegalPages';
import { BibliotecaPage } from '@/pages/BibliotecaPage';
import { BibliotecaChapterPage } from '@/pages/BibliotecaChapterPage';
import { SobrePage } from '@/pages/SobrePage';
import { ContatoPage } from '@/pages/ContatoPage';
import { DiagPage } from '@/pages/DiagPage';
import { FaqPage } from '@/pages/FaqPage';
import { LojaPage } from '@/pages/LojaPage';
import { MinijogosPage } from '@/pages/MinijogosPage';
import { PlanosPage } from '@/pages/PlanosPage';
import { ChatstoryListPage } from '@/pages/ChatstoryListPage';
import { ChatstoryDetailPage } from '@/pages/ChatstoryDetailPage';
import { ChatstoryReaderPage } from '@/pages/ChatstoryReaderPage';
import { AfiliadosPage, AfiliadosDiretrizesPage } from '@/pages/AfiliadosPage';
import { ReferralTracker } from '@/components/ReferralTracker';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getRefCodeFromUrl } from '@/lib/affiliate';
import { ensureAdSenseScript } from '@/lib/adsense';

function Routed() {
  const { route } = useRouter();
  const { loading } = useAuth();
  const initialLoadDone = useRef(false);

  // AdSense: garante o script global e notifica o Google a cada troca de rota (SPA).
  useEffect(() => {
    ensureAdSenseScript();
  }, [route.name, JSON.stringify(route)]);
  if (!loading) initialLoadDone.current = true;

  if (loading && !initialLoadDone.current) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'personagens':
      return <PersonagensPage />;
    case 'segredos':
      return <SegredosPage />;
    case 'playlist':
      return <PlaylistPage />;
    case 'album':
      return <AlbumPage />;
    case 'tarefas':
      return <TarefasPage />;
    case 'login':
      return <LoginPage />;
    case 'signup':
      return <SignupPage />;
    case 'admin':
      return (
        <RequireAdmin>
          <AdminPage />
        </RequireAdmin>
      );
    case 'profile':
      return (
        <RequireAuth returnRoute={{ name: 'profile' }}>
          <ProfilePage />
        </RequireAuth>
      );
    case 'terms':
      return <TermsPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'biblioteca':
      return <BibliotecaPage cat={route.cat} />;
    case 'biblioteca_cap':
      return <BibliotecaChapterPage cat={route.cat} slug={route.slug} />;
    case 'sobre':
      return <SobrePage />;
    case 'contato':
      return <ContatoPage />;
    case 'diag':
      return <DiagPage />;
    case 'afiliados':
      return <AfiliadosPage />;
    case 'afiliados_diretrizes':
      return <AfiliadosDiretrizesPage />;
    case 'faq':
      return <FaqPage />;
    case 'loja':
      return <LojaPage />;
    case 'minijogos':
      return <MinijogosPage />;
    case 'planos':
      return <PlanosPage />;
    case 'chatstorys':
      return <ChatstoryListPage />;
    case 'chatstory':
      return <ChatstoryDetailPage slug={route.slug} />;
    case 'chatstory_cap':
      return <ChatstoryReaderPage slug={route.slug} cap={route.cap} />;
    default:
      return <HomePage />;
  }
}

function AffiliateTracker() {
  const [refCode, setRefCode] = useState<string | null>(null);
  const [retentionSeconds, setRetentionSeconds] = useState(60);

  useEffect(() => {
    const urlCode = getRefCodeFromUrl();
    const storedCode = sessionStorage.getItem('aff_ref_code');
    const confirmed = sessionStorage.getItem('aff_retention_confirmed') === 'true';
    // Use URL code if present; otherwise keep stored code as long as retention isn't confirmed yet
    const code = urlCode || (storedCode && !confirmed ? storedCode : null);
    if (code) {
      setRefCode(code);
      supabase
        .from('site_content')
        .select('value')
        .eq('key', 'affiliate_visit_retention_seconds')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) setRetentionSeconds(parseInt(data.value, 10));
        });
    }
  }, []);

  if (!refCode) return null;
  return <ReferralTracker refCode={refCode} retentionSeconds={retentionSeconds} />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen flex-col">
          <AffiliateTracker />
          <Navbar />
          <main className="flex-1">
            <Routed />
          </main>
          <Footer />
          <DanteChat />
          <CookieBanner />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
