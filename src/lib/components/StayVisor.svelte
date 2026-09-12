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

<div class="bg-white border border-slate-200 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
	<div class="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-200">
		<div>
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
				Simulação de Insolvência (Art. 6º e 49 da LREF)
			</span>
			<h4 class="text-sm font-bold text-slate-900 tracking-tight">
				Balanço do Stay Period (180 dias)
			</h4>
		</div>
		<span class="text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
			LREF 11.101/05
		</span>
	</div>

	<!-- Progress Ratio Bar -->
	<div class="space-y-1.5">
		<div class="flex flex-col sm:flex-row justify-between text-[10px] sm:text-[11px] font-semibold font-mono gap-0.5">
			<span class="text-rose-700">Suspensos (Concurso): {pctMorrem.toFixed(1)}%</span>
			<span class="text-emerald-700">Blindados (Extraconcursal): {pctSobrevivem.toFixed(1)}%</span>
		</div>
		<div class="h-2 w-full bg-slate-100 flex overflow-hidden border border-slate-200">
			{#if pctMorrem > 0}
				<div
					class="h-full bg-rose-600 transition-[width] duration-200"
					style="width: {pctMorrem}%"
				></div>
			{/if}
			{#if pctSobrevivem > 0}
				<div
					class="h-full bg-emerald-600 transition-[width] duration-200"
					style="width: {pctSobrevivem}%"
				></div>
			{/if}
		</div>
	</div>

	<!-- Financial Columns (Concurso vs Blindado) -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
		<!-- Suspensos no Stay -->
		<div class="p-3 bg-rose-50/40 border border-rose-200">
			<div class="flex items-center justify-between mb-1">
				<span class="text-[10px] uppercase font-bold tracking-wider text-rose-800">
					Presos no Stay
				</span>
				<span class="text-[10px] font-mono font-bold text-rose-700">Suspensos</span>
			</div>
			<div class="text-lg font-black text-rose-950 tabular-nums font-mono">
				{formatarBRL(stay.totalMorrem)}
			</div>
			<div class="mt-2 space-y-1 text-[11px] border-t border-rose-200/60 pt-1.5">
				{#each stay.morrem as item}
					<div class="flex justify-between items-baseline text-slate-700">
						<span class="truncate pr-1">{item.rotulo}</span>
						<span class="font-bold text-rose-900 tabular-nums font-mono shrink-0">{formatarBRL(item.valor)}</span>
					</div>
				{/each}
				{#if stay.morrem.length === 0}
					<span class="text-slate-500 italic block text-[10px]">Nenhum crédito sujeito a suspensão.</span>
				{/if}
			</div>
		</div>

		<!-- Blindados no Stay -->
		<div class="p-3 bg-emerald-50/40 border border-emerald-200">
			<div class="flex items-center justify-between mb-1">
				<span class="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
					Extraconcursais
				</span>
				<span class="text-[10px] font-mono font-bold text-emerald-700">Protegidos</span>
			</div>
			<div class="text-lg font-black text-emerald-950 tabular-nums font-mono">
				{formatarBRL(stay.totalSobrevivem)}
			</div>
			<div class="mt-2 space-y-1 text-[11px] border-t border-emerald-200/60 pt-1.5">
				{#each stay.sobrevivem as item}
					<div class="flex justify-between items-baseline text-slate-700">
						<span class="truncate pr-1">{item.rotulo}</span>
						<span class="font-bold text-emerald-900 tabular-nums font-mono shrink-0">{formatarBRL(item.valor)}</span>
					</div>
				{/each}
				{#if stay.sobrevivem.length === 0}
					<span class="text-slate-500 italic block text-[10px]">Sem garantias reais extraconcursais.</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Deságio Estimado -->
	<div class="text-[11px] text-slate-600 bg-slate-50 p-2.5 border border-slate-200 space-y-1 font-mono">
		<div class="flex items-center justify-between">
			<span>Deságio médio histórico (RJ):</span>
			<span class="font-bold text-slate-900">{(stay.desagio * 100).toFixed(0)}%</span>
		</div>
		<div class="flex items-center justify-between pt-1 border-t border-slate-200">
			<span>Recuperação provável quirografário:</span>
			<strong class="text-slate-900">{formatarBRL(stay.totalMorrem * (1 - stay.desagio))}</strong>
		</div>
	</div>
</div>