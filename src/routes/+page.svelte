<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<script lang="ts">
	let count = $state(0);

	const features = [
		{
			title: 'SvelteKit 2 & Svelte 5',
			description: 'Aproveite a nova reatividade de Runes ($state, $derived, $effect) com o poder do SvelteKit.',
			icon: 'i-lucide-sparkles'
		},
		{
			title: 'UnoCSS Instantâneo',
			description: 'Engine atômica ultrarrápida com reset do Tailwind, Typography e ícones sob demanda.',
			icon: 'i-lucide-zap'
		},
		{
			title: 'TypeScript 100%',
			description: 'Tipagem estrita configurada em todo o projeto para maior produtividade e segurança.',
			icon: 'i-lucide-shield-check'
		},
		{
			title: 'Vite 6+',
			description: 'Inicialização instantânea e Hot Module Replacement (HMR) ultrarrápido.',
			icon: 'i-lucide-rocket'
		}
	];
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
	<!-- Top Navigation / Header -->
	<header class="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
					H
				</span>
				<span class="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
					HACKA-PMI
				</span>
			</div>
			<div class="flex items-center gap-4 text-sm text-slate-400">
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					Svelte 5 + UnoCSS Ready
				</span>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<main class="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center">
		<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 mb-6">
			<span class="i-lucide-code-2 text-rose-400"></span>
			<span>Scaffolding inicial concluído com sucesso</span>
		</div>

		<h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight sm:leading-none mb-6">
			Construa com a velocidade do
			<span class="bg-gradient-to-r from-orange-400 via-rose-500 to-purple-500 bg-clip-text text-transparent">
				SvelteKit & UnoCSS
			</span>
		</h1>

		<p class="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
			Ambiente totalmente configurado com a última versão do SvelteKit, Svelte 5 Runes,
			UnoCSS atômico, suporte a ícones Iconify/Lucide e TypeScript.
		</p>

		<!-- Interactive Counter Card (Svelte 5 Runes) -->
		<div class="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl mb-16 flex flex-col items-center gap-4 max-w-sm w-full">
			<span class="text-xs uppercase font-semibold tracking-wider text-slate-400">
				Demonstração de Reatividade (Runes)
			</span>
			<div class="text-5xl font-black text-white tabular-nums">
				{count}
			</div>
			<div class="flex items-center gap-2 w-full justify-center">
				<button
					onclick={() => count--}
					class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition active:scale-95 border border-slate-700/60 flex items-center justify-center cursor-pointer"
					aria-label="Decrementar"
				>
					- 1
				</button>
				<button
					onclick={() => count = 0}
					class="px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 text-xs transition active:scale-95 border border-slate-700/40 cursor-pointer"
				>
					Reset
				</button>
				<button
					onclick={() => count++}
					class="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-medium transition active:scale-95 shadow-md shadow-rose-600/20 cursor-pointer"
					aria-label="Incrementar"
				>
					+ 1
				</button>
			</div>
		</div>

		<!-- Feature Cards Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left w-full">
			{#each features as feature}
				<div class="p-6 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-slate-750 transition duration-300 group hover:-translate-y-1">
					<div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 text-rose-400 group-hover:text-rose-300 group-hover:bg-slate-750 transition">
						<span class="{feature.icon} text-xl"></span>
					</div>
					<h3 class="text-base font-semibold text-white mb-2">{feature.title}</h3>
					<p class="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
				</div>
			{/each}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
		<div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div>HACKA-PMI &bull; Projeto inicializado com SvelteKit & UnoCSS</div>
			<div class="flex items-center gap-4">
				<a href="https://svelte.dev" target="_blank" rel="noreferrer" class="hover:text-slate-300 transition">Svelte</a>
				<a href="https://unocss.dev" target="_blank" rel="noreferrer" class="hover:text-slate-300 transition">UnoCSS</a>
				<a href="https://vite.dev" target="_blank" rel="noreferrer" class="hover:text-slate-300 transition">Vite</a>
			</div>
		</div>
	</footer>
</div>
