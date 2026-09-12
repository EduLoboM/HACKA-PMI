<script lang="ts">
	import type { CalculoStay } from '$lib/krillshield/types';
	import { formatarBRL } from '$lib/krillshield/types';

	let { stay } = $props<{ stay: CalculoStay }>();

	let pctMorrem = $derived.by(() => {
		const total = stay.totalMorrem + stay.totalSobrevivem;
		return total > 0 ? (stay.totalMorrem / total) * 100 : 0;
	});
	let pctSobrevivem = $derived.by(() => {
		const total = stay.totalMorrem + stay.totalSobrevivem;
		return total > 0 ? (stay.totalSobrevivem / total) * 100 : 0;
	});
</script>

<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
	<div class="flex items-center justify-between pb-3 border-b border-slate-100">
		<div>
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
				Simulação de Insolvência (Art. 6º e 49 da LREF)
			</span>
			<h4 class="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
				<span class="i-lucide-shield-alert text-slate-700 text-sm"></span>
				Balanço do Stay Period (180 dias)
			</h4>
		</div>
		<span class="text-[10px] font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
			LREF 11.101/05
		</span>
	</div>

	<!-- Progress Ratio Bar -->
	<div class="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
		<div class="flex flex-col sm:flex-row justify-between text-[11px] font-bold font-mono gap-1">
			<span class="text-rose-700 flex items-center gap-1">
				<span class="w-2 h-2 rounded-full bg-rose-500"></span>
				Suspensos (Concurso): {pctMorrem.toFixed(1)}%
			</span>
			<span class="text-emerald-700 flex items-center gap-1">
				<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
				Blindados (Extraconcursal): {pctSobrevivem.toFixed(1)}%
			</span>
		</div>
		<div class="h-3 w-full bg-slate-200/60 rounded-full flex overflow-hidden p-0.5 shadow-inner">
			{#if pctMorrem > 0}
				<div
					class="h-full bg-rose-500 rounded-l-full transition-all duration-300"
					style="width: {pctMorrem}%"
					title="Créditos Suspensos: {pctMorrem.toFixed(1)}%"
				></div>
			{/if}
			{#if pctSobrevivem > 0}
				<div
					class="h-full bg-emerald-500 rounded-r-full transition-all duration-300"
					style="width: {pctSobrevivem}%"
					title="Créditos Blindados: {pctSobrevivem.toFixed(1)}%"
				></div>
			{/if}
		</div>
	</div>

	<!-- Financial Columns (Concurso vs Blindado) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
		<!-- Suspensos no Stay -->
		<div class="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80 flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-[10px] uppercase font-bold tracking-wider text-rose-800 font-mono">
						Presos no Stay
					</span>
					<span class="text-[10px] font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-200">
						Suspensos
					</span>
				</div>
				<div class="text-xl font-black text-rose-950 tabular-nums font-mono">
					{formatarBRL(stay.totalMorrem)}
				</div>
			</div>
			<div class="mt-3 space-y-1.5 text-[11px] border-t border-rose-200/60 pt-2">
				{#each stay.morrem as item}
					<div class="flex justify-between items-baseline text-slate-700">
						<span class="truncate pr-1 text-slate-600">{item.rotulo}</span>
						<span class="font-bold text-rose-900 tabular-nums font-mono shrink-0">{formatarBRL(item.valor)}</span>
					</div>
				{/each}
				{#if stay.morrem.length === 0}
					<span class="text-slate-400 italic block text-[10px]">Nenhum crédito sujeito a suspensão.</span>
				{/if}
			</div>
		</div>

		<!-- Blindados no Stay -->
		<div class="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-[10px] uppercase font-bold tracking-wider text-emerald-800 font-mono">
						Extraconcursais
					</span>
					<span class="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
						Protegidos
					</span>
				</div>
				<div class="text-xl font-black text-emerald-950 tabular-nums font-mono">
					{formatarBRL(stay.totalSobrevivem)}
				</div>
			</div>
			<div class="mt-3 space-y-1.5 text-[11px] border-t border-emerald-200/60 pt-2">
				{#each stay.sobrevivem as item}
					<div class="flex justify-between items-baseline text-slate-700">
						<span class="truncate pr-1 text-slate-600">{item.rotulo}</span>
						<span class="font-bold text-emerald-900 tabular-nums font-mono shrink-0">{formatarBRL(item.valor)}</span>
					</div>
				{/each}
				{#if stay.sobrevivem.length === 0}
					<span class="text-slate-400 italic block text-[10px]">Sem garantias reais extraconcursais.</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Deságio Estimado -->
	<div class="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-1.5 font-mono">
		<div class="flex items-center justify-between text-[11px]">
			<span class="text-slate-500">Deságio médio histórico (RJ):</span>
			<span class="font-bold text-slate-900">{(stay.desagio * 100).toFixed(0)}% (Haircut 30%)</span>
		</div>
		<div class="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs">
			<span class="font-semibold text-slate-700 font-sans">Recuperação provável quirografário:</span>
			<strong class="text-slate-900 text-sm font-bold">{formatarBRL(stay.totalMorrem * (1 - stay.desagio))}</strong>
		</div>
	</div>
</div>