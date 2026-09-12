<script lang="ts">
	import { formatarBRL } from '$lib/krillshield/types';
	import type { Degrau, ClasseDegrau } from '$lib/krillshield/types';

	let { degraus } = $props<{ degraus: Degrau[] }>();

	let ativos = $derived(degraus.filter((d: Degrau) => d.ativo));
	let estruturais = $derived(degraus.filter((d: Degrau) => d.classe === 'Estrutural'));
	let reversiveis = $derived(degraus.filter((d: Degrau) => d.classe === 'Reversível'));

	function badgeClasse(classe: ClasseDegrau): string {
		return classe === 'Estrutural'
			? 'border-rose-300 bg-rose-50 text-rose-800'
			: 'border-emerald-300 bg-emerald-50 text-emerald-800';
	}
</script>

<div class="bg-white border border-slate-200 overflow-hidden shadow-sm">
	<div class="h-9 px-3 flex items-center gap-2 bg-slate-50/80 border-b border-slate-200">
		<div class="flex items-center gap-1.5 shrink-0">
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
		</div>
		<div class="w-px h-3 bg-slate-200 shrink-0"></div>
		<div class="flex items-center gap-1.5 min-w-0">
			<span class="i-lucide-stairs text-slate-500 shrink-0"></span>
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-600 truncate">Trilha de subida</span>
		</div>
		<span class="ml-auto text-[10px] uppercase tracking-wider text-slate-500 shrink-0">reason codes invertidos</span>
	</div>

	<div class="px-4 py-3 space-y-3">
		<div class="flex flex-wrap gap-2 text-[11px]">
			<span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-slate-200 text-slate-600 bg-slate-50">
				<span class="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
				{estruturais.length} estrutural(is)
			</span>
			<span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-slate-200 text-slate-600 bg-slate-50">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
				{reversiveis.length} reversível(is)
			</span>
			<span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-300/60 text-amber-800 bg-amber-50/50">
				{ativos.length} penalidade(s) ativa(s)
			</span>
		</div>

		{#if degraus.length === 0}
			<div class="text-xs text-slate-500 italic py-2">Sem degraus calculados.</div>
		{:else}
			<div class="overflow-x-auto border border-slate-200">
				<table class="w-full text-xs min-w-[680px]">
					<thead>
						<tr class="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/90">
							<th class="px-3 py-2 font-semibold">Código</th>
							<th class="px-3 py-2 font-semibold">Classe</th>
							<th class="px-3 py-2 font-semibold">Penalidade</th>
							<th class="px-3 py-2 font-semibold">Prova exigida</th>
							<th class="px-3 py-2 font-semibold text-right">Origem do valor (R$ Stay)</th>
							<th class="px-3 py-2 font-semibold text-center">Status</th>
							<th class="px-3 py-2 font-semibold">Responsável</th>
							<th class="px-3 py-2 font-semibold">Data</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each degraus as d}
							<tr class="hover:bg-slate-50 transition-colors duration-100 {d.ativo ? '' : 'opacity-50'}">
								<td class="px-3 py-2">
									<span class="font-mono font-bold {d.ativo ? (d.classe === 'Estrutural' ? 'text-rose-700' : 'text-amber-700') : 'text-slate-500'}">{d.codigo}</span>
								</td>
								<td class="px-3 py-2">
									<span class="inline-flex px-2 py-0.5 text-[10px] font-bold border {badgeClasse(d.classe)}">{d.classe}</span>
								</td>
								<td class="px-3 py-2 text-slate-700 max-w-55">
									<span class="block truncate" title={d.texto}>{d.texto}</span>
									<span class="block text-[10px] text-slate-500 mt-0.5 truncate" title={d.origemValor}>{d.origemValor}</span>
								</td>
								<td class="px-3 py-2 text-slate-600 max-w-48">
									<span class="block truncate" title={d.provaExigida}>{d.provaExigida}</span>
								</td>
								<td class="px-3 py-2 text-right">
									<span class="font-bold tabular-nums font-mono {d.valor > 0 ? 'text-rose-700' : 'text-slate-500'}">{formatarBRL(d.valor)}</span>
								</td>
								<td class="px-3 py-2 text-center">
									<span class="inline-flex items-center gap-1 text-[10px] font-bold {d.ativo ? 'text-amber-700' : 'text-slate-500'}">
										<span class="w-1.5 h-1.5 rounded-full {d.ativo ? 'bg-amber-500' : 'bg-slate-400'}"></span>
										{d.ativo ? 'Pendente' : 'Superado'}
									</span>
								</td>
								<td class="px-3 py-2 text-slate-500 text-center">{d.responsavel ?? '—'}</td>
								<td class="px-3 py-2 text-slate-500 text-center font-mono">{d.dataProva ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<p class="text-[10px] text-slate-500 leading-relaxed pt-1">
				O valor devolvido em cada degrau é exatamente a penalidade que o gerou — zero calibração,
				zero arbitragem. Provas são declaradas com responsável nomeado e data; consulta SICAR/CNDT
				/PGFN não é automatizada.
			</p>
		{/if}
	</div>
</div>