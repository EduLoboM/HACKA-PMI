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

<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs w-full min-w-0">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
				<span class="i-lucide-flask-conical text-base"></span>
			</div>
			<div>
				<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
					Análise de Sensibilidade Contratual
				</span>
				<h4 class="text-sm font-bold text-slate-900 tracking-tight">
					Laboratório de Estresse — Simulação Rex Flip
				</h4>
			</div>
		</div>
		<div class="flex items-center gap-2 w-full sm:w-auto">
			<button
				type="button"
				onclick={onToggle}
				class="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer w-full sm:w-auto shadow-xs {flipAtivo
					? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 ring-2 ring-rose-200'
					: 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'}"
			>
				<span class="{flipAtivo ? 'i-lucide-rotate-ccw' : 'i-lucide-sliders'} text-xs"></span>
				<span>{flipAtivo ? 'Restaurar Parâmetros Base' : 'Aplicar Inversão de Risco'}</span>
			</button>
		</div>
	</div>

	<!-- Comparative Table -->
	<div class="overflow-x-auto rounded-xl border border-slate-100 w-full max-w-full [-webkit-overflow-scrolling:touch]">
		<div class="sm:hidden px-3 py-1 bg-slate-50 text-[10px] text-slate-500 font-mono flex items-center justify-between border-b border-slate-100">
			<span>Deslize a simulação para comparar cenários →</span>
		</div>
		<table class="w-full text-xs min-w-[460px]">
			<thead>
				<tr class="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/60 font-mono">
					<th class="py-2.5 px-3 text-left">Variável Testada</th>
					<th class="py-2.5 px-3 text-right">Cenário Cadastrado (Base)</th>
					<th class="py-2.5 px-3 text-right">Cenário sob Estresse (Flip)</th>
					<th class="py-2.5 px-3 text-right">Impacto Jurídico</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100 font-mono">
				<tr class="hover:bg-slate-50/50 transition-colors">
					<td class="py-3 px-3 font-sans font-semibold text-slate-700">Formalização Junta Comercial</td>
					<td class="py-3 px-3 text-right font-bold text-slate-900">{anosDesde(perfilBase.dataRegistroJunta)} anos</td>
					<td class="py-3 px-3 text-right font-bold {flipAtivo ? 'text-rose-700' : 'text-slate-400'}">0.5 anos (&lt; 2 anos)</td>
					<td class="py-3 px-3 text-right font-sans text-[11px] {flipAtivo ? 'text-rose-700 font-bold' : 'text-slate-500'}">
						{flipAtivo ? 'Inscrição recente arma pedido futuro de RJ' : 'Prazo de 2 anos atendido'}
					</td>
				</tr>
				<tr class="hover:bg-slate-50/50 transition-colors">
					<td class="py-3 px-3 font-sans font-semibold text-slate-700">Área Declarada no CAR</td>
					<td class="py-3 px-3 text-right font-bold text-slate-900">{formatarNumero(perfilBase.areaPlantadaCAR)} ha</td>
					<td class="py-3 px-3 text-right font-bold {flipAtivo ? 'text-rose-700' : 'text-slate-400'}">400 ha</td>
					<td class="py-3 px-3 text-right font-sans text-[11px] {flipAtivo ? 'text-rose-700 font-bold' : 'text-slate-500'}">
						{flipAtivo ? 'Redução severa da lavoura fiscalizável' : 'Área condizente com o histórico'}
					</td>
				</tr>
				<tr class="hover:bg-slate-50/50 transition-colors">
					<td class="py-3 px-3 font-sans font-semibold text-slate-700">Capacidade ZARC vs CPR</td>
					<td class="py-3 px-3 text-right font-bold {coberturaBase ? 'text-emerald-700' : 'text-rose-700'}">
						{formatarNumero(capacidadeBase)} sc ({coberturaBase ? 'Superávit' : 'Déficit'})
					</td>
					<td class="py-3 px-3 text-right font-bold {coberturaFlip ? 'text-emerald-700' : 'text-rose-700'}">
						{formatarNumero(capacidadeFlip)} sc ({coberturaFlip ? 'Superávit' : 'Déficit'})
					</td>
					<td class="py-3 px-3 text-right font-sans text-[11px] {flipAtivo ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}">
						{flipAtivo ? 'CPR física rebaixada a quirografária' : 'Entrega física garantida'}
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="text-[11px] text-slate-500 leading-normal pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 font-mono">
		<span class="flex items-center gap-1 text-slate-400">
			<span class="i-lucide-info text-xs"></span>
			Simulação volátil em memória. Não altera dados no banco de dados.
		</span>
		<span class="font-bold px-2.5 py-0.5 rounded-full text-[10px] {flipAtivo ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
			Status: {flipAtivo ? 'Simulação Ativa (Estresse)' : 'Parâmetros Reais (Base)'}
		</span>
	</div>
</div>