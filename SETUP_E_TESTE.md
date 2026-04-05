# AeroMoc Aviation — Guia de Setup e Teste

## 1. CORRIGIR PERMISSÕES NO SUPABASE ⚠️

**IMPORTANTE:** Execute este SQL para corrigir os erros de agendamento e bloqueio.

### Passo 1: Ir ao SQL Editor do Supabase
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Clique em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**

### Passo 2: Copiar e executar o SQL

Copie TODO o conteúdo abaixo e cole no SQL Editor:

```sql
-- ============================================================
-- AeroMoc Aviation — Correção de Políticas RLS
-- ============================================================

DROP POLICY IF EXISTS "Aluno vê seus agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Aluno cria agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuário atualiza agendamento" ON public.agendamentos;
DROP POLICY IF EXISTS "Instrutor gerencia bloqueios" ON public.bloqueios;

-- Políticas CORRETAS para agendamentos
CREATE POLICY "Agendamentos SELECT"
  ON public.agendamentos FOR SELECT
  TO authenticated
  USING (auth.uid() = aluno_id OR auth.uid() = instrutor_id);

CREATE POLICY "Agendamentos INSERT"
  ON public.agendamentos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Agendamentos UPDATE"
  ON public.agendamentos FOR UPDATE
  TO authenticated
  USING (auth.uid() = aluno_id OR auth.uid() = instrutor_id)
  WITH CHECK (auth.uid() = aluno_id OR auth.uid() = instrutor_id);

-- Políticas CORRETAS para bloqueios
CREATE POLICY "Bloqueios SELECT"
  ON public.bloqueios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Bloqueios INSERT"
  ON public.bloqueios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instrutor_id);

CREATE POLICY "Bloqueios UPDATE"
  ON public.bloqueios FOR UPDATE
  TO authenticated
  USING (auth.uid() = instrutor_id)
  WITH CHECK (auth.uid() = instrutor_id);

CREATE POLICY "Bloqueios DELETE"
  ON public.bloqueios FOR DELETE
  TO authenticated
  USING (auth.uid() = instrutor_id);
```

### Passo 3: Clicar em **Run**

Se aparecer "Success", tudo está correto! ✅

---

## 2. CRIAR USUÁRIOS DE TESTE

### Usuário ALUNO
1. No Supabase, vá em **Authentication** → **Users**
2. Clique em **Add user**
3. Preencha:
   - **Email:** aluno@test.com
   - **Password:** senha123
4. Clique em **Create user**
5. Vá em **SQL Editor** e execute:

```sql
UPDATE public.profiles 
SET nome = 'João Silva', role = 'aluno' 
WHERE email = 'aluno@test.com';
```

### Usuário INSTRUTOR
1. Clique em **Add user** novamente
2. Preencha:
   - **Email:** instrutor@test.com
   - **Password:** senha123
3. Clique em **Create user**
4. Vá em **SQL Editor** e execute:

```sql
UPDATE public.profiles 
SET nome = 'Gilson', role = 'professor' 
WHERE email = 'instrutor@test.com';
```

---

## 3. TESTAR O APP

### Login como Aluno
1. Acesse o app: https://aeromocfly-vrse3ygr.manus.space (ou localhost:3000)
2. Clique em **Entrar**
3. Digite:
   - Email: `aluno@test.com`
   - Senha: `senha123`
4. Clique em **Entrar**

**Você deve ver:**
- ✅ Dashboard com cards (Próximas Aulas, Aguardando, Recusadas)
- ✅ Menu lateral com: Dashboard, Novo Agendamento, Meus Agendamentos, Calendário

### Testar Novo Agendamento
1. Clique em **Novo Agendamento**
2. Preencha:
   - **Data:** Escolha uma data futura
   - **Instrutor:** Selecione "Gilson"
   - **Horário:** Escolha um horário (ex: 05:00)
3. Clique em **Solicitar Aula**

**Esperado:**
- ✅ Mensagem "Aula solicitada com sucesso!"
- ✅ Agendamento aparece em "Meus Agendamentos" com status "Aguardando"

### Login como Instrutor
1. Faça logout (clique em **Sair** no menu)
2. Clique em **Entrar**
3. Digite:
   - Email: `instrutor@test.com`
   - Senha: `senha123`
4. Clique em **Entrar**

**Você deve ver:**
- ✅ Menu lateral com: Solicitações, Calendário, Bloqueios

### Testar Aceitar Agendamento
1. Clique em **Solicitações**
2. Você deve ver a aula que o aluno solicitou
3. Clique em **Aceitar**

**Esperado:**
- ✅ Mensagem "Agendamento aceito com sucesso!"
- ✅ Status muda para "Aceito" (verde)

### Testar Bloqueios
1. Clique em **Bloqueios**
2. Preencha:
   - **Data:** Escolha uma data
   - **Horário Inicial:** 05:00
   - **Horário Final:** 07:00
   - **Motivo:** Manutenção da aeronave
3. Clique em **Cadastrar Bloqueio**

**Esperado:**
- ✅ Mensagem "Bloqueio cadastrado com sucesso!"
- ✅ Bloqueio aparece na lista

### Testar se Bloqueio Funciona
1. Faça logout e entre como aluno
2. Clique em **Novo Agendamento**
3. Selecione a mesma data e instrutor
4. Tente selecionar um horário entre 05:00 e 07:00

**Esperado:**
- ✅ Esses horários NÃO aparecem na lista (bloqueados)

---

## 4. CHECKLIST DE TESTES

- [ ] Login como aluno funciona
- [ ] Login como instrutor funciona
- [ ] Dashboard do aluno mostra resumo
- [ ] Aluno consegue criar agendamento
- [ ] Agendamento aparece em "Meus Agendamentos"
- [ ] Instrutor vê solicitação em "Solicitações"
- [ ] Instrutor consegue aceitar agendamento
- [ ] Instrutor consegue criar bloqueio
- [ ] Bloqueios aparecem na lista
- [ ] Aluno não consegue agendar em horário bloqueado
- [ ] Calendário mostra aulas
- [ ] Logout funciona

---

## 5. POSSÍVEIS ERROS E SOLUÇÕES

### Erro: "Erro ao criar agendamento"
**Solução:** Execute o SQL de correção de permissões (passo 1)

### Erro: "Erro ao salvar bloqueio"
**Solução:** Execute o SQL de correção de permissões (passo 1)

### Usuário não aparece em profiles
**Solução:** Execute o UPDATE manual (passo 2)

### Horários não aparecem no select
**Solução:** Verifique se o instrutor tem bloqueios naquele dia

---

## 6. CONTATO

Se tiver dúvidas ou erros não listados aqui, verifique:
1. Console do navegador (F12 → Console)
2. Logs do Supabase (SQL Editor → Query Performance)
3. Tabelas do Supabase (Table Editor)

Bom teste! ✈️
