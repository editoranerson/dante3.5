import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { navigateTo, setReturnTo, type Route } from '@/lib/router';

export function RequireAuth({ children, returnRoute }: { children: ReactNode; returnRoute?: Route }) {
  const { user, loading, profileLoaded } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setReturnTo(returnRoute ?? { name: 'profile' });
      navigateTo({ name: 'login' });
    }
  }, [loading, user, returnRoute]);

  if (loading || (user && !profileLoaded)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, profileLoaded } = useAuth();
  const initialCheckDone = useRef(false);
  if (!loading && profileLoaded) initialCheckDone.current = true;

  useEffect(() => {
    if (!loading && profileLoaded && !user) {
      navigateTo({ name: 'login' });
    } else if (!loading && profileLoaded && user && !isAdmin) {
      navigateTo({ name: 'home' });
    }
  }, [loading, profileLoaded, user, isAdmin]);

  if (!initialCheckDone.current) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return <>{children}</>;
}
