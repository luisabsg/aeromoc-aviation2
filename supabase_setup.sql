-- ============================================================
-- AeroMoc Aviation — Supabase SQL Setup
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela profiles (caso ainda não exista ou precise de ajustes)
-- Garante que a tabela profiles tenha o campo id vinculado ao auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('professor', 'aluno')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas da tabela profiles
-- Qualquer usuário autenticado pode ler perfis (para listar instrutores)
CREATE POLICY IF NOT EXISTS "Perfis visíveis para autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuário pode atualizar apenas o próprio perfil
CREATE POLICY IF NOT EXISTS "Usuário atualiza próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Tabela agendamentos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instrutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'aceito', 'recusado')),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_aluno ON public.agendamentos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_instrutor ON public.agendamentos(instrutor_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);

-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas da tabela agendamentos
-- Aluno vê seus próprios agendamentos
CREATE POLICY IF NOT EXISTS "Aluno vê seus agendamentos"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (auth.uid() = aluno_id OR auth.uid() = instrutor_id);

-- Aluno pode criar agendamento (apenas como aluno_id = seu próprio id)
CREATE POLICY IF NOT EXISTS "Aluno cria agendamento"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = aluno_id);

-- Aluno pode cancelar (update status) seus próprios agendamentos aguardando
-- Instrutor pode aceitar/recusar agendamentos seus
CREATE POLICY IF NOT EXISTS "Usuário atualiza agendamento"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (auth.uid() = aluno_id OR auth.uid() = instrutor_id);

-- ============================================================
-- 3. Tabela bloqueios
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT horario_valido CHECK (horario_fim > horario_inicio)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bloqueios_instrutor ON public.bloqueios(instrutor_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_data ON public.bloqueios(data);

-- Habilitar RLS
ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;

-- Políticas da tabela bloqueios
-- Qualquer autenticado pode ler bloqueios (para verificar disponibilidade)
CREATE POLICY IF NOT EXISTS "Bloqueios visíveis para autenticados"
  ON public.bloqueios FOR SELECT
  TO authenticated
  USING (true);

-- Instrutor gerencia seus próprios bloqueios
CREATE POLICY IF NOT EXISTS "Instrutor gerencia bloqueios"
  ON public.bloqueios FOR ALL
  TO authenticated
  USING (auth.uid() = instrutor_id)
  WITH CHECK (auth.uid() = instrutor_id);

-- ============================================================
-- NOTAS IMPORTANTES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Para criar usuários instrutores, use o Supabase Auth Dashboard
--    e defina role = 'professor' na tabela profiles manualmente
--    ou passe no metadata: { "role": "professor", "nome": "Gilson" }
-- 3. O campo horario na tabela agendamentos é do tipo TIME
--    O app envia no formato "HH:MM" (ex: "05:00", "14:30")
-- ============================================================
