# AeroMoc Aviation — Ideias de Design

## Contexto
App de agendamento de aulas de voo. Cores da marca: Azul Navy (#1B2A6B), Vermelho (#E8192C), Cinza escuro (#4A4A4A).
Público: alunos e instrutores de aviação. Foco em praticidade, clareza e confiança.

---

<response>
<idea>

**Design Movement:** Aviation Command Center — Inspirado em painéis de cockpit e interfaces de controle de tráfego aéreo.

**Core Principles:**
- Hierarquia de informação clara como um painel de instrumentos
- Contraste alto entre fundo escuro e elementos iluminados
- Precisão e confiança visual — cada elemento tem propósito
- Dados sempre visíveis e legíveis, sem ruído visual

**Color Philosophy:**
Fundo azul navy profundo (#0D1B3E) com o azul da marca (#1B2A6B) como superfície de cards. Vermelho (#E8192C) como cor de ação e destaque. Branco puro para texto primário. Cinza médio para texto secundário. Sensação de autoridade e precisão técnica.

**Layout Paradigm:**
Sidebar fixa à esquerda com navegação vertical. Área de conteúdo principal à direita com grid assimétrico. Header minimalista com nome do usuário e logout. Calendário ocupa posição central de destaque.

**Signature Elements:**
- Linha fina vermelha como separador/acento em cards e títulos
- Ícones de aviação (avião, rota, horário) em estilo outline
- Badges de status com cores sólidas e tipografia em caps

**Interaction Philosophy:**
Transições suaves mas rápidas (150-200ms). Hover states com leve elevação de card. Feedback imediato em ações críticas (confirmar, cancelar).

**Animation:**
Fade-in suave ao carregar páginas. Slide-in lateral para modais. Pulse sutil em badges "aguardando".

**Typography System:**
- Display/Títulos: `Barlow Condensed` Bold — forte, técnico, aeronáutico
- Corpo: `Inter` Regular/Medium — legível e moderno
- Badges/Labels: `Barlow Condensed` Semibold em maiúsculas

</idea>
<probability>0.08</probability>
</response>

<response>
<idea>

**Design Movement:** Clean Aviation Dashboard — Minimalismo funcional com toques de identidade da marca.

**Core Principles:**
- Fundo branco/cinza claro para máxima legibilidade
- Azul navy como cor primária de ação e navegação
- Vermelho restrito a alertas e status negativos
- Espaçamento generoso, sem poluição visual

**Color Philosophy:**
Background branco (#FFFFFF) e cinza muito claro (#F4F6FA) para superfícies. Azul navy (#1B2A6B) para sidebar, botões primários e cabeçalhos. Vermelho (#E8192C) apenas para status "recusado" e ações destrutivas. Verde (#16A34A) para "aceito". Amarelo âmbar (#D97706) para "aguardando".

**Layout Paradigm:**
Sidebar esquerda azul navy com ícones e labels brancos. Área de conteúdo branca/cinza claro. Cards com sombra suave. Header com logo e nome do usuário logado.

**Signature Elements:**
- Sidebar com gradiente sutil do navy para azul médio
- Cards com borda esquerda colorida indicando status
- Avatar/inicial do usuário no canto superior direito

**Interaction Philosophy:**
Botões com estados hover claros. Formulários com validação em tempo real. Confirmações via toast no canto inferior.

**Animation:**
Transições de página com fade (200ms). Cards com hover elevação (shadow increase). Skeleton loading para dados assíncronos.

**Typography System:**
- Títulos: `Barlow` Bold/Semibold
- Corpo: `Inter` Regular
- Números/Horários: `Barlow Condensed` Medium

</idea>
<probability>0.09</probability>
</response>

<response>
<idea>

**Design Movement:** Tactical Flight Operations — Interface inspirada em sistemas de operações de voo militares/comerciais com estética de alta precisão.

**Core Principles:**
- Grid rígido e alinhamento preciso como um plano de voo
- Tipografia condensada para densidade de informação
- Cores funcionais — cada cor tem significado único e consistente
- Estrutura assimétrica com áreas de foco bem delimitadas

**Color Philosophy:**
Fundo off-white (#F8F9FC) com cards brancos. Azul navy (#1B2A6B) como cor estrutural (sidebar, headers). Vermelho (#E8192C) como acento de marca em elementos-chave (logo, CTA principal). Linha de separação fina em cinza (#E2E8F0). Status com cores semânticas fortes.

**Layout Paradigm:**
Sidebar estreita com apenas ícones (expandível). Top bar com breadcrumb e ações contextuais. Conteúdo em layout de duas colunas onde aplicável (lista + detalhe). Calendário em grid compacto com indicadores de densidade.

**Signature Elements:**
- Barra de progresso/indicador de status no topo da página
- Tags de status com forma de "runway" (bordas arredondadas assimétricas)
- Separadores com padrão de linha tracejada (como pistas de pouso)

**Interaction Philosophy:**
Micro-animações em transições de estado. Drag-to-confirm em ações críticas. Tooltips informativos em elementos de status.

**Animation:**
Slide-up para novos cards. Contador animado em badges de notificação. Transição de cor suave em mudanças de status.

**Typography System:**
- Títulos: `Oswald` Bold — forte presença, estilo aeronáutico
- Corpo: `Source Sans 3` Regular
- Dados técnicos: `Roboto Mono` para horários e IDs

</idea>
<probability>0.07</probability>
</response>

---

## Design Escolhido

**Opção 2: Clean Aviation Dashboard**

Filosofia clara, sidebar navy, cards com borda de status colorida, tipografia Barlow + Inter. Máxima legibilidade e identidade de marca forte.
