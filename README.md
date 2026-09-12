# HACKA-PMI

Projeto desenvolvido com **SvelteKit**, **Svelte 5 (Runes)**, **TypeScript**, **Vite** e **UnoCSS**.

---

## 🚀 Tecnologias

- **[SvelteKit](https://svelte.dev/docs/kit)**: Framework full-stack para Svelte com SSR e roteamento.
- **[Svelte 5](https://svelte.dev/docs/svelte/overview)**: Nova reatividade baseada em Runes (`$state`, `$derived`, `$effect`).
- **[UnoCSS](https://unocss.dev/)**: Motor CSS atômico ultrarrápido com reset Tailwind e ícones via `@iconify-json/lucide`.
- **[Vite](https://vite.dev/)**: Bundler de última geração com HMR instantâneo.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática em todo o projeto.

---

## 🛠️ Comandos Disponíveis

### Instalação de Dependências
```bash
npm install
```

### Ambiente de Desenvolvimento
Inicia o servidor Vite local:
```bash
npm run dev
# ou para abrir direto no navegador:
npm run dev -- --open
```

### Checagem de Tipos e Svelte
Valida os tipos TypeScript e componentes Svelte:
```bash
npm run check
```

### Build de Produção
Gera os artefatos otimizados para produção:
```bash
npm run build
```

### Preview da Produção
Testa localmente a versão compilada de produção:
```bash
npm run preview
```

---

## 📁 Estrutura do Projeto

```text
├── src/
│   ├── app.d.ts             # Tipagens globais do SvelteKit
│   ├── app.html             # Template HTML base
│   ├── lib/                 # Componentes e módulos compartilhados ($lib)
│   └── routes/              # Rotas e páginas da aplicação
│       ├── +layout.svelte   # Layout raiz (estilos UnoCSS e head global)
│       └── +page.svelte     # Página inicial (home)
├── static/                  # Arquivos estáticos servidos diretamente
├── svelte.config.js         # Configurações do Svelte
├── uno.config.ts            # Configurações de presets e extratores do UnoCSS
├── vite.config.ts           # Configuração do Vite e plugins
└── tsconfig.json            # Configuração do TypeScript
```
