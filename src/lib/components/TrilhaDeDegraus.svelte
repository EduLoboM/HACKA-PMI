<script lang="ts">
	import { formatarBRL } from '$lib/krillshield/types';
	import type { Degrau, ClasseDegrau } from '$lib/krillshield/types';

	let { degraus } = $props<{ degraus: Degrau[] }>();

	let ativos = $derived(degraus.filter((d: Degrau) => d.ativo));
	let estruturais = $derived(degraus.filter((d: Degrau) => d.classe === 'Estrutural'));
	let reversiveis = $derived(degraus.filter((d: Degrau) => d.classe === 'Reversível'));

	function badgeClasse(classe: ClasseDegrau): string {
		return classe === 'Estrutural'
			? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
			: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
	}
</script>

<div class="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
	<div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 bg-gradient-to-r from-slate-900 to-slate-900/40">
		<div class="flex items-center gap-2">
			<span class="i-lucide-stairs text-amber-400"></span>
			<span class="text-sm font-bold text-slate-200">Trilha de subida</span>
		</div>
		<span class="text-[10px] uppercase tracking-wider text-slate-500">reason codes invertidos</span>
	</div>

	<div class="px-5 py-4 space-y-4">
		<div class="flex flex-wrap gap-2 text-[11px]">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/80 text-slate-400">
				<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
				{estruturais.length} estrutural(is) — não sobem por comportamento
			</span>
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/80 text-slate-400">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
				{reversiveis.length} reversível(is) — sobem por prova declarada
			</span>
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
				{ativos.length} penalidade(s) ativa(s) bloqueando o cartaz
			</span>
		</div>

		{#if degraus.length === 0}
			<div class="text-xs text-slate-500 italic">Sem degraus calculados.</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border border-slate-800">
				<table class="w-full text-xs min-w-[680px]">
					<thead>
						<tr class="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-950/60">
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
					<tbody>
						{#each degraus as d}
							<tr class="border-b border-slate-800/70 last:border-0 {d.ativo ? 'bg-slate-800/20' : 'opacity-50'}">
								<td class="px-3 py-2.5">
									<span class="font-mono font-bold {d.ativo ? (d.classe === 'Estrutural' ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}">{d.codigo}</span>
								</td>
								<td class="px-3 py-2.5">
									<span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border {badgeClasse(d.classe)}">{d.classe}</span>
								</td>
								<td class="px-3 py-2.5 text-slate-300 max-w-55">
									<span class="block truncate" title={d.texto}>{d.texto}</span>
									<span class="block text-[10px] text-slate-500 mt-0.5 truncate" title={d.origemValor}>{d.origemValor}</span>
								</td>
								<td class="px-3 py-2.5 text-slate-400 max-w-48">
									<span class="block truncate" title={d.provaExigida}>{d.provaExigida}</span>
								</td>
								<td class="px-3 py-2.5 text-right">
									<span class="font-bold tabular-nums {d.valor > 0 ? 'text-rose-400' : 'text-slate-500'}">{formatarBRL(d.valor)}</span>
								</td>
								<td class="px-3 py-2.5 text-center">
									<span class="inline-flex items-center gap-1 text-[10px] font-bold {d.ativo ? 'text-amber-400' : 'text-slate-500'}">
										<span class="w-1.5 h-1.5 rounded-full {d.ativo ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}"></span>
										{d.ativo ? 'Pendente' : 'Superado'}
									</span>
								</td>
								<td class="px-3 py-2.5 text-slate-500 text-center">{d.responsavel ?? '—'}</td>
								<td class="px-3 py-2.5 text-slate-500 text-center">{d.dataProva ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<p class="text-[10px] text-slate-500 leading-relaxed">
				Regra do degrau: o valor devolvido é exatamente a penalidade que o gerou, nem mais — zero calibração,
				zero arbitragem. Degraus estruturais (tempo, fato consumado) jamais sobem por comportamento; sequência
				longa não compra imunidade. Prova é <span class="text-slate-300">declarada com responsável nomeado e
				data</span> — como CNDT/PGFN/FGTS e consulta SICAR por CPF não são automáticas, nunca simulamos verificação
				automática.
			</p>
		{/if}
	</div>
</div>