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

	let cor = $derived(
		decisao.estado === 'FIADO'
			? {
					box: 'bg-emerald-50/50 border-emerald-300',
					texto: 'text-emerald-800',
					detalhe: 'text-rose-800'
				}
			: decisao.estado === 'SÓ_EXTRACONCURSAL'
				? {
						box: 'bg-amber-50/50 border-amber-300',
						texto: 'text-amber-900',
						detalhe: 'text-amber-800'
					}
				: {
						box: 'bg-rose-50/50 border-rose-300',
						texto: 'text-rose-900',
						detalhe: 'text-rose-900'
					}
	);

	function textoEnquadramento(e: EstadoCartaz): string {
		if (e === 'FIADO')
			return 'Operação e crédito em fluxo regular. Produtor sem indicativos de formalização recente e com lastro pleno de safra para cobertura dos compromissos vigentes.';
		if (e === 'SÓ_EXTRACONCURSAL')
			return 'Operação condicionada exclusivamente a instrumento com blindagem à Recuperação Judicial. Impede a retenção de recebíveis pelo Stay Period.';
		return 'Risco concursal elevado ou moratória iminente. Liberação de insumo unicamente mediante liquidação imediata em conta.';
	}
</script>

<div class="bg-white border border-slate-200 shadow-sm overflow-hidden">
	<div class="h-9 px-3 flex items-center gap-2 border-b border-slate-200 bg-slate-50/80">
		<div class="flex items-center gap-1.5 shrink-0">
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
		</div>
		<div class="w-px h-3 bg-slate-200 shrink-0"></div>
		<span class="i-lucide-gavel text-slate-500 shrink-0"></span>
		<span class="text-[10px] font-bold uppercase tracking-wider text-slate-600 min-w-0 truncate">
			Poster de Decisão Operacional
		</span>
		<span class="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-slate-500 shrink-0">
			<span class="w-2 h-2 rounded-full {cor.texto == 'text-emerald-800' ? 'bg-emerald-600' : cor.texto == 'text-amber-900' ? 'bg-amber-500' : 'bg-rose-600'}"></span>
			Diretriz de Balcão · Krill Tech
		</span>
	</div>

	<div class="p-4 sm:p-5">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
			<!-- Active Verdict -->
			<div class="lg:col-span-7 p-3.5 sm:p-4 border {cor.box} flex flex-col justify-between gap-2">
				<div>
					<div class="flex items-center justify-between gap-2 mb-1.5">
						<span class="text-[10px] uppercase font-bold tracking-wider {cor.texto}">
							Enquadramento da Carteira
						</span>
						<span class="text-xs font-bold font-mono uppercase {cor.texto}">
							{metaAtiva.rotulo}
						</span>
					</div>
					<div class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-1.5 sm:mb-2">
						{metaAtiva.rotulo}
					</div>
				</div>

				<p class="text-xs text-slate-700 leading-relaxed">
					{textoEnquadramento(decisao.estado)}
				</p>
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
							class="flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 border transition-colors duration-150 {ativo
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
								<span class="text-[10px] leading-tight block mt-0.5 {ativo ? 'text-slate-300' : 'text-slate-500'}">
									{etapa.descricaoCurta}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>