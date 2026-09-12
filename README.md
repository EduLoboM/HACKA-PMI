# KrillShield v2.0 · Hackathon PMI-DF 2026

**Consolidação Operacional de Balcão do Crédito no Agro** — motor determinístico de
decisão de crédito que responde **sim/não** para cada operação, com cartaz de
decisão em três estados, trilha de auditoria e reescrita do laudo por LLM.

Projeto **SvelteKit 2** + **Svelte 5 (Runes)** + **TypeScript** + **UnoCSS** + **better-sqlite3**.

---

## 🧭 O produto

| Elemento | O que faz |
|---|---|
| **Poster de Decisão** | `FIADO` · `SÓ EXTRACONCURSAL` (instrumento nomeado) · `À VISTA` |
| **R$ Stay** | Reais que **morrem** vs **sobrevivem** em caso de insolvência (deságio 30%) |
| **Relógio 216** | < 2 anos de Junta = sinal `FORMALIZANDO`; ≥ 2 anos + LCDPR = `ELEGÍVEL RJ` |
| **Safra vs CPR** | Capacidade (área CAR × ZARC) contra volume comprometido da CPR; CPR física perde extraconcursalidade em déficit |
| **Cartaz do Starter Rex** | Se já há um sim na análise, Rex recebe **um sim de saída** |

Regras 100% determinísticas (`src/lib/krillshield/`). A LLM **só redige** o laudo
Espelho 216 (`/api/atendente`): usa Gemini Free via `GEMINI_API_KEY` quando definida,
senão cai num template determinístico — arquitetura pronta para trocar por watsonx.

---

## 🚀 Tecnologias

- **SvelteKit 2** — full-stack com SSR e roteamento (config em `vite.config.ts`)
- **Svelte 5** — reatividade via Runes (`$state`, `$derived`, `$effect`)
- **UnoCSS** — motor CSS atômico + reset + ícones `@iconify-json/lucide`
- **better-sqlite3** — SQLite síncrono, WAL mode, dados em `data/krillshield.db` (ignorado no git)
- **Autenticação** — sessão em cookie `httpOnly`, senha com hash **scrypt**, sessões no banco (expiráveis e revogáveis)

---

## 📋 Requisitos

- **Node.js ≥ 22** (testado em v22.23.0)
- `better-sqlite3` é um módulo nativo (compilado no `npm install`)

---

## 🔐 Autenticação

- `/login` e `/registro` — conta própria (email único, senha mín. 6, scrypt)
- **Conta demo** — botão "Entrar com conta demo" → `demo@krillshield.com.br`
- Sessão: cookie `krillshield_session` (httpOnly, 7 dias), revogada no logout
- Todas as APIs de dados exigem sessão válida (401 caso contrário)

---

## 🛠️ Comandos

```bash
npm install          # instalar dependências (compila better-sqlite3)
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
npm run dev -- --open

npm run check        # checagem de tipos + Svelte (svelte-check)
npm run check:watch  # checagem contínua

npm run build        # build otimizado de produção
npm run preview      # preview local da build de produção
```

### Configuração do LLM (opcional)

```bash
# .env (não versionado)
GEMINI_API_KEY=chave_do_gemini
```

Sem a chave, o Espelho 216 é redigido pelo template determinístico.

---

## 📁 Estrutura do Projeto

```text
├── src/
│   ├── app.d.ts                  # Tipagens globais (App.Locals.user)
│   ├── hooks.server.ts           # Carrega sessão em locals.user
│   ├── lib/
│   │   ├── krillshield/          # Motor determinístico (regras puras)
│   │   │   ├── types.ts          # Domínio: garantias, estados do cartaz
│   │   │   ├── rules.ts          # Relógio 216 + Safra vs CPR
│   │   │   ├── engine.ts         # analisar → R$ Stay + Poster de Decisão
│   │   │   └── atendente.ts      # Template do laudo Espelho 216
│   │   ├── server/
│   │   │   ├── db.ts             # SQLite (WAL, schema, consultas, auditoria)
│   │   │   ├── seed.ts           # Semeadura do demo (57 empresas)
│   │   │   ├── dadosDemo.ts      # Gerador determinístico de perfis
│   │   │   └── auth.ts           # scrypt + sessões + exigeAuth
│   │   └── components/           # PosterDeDecisao, StayVisor, RegraCard,
│   │                             # Espelho216, RexControl, ProducerForm
│   └── routes/
│       ├── +page.svelte          # Balcão (carteira, análise, CRUD, Rex Flip)
│       ├── +page.server.ts       # Load protegido + resumo dos estados
│       ├── login/  registro/     # Autenticação
│       └── api/
│           ├── auth/             # login · registro · logout · demo
│           ├── avaliar/          # Análise + auditoria (perfil override)
│           ├── produtor/         # CRUD da carteira
│           ├── atendente/        # Reescrita do Espelho 216 (LLM/fallback)
│           └── seed/             # Semear / forçar demo de 57 empresas
├── data/krillshield.db           # Banco SQLite (runtime, ignorado no git)
├── static/
├── uno.config.ts                 # Presets e extratores do UnoCSS
├── vite.config.ts                # Vite + SvelteKit + adapter-auto
└── tsconfig.json
```

---

## 🔌 API (resumo)

| Rota | Método | Descrição |
|---|---|---|
| `/api/auth/registro` | POST | Cria conta e abre sessão |
| `/api/auth/login` | POST | Login — retorna 401 se credenciais inválidas |
| `/api/auth/logout` | POST | Revoga sessão e limpa cookie |
| `/api/auth/demo` | POST | Entra com a conta de demonstração |
| `/api/avaliar` | POST | Analisa um produtor; aceita override `perfil` para cenários |
| `/api/produtor` | GET/POST | Lista / cria produtor |
| `/api/produtor/[id]` | GET/PUT/DELETE | Lê / edita / exclui produtor |
| `/api/atendente` | POST | Reescreve o laudo Espelho 216 (LLM + fallback) |
| `/api/seed` | POST | Semeia o banco; `{ force: true }` restaura o demo de 57 |

> Todas as APIs de dados exigem sessão (`Set-Cookie` do login).