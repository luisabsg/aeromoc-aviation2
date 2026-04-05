-- ============================================================
-- AeroMoc Aviation — Tabela de Notificações
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'aviso', 'urgente')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_instrutor ON public.notificacoes(instrutor_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_ativo ON public.notificacoes(ativo);

-- 3. Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Qualquer autenticado pode ler notificações (para ver as ativas)
CREATE POLICY IF NOT EXISTS "Notificacoes SELECT"
  ON public.notificacoes FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Instrutor pode criar notificações para si mesmo
CREATE POLICY IF NOT EXISTS "Notificacoes INSERT"
  ON public.notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instrutor_id);

-- Instrutor pode atualizar suas notificações
CREATE POLICY IF NOT EXISTS "Notificacoes UPDATE"
  ON public.notificacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() = instrutor_id)
  WITH CHECK (auth.uid() = instrutor_id);

-- Instrutor pode deletar suas notificações
CREATE POLICY IF NOT EXISTS "Notificacoes DELETE"
  ON public.notificacoes FOR DELETE
  TO authenticated
  USING (auth.uid() = instrutor_id);

-- ============================================================
-- PRONTO! Tabela criada com sucesso.
-- ============================================================
