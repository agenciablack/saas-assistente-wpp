# Dashboard - Leads

Dashboard para gerenciamento de leads com integracoes Supabase e n8n.

## Tecnologias

- React 19 + TypeScript 5.8
- Vite 6
- Tailwind CSS 3
- Supabase (banco de dados, autenticacao, realtime)
- Recharts (graficos)
- date-fns (formatacao de datas)
- Lucide React (icones)

## Como rodar

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Preencha as variaveis no arquivo .env

# Rodar em desenvolvimento
npm run dev

# Build para producao
npm run build

# Preview do build
npm run preview
```

## Variaveis de ambiente

| Variavel | Descricao |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anonima do Supabase |
| `VITE_N8N_WEBHOOK_URL` | URL do webhook n8n para envios em massa |

## Estrutura de pastas

```
src/
├── components/          # Componentes reutilizaveis
│   ├── envios/          # Componentes da pagina de envios em massa
│   ├── MetricCard.tsx   # Card de metrica do dashboard
│   ├── PageHeader.tsx   # Cabecalho de pagina
│   ├── Sidebar.tsx      # Navegacao lateral
│   ├── LeadBadge.tsx    # Badge de status do lead
│   └── Toast.tsx        # Componente de notificacao toast
├── context/
│   └── AuthContext.tsx   # Contexto de autenticacao (Supabase Auth)
├── hooks/               # Hooks customizados
│   ├── useAuth.ts       # Autenticacao
│   ├── useConfiguracoes.ts  # Preferencias do usuario
│   ├── useDashboard.ts  # Metricas e dados do dashboard
│   ├── useEnvioMassa.ts # Envios em massa + webhook n8n
│   ├── useFunil.ts      # Funil de vendas
│   ├── useHistoricoEnvios.ts # Historico de envios
│   ├── useLeads.ts      # Listagem de leads com paginacao
│   ├── useNotificacoes.ts   # Notificacoes realtime
│   ├── useTemplates.ts  # CRUD de templates de mensagem
│   └── useToast.ts      # Gerenciamento de estado do toast
├── lib/
│   └── supabase.ts      # Cliente Supabase
├── pages/               # Paginas da aplicacao
│   ├── Dashboard.tsx    # Painel principal com metricas
│   ├── Leads.tsx        # Listagem de leads
│   ├── Funil.tsx        # Funil de vendas (kanban)
│   ├── Envios.tsx       # Novo envio em massa
│   ├── HistoricoEnvios.tsx  # Historico de envios
│   ├── Templates.tsx    # Gerenciamento de templates
│   ├── Configuracoes.tsx # Configuracoes do usuario
│   ├── Notificacoes.tsx # Lista de notificacoes
│   └── Login.tsx        # Tela de login
├── types/               # Definicoes de tipos TypeScript
│   ├── database.ts      # Tipos das tabelas Supabase
│   ├── envios.ts        # Tipos de envios em massa
│   └── index.ts         # Tipos gerais da aplicacao
├── utils/               # Funcoes utilitarias
│   ├── cn.ts            # Merge de classes CSS (clsx + tailwind-merge)
│   ├── formatters.ts    # Formatacao de datas, telefones, status
│   └── retry.ts         # Retry com backoff exponencial
├── App.tsx              # Rotas e layout principal
└── main.tsx             # Entry point
```

## Funcionalidades

- **Dashboard**: Metricas em tempo real, grafico de leads por periodo, lista de leads do dia
- **Leads**: Listagem com busca, filtros por status, paginacao
- **Funil**: Visualizacao kanban com drag conceptual por status
- **Envios em Massa**: Selecao de leads por status/periodo, templates de mensagem, integracao n8n
- **Templates**: CRUD de modelos de mensagem reutilizaveis
- **Notificacoes**: Alertas em tempo real via Supabase Realtime
- **Configuracoes**: Perfil, senha, preferencias de notificacao

## Supabase Realtime

O dashboard usa canais Realtime do Supabase para atualizar automaticamente:
- Tabela `leads` (dashboard, funil, listagem de leads)
- Tabela `notificacoes` (badge e lista de notificacoes)
