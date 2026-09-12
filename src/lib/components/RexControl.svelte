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
		if (Number.isNaN(a) || Number.isNaN(b)) return '0.0';
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
</script>

<div class="bg-white border border-slate-200 shadow-sm overflow-hidden">
	<div class="h-9 px-3 flex items-center gap-2 border-b border-slate-200 bg-slate-50/80">
		<div class="flex items-center gap-1.5 shrink-0">
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
		</div>
		<div class="w-px h-3 bg-slate-200 shrink-0"></div>
		<span class="i-lucide-sliders text-slate-500 shrink-0"></span>
		<span class="text-[10px] font-bold uppercase tracking-wider text-slate-600 min-w-0 truncate">
			Laboratório de Estresse — Simulação Rex Flip
		</span>
		<button
			type="button"
			onclick={onToggle}
			class="ml-auto shrink-0 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border transition-colors duration-150 cursor-pointer {flipAtivo
				? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
				: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}"
		>
			<span class="{flipAtivo ? 'i-lucide-rotate-ccw' : 'i-lucide-sliders'} text-xs"></span>
			<span>{flipAtivo ? 'Restaurar Parâmetros Base' : 'Aplicar Inversão de Risco'}</span>
		</button>
	</div>

	<div class="p-4 sm:p-5 space-y-4">

	<!-- Comparative Table -->
	<div class="overflow-x-auto">
		<table class="w-full text-xs min-w-[500px]">
			<thead>
				<tr class="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
					<th class="py-2 text-left">Variável Testada</th>
					<th class="py-2 text-right">Cenário Cadastrado (Base)</th>
					<th class="py-2 text-right">Cenário sob Estresse (Flip)</th>
					<th class="py-2 text-right">Impacto Jurídico</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100 font-mono">
				<tr>
					<td class="py-2.5 font-sans font-medium text-slate-700">Formalização Junta Comercial</td>
					<td class="py-2.5 text-right font-bold text-slate-900">{anosDesde(perfilBase.dataRegistroJunta)} anos</td>
					<td class="py-2.5 text-right font-bold {flipAtivo ? 'text-rose-700' : 'text-slate-500'}">0.5 anos (&lt; 2 anos)</td>
					<td class="py-2.5 text-right font-sans text-[11px] {flipAtivo ? 'text-rose-700 font-semibold' : 'text-slate-500'}">
						{flipAtivo ? 'Inscrição recente arma pedido futuro de RJ' : 'Prazo de 2 anos atendido'}
					</td>
				</tr>
				<tr>
					<td class="py-2.5 font-sans font-medium text-slate-700">Área Declarada no CAR</td>
					<td class="py-2.5 text-right font-bold text-slate-900">{formatarNumero(perfilBase.areaPlantadaCAR)} ha</td>
					<td class="py-2.5 text-right font-bold {flipAtivo ? 'text-rose-700' : 'text-slate-500'}">400 ha</td>
					<td class="py-2.5 text-right font-sans text-[11px] {flipAtivo ? 'text-rose-700 font-semibold' : 'text-slate-500'}">
						{flipAtivo ? 'Redução severa da lavoura fiscalizável' : 'Área condizente com o histórico'}
					</td>
				</tr>
				<tr>
					<td class="py-2.5 font-sans font-medium text-slate-700">Capacidade ZARC vs CPR</td>
					<td class="py-2.5 text-right font-bold {coberturaBase ? 'text-emerald-700' : 'text-rose-700'}">
						{formatarNumero(capacidadeBase)} sc ({coberturaBase ? 'Superávit' : 'Déficit'})
					</td>
					<td class="py-2.5 text-right font-bold {coberturaFlip ? 'text-emerald-700' : 'text-rose-700'}">
						{formatarNumero(capacidadeFlip)} sc ({coberturaFlip ? 'Superávit' : 'Déficit'})
					</td>
					<td class="py-2.5 text-right font-sans text-[11px] {flipAtivo ? 'text-rose-700 font-semibold' : 'text-emerald-700 font-semibold'}">
						{flipAtivo ? 'CPR física rebaixada a quirografária' : 'Entrega física garantida'}
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="text-[11px] text-slate-500 leading-normal pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
		<span>Simulação executada em memória. Não altera dados cadastrados no banco.</span>
		<span class="font-mono font-bold {flipAtivo ? 'text-rose-700' : 'text-slate-600'}">
			Status: {flipAtivo ? 'Simulação Ativa' : 'Parâmetros Reais'}
		</span>
	</div>
	</div>
</div>