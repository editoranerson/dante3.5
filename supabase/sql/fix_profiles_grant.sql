-- ============================================================
-- CORREÇÃO: "permission denied for table profiles" ao liberar plano
-- Causa: a tabela public.profiles não tem GRANT de UPDATE para o
-- papel `authenticated` (o PostgREST bloqueia antes mesmo do RLS).
-- Este script concede os privilégios e garante a policy de admin.
-- ============================================================

-- 1) Permissões de API (Data API) na tabela profiles
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2) Garante a função is_admin (SECURITY DEFINER, sem recursão de RLS)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- 3) RLS: admin pode ver e atualizar qualquer perfil;
--    usuário comum pode ver/atualizar apenas o próprio perfil.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "profiles_admin_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4) Confirmação rápida (opcional): liste as policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
