<script lang="ts">
	import { formatarBRL } from '$lib/krillshield/types';
	import type { Degrau, ClasseDegrau } from '$lib/krillshield/types';

	let { degraus } = $props<{ degraus: Degrau[] }>();

	let ativos = $derived(degraus.filter((d: Degrau) => d.ativo));
	let estruturais = $derived(degraus.filter((d: Degrau) => d.classe === 'Estrutural'));
	let reversiveis = $derived(degraus.filter((d: Degrau) => d.classe === 'Reversível'));

	function badgeClasse(classe: ClasseDegrau): string {
		return classe === 'Estrutural'
			? 'border-rose-200 bg-rose-50 text-rose-800'
			: 'border-emerald-200 bg-emerald-50 text-emerald-800';
	}
</script>

<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
	<!-- Header -->
	<div class="flex items-center justify-between pb-3 border-b border-slate-100">
		<div>
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
				Reason Codes Invertidos · Esteira Jurídica
			</span>
			<h4 class="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
				<span class="i-lucide-stairs text-amber-500 text-sm"></span>
				Trilha de Subida & Penalidades
			</h4>
		</div>
		<span class="text-[10px] font-bold font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
			LREF · DOC / SAF / REL
		</span>
	</div>

	<div class="space-y-3.5">
		<!-- Summary Tags -->
		<div class="flex flex-wrap gap-2 text-[11px]">
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-rose-200 bg-rose-50/70 text-rose-800 font-semibold">
				<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
				{estruturais.length} estrutural(is) — tempo / fato consumado
			</span>
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-800 font-semibold">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
				{reversiveis.length} reversível(is) — superáveis por prova
			</span>
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 font-bold font-mono">
				{ativos.length} penalidade(s) ativa(s) bloqueando o cartaz
			</span>
		</div>

		{#if degraus.length === 0}
			<div class="text-xs text-slate-400 italic py-3 text-center">Nenhum degrau ou penalidade calculada para este perfil.</div>
		{:else}
			<div class="overflow-x-auto rounded-xl border border-slate-100">
				<table class="w-full text-xs min-w-[640px]">
					<thead>
						<tr class="text-left text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 bg-slate-50/60 font-mono">
							<th class="px-3 py-2.5 font-mono">Código</th>
							<th class="px-3 py-2.5">Classe</th>
							<th class="px-3 py-2.5">Penalidade</th>
							<th class="px-3 py-2.5">Prova Exigida</th>
							<th class="px-3 py-2.5 text-right font-mono">R$ no Stay</th>
							<th class="px-3 py-2.5 text-center">Status</th>
							<th class="px-3 py-2.5 text-center">Responsável</th>
							<th class="px-3 py-2.5 text-center">Data</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each degraus as d}
							<tr class="transition-colors duration-100 {d.ativo ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'opacity-60 hover:opacity-80'}">
								<td class="px-3 py-3 font-mono">
									<span class="font-bold px-2 py-0.5 rounded-md text-[10px] {d.ativo ? (d.classe === 'Estrutural' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-900 border border-amber-200') : 'bg-slate-100 text-slate-600'}">
										{d.codigo}
									</span>
								</td>
								<td class="px-3 py-3">
									<span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border {badgeClasse(d.classe)}">
										{d.classe}
									</span>
								</td>
								<td class="px-3 py-3 text-slate-800 max-w-56">
									<span class="block font-semibold truncate" title={d.texto}>{d.texto}</span>
									<span class="block text-[10px] text-slate-400 mt-0.5 truncate" title={d.origemValor}>{d.origemValor}</span>
								</td>
								<td class="px-3 py-3 text-slate-600 max-w-44">
									<span class="block text-[11px] truncate" title={d.provaExigida}>{d.provaExigida}</span>
								</td>
								<td class="px-3 py-3 text-right font-mono">
									<span class="font-bold tabular-nums {d.valor > 0 ? 'text-rose-700' : 'text-slate-400'}">
										{formatarBRL(d.valor)}
									</span>
								</td>
								<td class="px-3 py-3 text-center">
									{#if d.ativo}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-amber-100 text-amber-900 border border-amber-200">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
											Pendente
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-600 rounded-full bg-slate-100 border border-slate-200">
											Superado
										</span>
									{/if}
								</td>
								<td class="px-3 py-3 text-slate-600 text-center font-mono text-[11px]">{d.responsavel ?? '—'}</td>
								<td class="px-3 py-3 text-slate-600 text-center font-mono text-[11px]">{d.dataProva ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<p class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100 font-sans">
				<strong>Regra do degrau:</strong> o valor devolvido é exatamente a penalidade que o gerou (zero calibração, zero arbitragem). Degraus estruturais jamais sobem por comportamento. A prova é <strong class="text-slate-700">declarada com responsável nomeado e data</strong> — nunca simulamos verificação automática.
			</p>
		{/if}
	</div>
</div>