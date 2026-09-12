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

<div class="bg-white border border-slate-200 p-5 space-y-4">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
		<div>
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
				Diretriz de Balcão · Krill Tech
			</span>
			<h3 class="text-sm font-bold text-slate-900 tracking-tight">
				Poster de Decisão Operacional
			</h3>
		</div>
		<div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
			<span class="w-2 h-2 rounded-full {decisao.estado === 'FIADO' ? 'bg-emerald-600' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-500' : 'bg-rose-600'}"></span>
			<span>Etapa <strong class="text-slate-900 font-mono">{decisao.passo ?? '—'}</strong> de 3 na esteira jurídica</span>
		</div>
	</div>

	<!-- Main Decision Row -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
		<!-- Active Verdict -->
		<div class="lg:col-span-7 p-4 border {decisao.estado === 'FIADO' ? 'bg-emerald-50/50 border-emerald-300' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-50/50 border-amber-300' : 'bg-rose-50/50 border-rose-300'} flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between gap-2 mb-1.5">
					<span class="text-[10px] uppercase font-bold tracking-wider {decisao.estado === 'FIADO' ? 'text-emerald-800' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'text-amber-900' : 'text-rose-900'}">
						Enquadramento da Carteira
					</span>
					<span class="text-xs font-bold font-mono uppercase {decisao.estado === 'FIADO' ? 'text-emerald-800' : decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'text-amber-900' : 'text-rose-900'}">
						{metaAtiva.rotulo}
					</span>
				</div>

				<div class="text-2xl font-black tracking-tight text-slate-900 mb-2">
					{metaAtiva.rotulo}
				</div>

				<p class="text-xs text-slate-700 leading-relaxed">
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
				<div class="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center justify-between gap-2 text-xs">
					<span class="text-amber-900 font-medium text-[11px]">Instrumento Obrigatório:</span>
					<span class="font-bold text-amber-950 font-mono text-xs bg-amber-100 px-2 py-0.5 border border-amber-300">
						{decisao.instrumentoRotulo ?? 'Instrumento Qualificado'}
					</span>
				</div>
			{:else if decisao.estado === 'À_VISTA'}
				<div class="mt-3 pt-2.5 border-t border-rose-200/80 flex items-center justify-between gap-2 text-xs text-rose-900">
					<span class="font-medium text-[11px]">Condição Mandatória:</span>
					<span class="font-bold text-rose-950 font-mono text-xs bg-rose-100 px-2 py-0.5 border border-rose-300">
						Liquidação Financeira D+0
					</span>
				</div>
			{/if}
		</div>

		<!-- Steps Scale -->
		<div class="lg:col-span-5 flex flex-col justify-between space-y-2">
			<span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
				Escala de Salvaguarda Jurídica
			</span>

			<div class="space-y-1.5 flex-1 flex flex-col justify-between">
				{#each etapas as etapa}
					{@const ativo = decisao.estado === etapa.estado}
					<div
						class="flex items-center gap-3 px-3 py-2.5 border transition-colors duration-150 {ativo
							? 'bg-slate-900 text-white border-slate-900'
							: 'bg-white text-slate-600 border-slate-200 opacity-60'}"
					>
						<span class="flex items-center justify-center shrink-0 w-5 h-5 text-[11px] font-bold font-mono {ativo ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'}">
							{etapa.passo}
						</span>
						<div class="min-w-0 flex-1">
							<span class="text-xs font-bold block leading-none">
								{etapa.estado === 'FIADO' ? 'NORMALIDADE' : etapa.estado.replace('_', ' ')}
							</span>
							<span class="text-[10px] leading-tight block mt-0.5 truncate {ativo ? 'text-slate-300' : 'text-slate-500'}">
								{etapa.descricaoCurta}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>