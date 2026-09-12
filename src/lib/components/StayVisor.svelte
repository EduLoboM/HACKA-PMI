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

<div class="w-full">
	<div class="flex items-center justify-between mb-3">
		<span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">
			Cálculo R$ Stay
		</span>
		<span class="text-xs text-slate-500">Stay Period: 180 dias (+180)</span>
	</div>

	<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
		<div class="h-3.5 w-full rounded-full overflow-hidden bg-slate-800 flex">
			{#if pctMorrem > 0}
				<div class="h-full bg-rose-500 transition-all duration-500" style="width: {pctMorrem}%"></div>
			{/if}
			{#if pctSobrevivem > 0}
				<div class="h-full bg-emerald-500 transition-all duration-500" style="width: {pctSobrevivem}%"></div>
			{/if}
		</div>

		<div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
				<div class="flex items-center gap-2 mb-2">
					<span class="i-lucide-trending-down text-rose-400 text-lg"></span>
					<span class="text-xs font-bold text-rose-300 uppercase tracking-wide">Reais que MORREM</span>
				</div>
				<div class="text-2xl font-black text-rose-300 tabular-nums">
					{formatarBRL(stay.totalMorrem)}
				</div>
				<div class="mt-3 space-y-1.5">
					{#each stay.morrem as item}
						<div class="text-xs text-slate-400 leading-relaxed border-t border-rose-500/10 pt-1.5">
							<span class="font-semibold text-slate-300">{item.rotulo}:</span>
							{formatarBRL(item.valor)}
						</div>
					{/each}
					{#if stay.morrem.length === 0}
						<div class="text-xs text-slate-500 italic">
							Nenhum instrumento exposto ao stay sob sinais atuais.
						</div>
					{/if}
				</div>
			</div>

			<div class="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
				<div class="flex items-center gap-2 mb-2">
					<span class="i-lucide-shield-check text-emerald-400 text-lg"></span>
					<span class="text-xs font-bold text-emerald-300 uppercase tracking-wide">Reais que SOBREVIVEM</span>
				</div>
				<div class="text-2xl font-black text-emerald-300 tabular-nums">
					{formatarBRL(stay.totalSobrevivem)}
				</div>
				<div class="mt-3 space-y-1.5">
					{#each stay.sobrevivem as item}
						<div class="text-xs text-slate-400 leading-relaxed border-t border-emerald-500/10 pt-1.5">
							<span class="font-semibold text-slate-300">{item.rotulo}:</span>
							{formatarBRL(item.valor)}
						</div>
					{/each}
					{#if stay.sobrevivem.length === 0}
						<div class="text-xs text-slate-500 italic">
							Nenhum instrumento extraconcursal ativo nesta posição.
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-4 text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-3">
			Deságio estimado na recuperação judicial: <span class="text-slate-300 font-semibold">{(stay.desagio * 100).toFixed(0)}%</span>.
			Recuperação esperada sobre o que morre ≈ <span class="text-slate-300 font-semibold">{formatarBRL(stay.totalMorrem * (1 - stay.desagio))}</span>.
		</div>
	</div>
</div>