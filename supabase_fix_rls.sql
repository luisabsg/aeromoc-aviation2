-- ============================================================
-- AeroMoc Aviation — Correção de Políticas RLS
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- IMPORTANTE: Execute os comandos abaixo na seguinte ordem

-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Aluno vê seus agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Aluno cria agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuário atualiza agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "Instrutor gerencia bloqueios" ON public.bloqueios;

-- ============================================================
-- 2. Políticas CORRETAS para agendamentos
-- ============================================================

-- SELECT: Aluno vê seus agendamentos, Instrutor vê agendamentos seus
CREATE POLICY "Agendamentos SELECT"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (auth.uid() = aluno_id OR auth.uid() = instrutor_id);

-- INSERT: Aluno pode criar agendamento para si mesmo
CREATE POLICY "Agendamentos INSERT"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = aluno_id);

-- UPDATE: Aluno pode cancelar seu agendamento, Instrutor pode aceitar/recusar
CREATE POLICY "Agendamentos UPDATE"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (auth.uid() = aluno_id OR auth.uid() = instrutor_id)
  WITH CHECK (auth.uid() = aluno_id OR auth.uid() = instrutor_id);

-- ============================================================
-- 3. Políticas CORRETAS para bloqueios
-- ============================================================

-- SELECT: Qualquer autenticado pode ler bloqueios
CREATE POLICY "Bloqueios SELECT"
  ON public.bloqueios FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Instrutor pode criar bloqueios para si mesmo
CREATE POLICY "Bloqueios INSERT"
  ON public.bloqueios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instrutor_id);

-- UPDATE: Instrutor pode atualizar seus bloqueios
CREATE POLICY "Bloqueios UPDATE"
  ON public.bloqueios FOR UPDATE
  TO authenticated
  USING (auth.uid() = instrutor_id)
  WITH CHECK (auth.uid() = instrutor_id);

-- DELETE: Instrutor pode deletar seus bloqueios
CREATE POLICY "Bloqueios DELETE"
  ON public.bloqueios FOR DELETE
  TO authenticated
  USING (auth.uid() = instrutor_id);

-- ============================================================
-- PRONTO! As permissões agora devem funcionar corretamente.
-- ============================================================
