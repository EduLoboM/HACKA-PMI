<script lang="ts">
	import type { DecisaoPoster, EstadoCartaz } from '$lib/krillshield/types';
	import { ESTADOS_CARTAZ } from '$lib/krillshield/types';

	let { decisao } = $props<{ decisao: DecisaoPoster }>();

	const etapas: { estado: EstadoCartaz; passo: number; descricaoCurta: string }[] = [
		{
			estado: 'FIADO',
			passo: 1,
			descricaoCurta: 'Operação em fluxo regular sem exigência de travas concursais adicionais.'
		},
		{
			estado: 'SÓ_EXTRACONCURSAL',
			passo: 2,
			descricaoCurta: 'Venda condicionada a instrumento com blindagem à RJ.'
		},
		{
			estado: 'À_VISTA',
			passo: 3,
			descricaoCurta: 'Liberação exclusivamente mediante liquidação imediata.'
		}
	];

	let metaAtiva = $derived(ESTADOS_CARTAZ[(decisao?.estado ?? 'FIADO') as EstadoCartaz]);
</script>

<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
		<div class="flex items-center gap-2">
			<div class="w-2.5 h-2.5 rounded-full {decisao.estado === 'FIADO' ? 'bg-emerald-500 ring-4 ring-emerald-100' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-500 ring-4 ring-amber-100' : 'bg-rose-500 ring-4 ring-rose-100'}"></div>
			<div>
				<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
					Diretriz de Balcão · Krill Tech
				</span>
				<h3 class="text-sm font-bold text-slate-900 tracking-tight">
					Poster de Decisão Operacional
				</h3>
			</div>
		</div>
		<div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
			<span class="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700">
				Etapa <strong class="text-slate-900">{decisao.passo ?? '—'}</strong> de 3 na esteira jurídica
			</span>
		</div>
	</div>

	<!-- Main Decision Row -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
		<!-- Active Verdict Card -->
		<div class="lg:col-span-7 p-4 sm:p-5 rounded-xl border {decisao.estado === 'FIADO' ? 'bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border-emerald-200' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-gradient-to-br from-amber-50/70 to-amber-100/30 border-amber-200' : 'bg-gradient-to-br from-rose-50/70 to-rose-100/30 border-rose-200'} flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between gap-2 mb-2">
					<span class="text-[10px] uppercase font-bold tracking-wider font-mono {decisao.estado === 'FIADO' ? 'text-emerald-800' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'text-amber-900' : 'text-rose-900'}">
						Enquadramento Regulatório
					</span>
					<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border {metaAtiva.bg}">
						<span class="w-1.5 h-1.5 rounded-full {decisao.estado === 'FIADO' ? 'bg-emerald-600' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-600' : 'bg-rose-600'}"></span>
						{metaAtiva.rotulo}
					</span>
				</div>

				<div class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
					{metaAtiva.rotulo}
				</div>

				<p class="text-xs text-slate-700 leading-relaxed font-normal">
					{#if decisao.estado === 'FIADO'}
						Operação e crédito em fluxo regular. Produtor sem indicativos de formalização recente e com lastro pleno de safra para cobertura dos compromissos vigentes.
					{:else if decisao.estado === 'SÓ_EXTRACONCURSAL'}
						Operação condicionada <strong>exclusivamente</strong> a instrumento com blindagem à Recuperação Judicial. Impede a retenção de recebíveis pelo Stay Period.
					{:else}
						Risco concursal elevado ou moratória iminente. Liberação de insumo unicamente mediante liquidação imediata em conta.
					{/if}
				</p>
			</div>

			{#if decisao.estado === 'SÓ_EXTRACONCURSAL'}
				<div class="mt-4 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
					<span class="text-amber-900 font-semibold text-[11px] flex items-center gap-1">
						<span class="i-lucide-shield-alert text-amber-700 text-sm"></span>
						Instrumento Obrigatório:
					</span>
					<span class="font-bold text-amber-950 font-mono text-xs bg-amber-100/90 px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
						{decisao.instrumentoRotulo ?? 'Instrumento Qualificado'}
					</span>
				</div>
			{:else if decisao.estado === 'À_VISTA'}
				<div class="mt-4 pt-3 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-900">
					<span class="font-semibold text-[11px] flex items-center gap-1">
						<span class="i-lucide-ban text-rose-700 text-sm"></span>
						Condição Mandatória:
					</span>
					<span class="font-bold text-rose-950 font-mono text-xs bg-rose-100/90 px-3 py-1 rounded-lg border border-rose-300 shadow-2xs">
						Liquidação Financeira D+0
					</span>
				</div>
			{/if}
		</div>

		<!-- Steps Scale -->
		<div class="lg:col-span-5 flex flex-col justify-between space-y-2">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
				Escala de Salvaguarda Jurídica
			</span>

			<div class="space-y-2 flex-1 flex flex-col justify-between">
				{#each etapas as etapa}
					{@const ativo = decisao.estado === etapa.estado}
					<div
						class="flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150 {ativo
							? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
							: 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 opacity-75'}"
					>
						<span class="flex items-center justify-center shrink-0 w-6 h-6 rounded-lg text-xs font-black font-mono {ativo ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-600'}">
							{etapa.passo}
						</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between gap-1">
								<span class="text-xs font-bold block leading-none">
									{etapa.estado === 'FIADO' ? 'NORMALIDADE' : etapa.estado.replace('_', ' ')}
								</span>
								{#if ativo}
									<span class="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
										Ativo
									</span>
								{/if}
							</div>
							<span class="text-[11px] leading-tight block mt-1 {ativo ? 'text-slate-300' : 'text-slate-500'}">
								{etapa.descricaoCurta}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>