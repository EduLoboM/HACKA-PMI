<script lang="ts">
	let { texto, provedor, carregando, onRegredigir } = $props<{
		texto: string;
		provedor: string;
		carregando: boolean;
		onRegredigir: () => void;
	}>();
</script>

<div class="w-full rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
	<div class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60">
		<div class="flex items-center gap-2">
			<span class="i-lucide-file-text text-slate-400"></span>
			<span class="text-sm font-bold text-slate-200">Espelho 216 — Laudo de Tela Única</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-slate-700 bg-slate-800/80 text-slate-300">
				<span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
				{provedor}
			</span>
			<button
				type="button"
				onclick={onRegredigir}
				class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
			>
				Redigir com Atendente
			</button>
		</div>
	</div>

	<div class="relative">
		{#if carregando}
			<div class="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10">
				<span class="i-lucide-loader-2 text-slate-400 text-2xl animate-spin"></span>
			</div>
		{/if}
		<pre class="text-[11px] leading-relaxed text-slate-400 font-mono p-5 whitespace-pre-wrap break-words max-h-105 overflow-y-auto">{texto}</pre>
	</div>
</div>