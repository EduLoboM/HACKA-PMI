<script lang="ts">
	import type { PerfilProdutor } from '$lib/krillshield/types';
	import { formatarNumero } from '$lib/krillshield/types';

	let { perfilBase, flipAtivo, onToggle } = $props<{
		perfilBase: PerfilProdutor;
		flipAtivo: boolean;
		onToggle: () => void;
	}>();

	function anosDesde(iso: string, ref = new Date().toISOString()) {
		const a = new Date(iso).getTime();
		const b = new Date(ref).getTime();
		if (Number.isNaN(a) || Number.isNaN(b)) return 0;
		return ((b - a) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
	}

	let flipado = $derived.by(() => ({
		...perfilBase,
		dataRegistroJunta: '2025-11-01',
		areaPlantadaCAR: 400
	}));

	let capacidadeBase = $derived(perfilBase.areaPlantadaCAR * perfilBase.produtividadeZarc);
	let capacidadeFlip = $derived(flipado.areaPlantadaCAR * perfilBase.produtividadeZarc);
	let coberturaBase = $derived(capacidadeBase >= perfilBase.volumeComprometidoCPR);
	let coberturaFlip = $derived(capacidadeFlip >= perfilBase.volumeComprometidoCPR);

	const verde = 'text-emerald-400';
	const vermelho = 'text-rose-400';
	let corBase = $derived(coberturaBase ? verde : vermelho);
	let corFlip = $derived(coberturaFlip ? verde : vermelho);
</script>

<div class="w-full rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
	<div class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-gradient-to-r from-rose-500/10 to-orange-500/10">
		<div class="flex items-center gap-2">
			<span class="i-lucide-flip-vertical text-rose-400"></span>
			<span class="text-sm font-bold text-slate-200">Demo de Balcão — Rex Flip</span>
		</div>
		<span class="text-[10px] uppercase tracking-wider text-slate-500">Teste de Inversão de Garantia</span>
	</div>

	<div class="p-5">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-800 rounded-xl overflow-hidden">
			<div class="bg-slate-900/80 p-4">
				<span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block">Estado inicial</span>
				<div class="space-y-2 text-xs text-slate-400">
					<div class="flex justify-between gap-2">
						<span>Junta Comercial</span>
						<span class="font-semibold text-slate-200 tabular-nums">{anosDesde(perfilBase.dataRegistroJunta)} anos</span>
					</div>
					<div class="flex justify-between gap-2">
						<span>Área plantada (CAR)</span>
						<span class="font-semibold text-slate-200 tabular-nums">{formatarNumero(perfilBase.areaPlantadaCAR)} ha</span>
					</div>
					<div class="flex justify-between gap-2">
						<span>Capacidade estimada</span>
						<span class="font-semibold {corBase} tabular-nums">{formatarNumero(capacidadeBase)} sc</span>
					</div>
					<div class="flex justify-between gap-2">
						<span>Cobertura vs CPR</span>
						<span class="font-semibold {corBase}">{coberturaBase ? 'OK' : 'Déficit'}</span>
					</div>
				</div>
			</div>
			<div class="bg-slate-900/80 p-4">
				<span class="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2 block">Após o Rex Flip</span>
				<div class="space-y-2 text-xs text-slate-400">
					<div class="flex justify-between gap-2">
						<span>Junta Comercial</span>
						<span class="font-semibold text-slate-200 tabular-nums">0.5 anos (&lt; 2)</span>
					</div>
					<div class="flex justify-between gap-2">
						<span>Área plantada (CAR)</span>
						<span class="font-semibold text-slate-200 tabular-nums">400 ha</span>
					</div>
					<div class="flex justify-between gap-2">
						<span>Capacidade estimada</span>
						<span class="font-semibold {corFlip} tabular-nums">{formatarNumero(capacidadeFlip)} sc</span>
					</div>
					<div class="flex justify-between gap-2">
						<span>Cobertura vs CPR</span>
						<span class="font-semibold {corFlip}">{coberturaFlip ? 'OK' : 'Déficit'}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
			<p class="text-[11px] text-slate-500 leading-relaxed">
				Se a RJ cair amanhã: <span class="text-slate-300">garantia e reais mudam — não o modelo.</span>
				Relógio (formalização recente) + área &lt; volume CPR rebaixam a proteção e o cartaz vira.
			</p>
			<button
				type="button"
				onclick={onToggle}
				class="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition active:scale-95 cursor-pointer border shadow-lg {flipAtivo
					? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 shadow-rose-500/10'
					: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-emerald-500/10'}"
			>
				{flipAtivo ? '↩ Desfazer Rex Flip' : '⚡ Executar Rex Flip'}
			</button>
		</div>
	</div>
</div>