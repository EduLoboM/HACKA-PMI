<script lang="ts">
	import type { AnaliseKrillShield, EstadoCartaz } from '$lib/krillshield/types';
	import { ESTADOS_CARTAZ, GARANTIAS, formatarBRL } from '$lib/krillshield/types';

	let {
		analise,
		ranking = null,
		totalCarteira = 57,
		posicaoCorte = null,
		onClose,
		onVerDossie,
		onNovoCadastro
	} = $props<{
		analise: AnaliseKrillShield;
		ranking?: {
			posicao: number;
			zona: 'SALVAVEL' | 'REBAIXAMENTO';
			taxaBlindagem: number;
			ultimoASalvar?: boolean;
			primeiroRebaixado?: boolean;
		} | null;
		totalCarteira?: number;
		posicaoCorte?: number | null;
		onClose: () => void;
		onVerDossie: () => void;
		onNovoCadastro?: () => void;
	}>();

	let p = $derived(analise.perfil);
	let d = $derived(analise.decisao);
	let s = $derived(analise.stay);
	let r = $derived(analise.relogio);
	let safra = $derived(analise.safra);
	let meta = $derived(ESTADOS_CARTAZ[d.estado as EstadoCartaz]);

	let taxaBlindagem = $derived(
		s.totalExposicao > 0 ? Math.round((s.totalSobrevivem / s.totalExposicao) * 100) : 0
	);

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/65 backdrop-blur-xs overflow-y-auto animate-fade-in"
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-posicao-titulo"
>
	<div
		class="relative w-full max-w-2xl bg-white border border-slate-300 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col rounded-xl sm:rounded-none"
	>
		<!-- Top Bar / Header -->
		<div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
			<div class="flex items-center gap-2.5 min-w-0">
				<div class="w-3 h-3 rounded-full {d.estado === 'FIADO' ? 'bg-emerald-600' : d.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-500' : 'bg-rose-600'} shrink-0"></div>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
							Posição Cadastrada & Avaliada · KrillShield
						</span>
						{#if ranking?.posicao}
							<span class="px-1.5 py-0.2 bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold">
								#{ranking.posicao}º LUGAR
							</span>
						{/if}
					</div>
					<h3 id="modal-posicao-titulo" class="text-sm font-bold text-slate-900 truncate">
						{p.nome}
					</h3>
				</div>
			</div>
			<button
				type="button"
				onclick={onClose}
				aria-label="Fechar modal de posição"
				class="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors duration-150 cursor-pointer shrink-0"
			>
				<span class="i-lucide-x text-sm"></span>
			</button>
		</div>

		<!-- Scrollable Body Content -->
		<div class="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
			<!-- Posição no Ranking da Carteira (Destaque Principal) -->
			<div class="p-3.5 bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 bg-slate-900 text-white flex flex-col items-center justify-center font-mono shrink-0 shadow-xs border border-slate-700">
						<span class="text-[8px] uppercase font-bold text-slate-400 leading-none">Rank</span>
						<span class="text-lg font-black leading-tight text-emerald-400">
							#{ranking?.posicao ?? '—'}
						</span>
					</div>
					<div>
						<div class="flex items-center gap-2">
							<span class="text-xs sm:text-sm font-bold text-slate-900">
								{ranking?.posicao ? `${ranking.posicao}º Lugar no Ranking Geral` : 'Classificação na Carteira'}
							</span>
							<span class="text-[10px] font-mono text-slate-500 font-semibold">
								(de {totalCarteira} empresas)
							</span>
						</div>
						<div class="text-[11px] flex items-center gap-1.5 mt-0.5">
							{#if ranking?.zona === 'SALVAVEL'}
								<span class="inline-flex items-center gap-1 text-emerald-800 font-bold font-mono">
									<span class="i-lucide-shield-check text-xs text-emerald-600"></span>
									<span>Zona Salvável</span>
								</span>
								<span class="text-slate-400">·</span>
								<span class="text-slate-600 text-[11px]">Crédito operável com garantias</span>
							{:else if ranking?.zona === 'REBAIXAMENTO'}
								<span class="inline-flex items-center gap-1 text-rose-800 font-bold font-mono">
									<span class="i-lucide-shield-x text-xs text-rose-600"></span>
									<span>Zona de Rebaixamento</span>
								</span>
								<span class="text-slate-400">·</span>
								<span class="text-rose-700 font-semibold text-[11px]">Abaixo do corte (Somente à vista)</span>
							{:else}
								<span class="text-slate-600 font-mono">Em processamento</span>
							{/if}
						</div>
					</div>
				</div>

				{#if posicaoCorte != null && ranking?.posicao}
					<div class="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 shrink-0">
						<span class="text-[10px] text-slate-500 uppercase font-bold block font-mono">
							Linha de Corte: {posicaoCorte}º
						</span>
						{#if ranking.posicao < posicaoCorte}
							<span class="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-300">
								+{posicaoCorte - ranking.posicao} posições acima do corte
							</span>
						{:else if ranking.posicao === posicaoCorte}
							<span class="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold font-mono text-rose-800 bg-rose-50 border border-rose-300">
								1º na Zona de Rebaixamento
							</span>
						{:else}
							<span class="inline-block mt-0.5 px-2 py-0.5 text-[11px] font-bold font-mono text-rose-800 bg-rose-50 border border-rose-200">
								-{ranking.posicao - posicaoCorte + 1} posições abaixo do corte
							</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- CNPJ & Local Badge -->
			<div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 text-xs">
				<div class="flex items-center gap-1.5 font-mono text-slate-700">
					<span class="text-slate-400 font-semibold">CNPJ:</span>
					<strong class="text-slate-900">{p.cnpjCpf}</strong>
				</div>
				<div class="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5">
					<span class="i-lucide-check-circle text-xs text-emerald-600"></span>
					<span>Cadastro Ativo na Base Oficial</span>
				</div>
			</div>

			<!-- Big Decision Verdict Card -->
			<div class="p-4 border {d.estado === 'FIADO' ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' : d.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-50/60 border-amber-300 text-amber-950' : 'bg-rose-50/60 border-rose-300 text-rose-950'}">
				<div class="flex items-center justify-between gap-2 mb-1.5">
					<span class="text-[10px] uppercase font-bold tracking-wider font-mono {d.estado === 'FIADO' ? 'text-emerald-800' : d.estado === 'SÓ_EXTRACONCURSAL' ? 'text-amber-900' : 'text-rose-900'}">
						Enquadramento Operacional de Balcão
					</span>
					<span class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-mono border {meta.bg}">
						{meta.rotulo}
					</span>
				</div>

				<div class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-1">
					{#if d.estado === 'FIADO'}
						CRÉDITO LIMPO APROVADO
					{:else if d.estado === 'SÓ_EXTRACONCURSAL'}
						VENDA CONDICIONADA A GARANTIA REAL
					{:else}
						EXCLUSIVAMENTE À VISTA (D+0)
					{/if}
				</div>

				<p class="text-xs {d.estado === 'FIADO' ? 'text-emerald-900' : d.estado === 'SÓ_EXTRACONCURSAL' ? 'text-amber-950' : 'text-rose-950'} leading-relaxed mb-3">
					{#if d.estado === 'FIADO'}
						Produtor atende aos critérios do Provimento 216 e capacidade de safra comprovada. Operação regular sem exigência de travas concursais adicionais.
					{:else if d.estado === 'SÓ_EXTRACONCURSAL'}
						Alerta de risco identificado. Para proteção jurídica do crédito em caso de RJ, a venda deve ser amarrada exclusivamente a instrumento extraconcursal.
					{:else}
						Indicativo crítico de insolvência ou moratória. Suspensão total de crédito a prazo para evitar contaminação da carteira Krill.
					{/if}
				</p>

				<!-- Instrument Recommendation -->
				{#if d.instrumentoRotulo}
					<div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border {d.estado === 'FIADO' ? 'border-emerald-300' : 'border-amber-300'} text-xs font-semibold text-slate-900 shadow-xs">
						<span class="i-lucide-award text-sm {d.estado === 'FIADO' ? 'text-emerald-600' : 'text-amber-600'}"></span>
						<span>Instrumento Obrigatório: <strong>{d.instrumentoRotulo}</strong></span>
					</div>
				{/if}
			</div>

			<!-- Stay Period Simulation & Blindagem -->
			<div class="border border-slate-200 p-4 space-y-3 bg-white">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
					<div>
						<span class="text-xs font-bold text-slate-900 block">Simulação do Stay Period (180 Dias · LREF)</span>
						<span class="text-[11px] text-slate-500">Destino do patrimônio da carteira em caso de Recuperação Judicial hoje</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-bold font-mono text-slate-800">Taxa de Blindagem:</span>
						<span class="px-2 py-0.5 text-xs font-bold font-mono {taxaBlindagem >= 60 ? 'bg-emerald-100 text-emerald-800' : taxaBlindagem >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}">
							{taxaBlindagem}%
						</span>
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="w-full h-3 bg-slate-100 overflow-hidden flex">
					{#if s.totalSobrevivem > 0}
						<div
							style="width: {taxaBlindagem}%"
							class="h-full bg-emerald-600 transition-all duration-300"
							title="Blindado fora da RJ: {taxaBlindagem}%"
						></div>
					{/if}
					{#if s.totalMorrem > 0}
						<div
							style="width: {100 - taxaBlindagem}%"
							class="h-full bg-rose-500 transition-all duration-300"
							title="Suspenso no Stay (quirografário): {100 - taxaBlindagem}%"
						></div>
					{/if}
				</div>

				<!-- 3 Metric Tiles -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
					<div class="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-center">
						<span class="text-[10px] text-slate-500 font-bold uppercase">Exposição</span>
						<span class="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
							{formatarBRL(s.totalExposicao)}
						</span>
					</div>
					<div class="p-2 sm:p-2.5 bg-emerald-50/60 border border-emerald-200 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-center">
						<span class="text-[10px] text-emerald-800 font-bold uppercase">Blindado (Art. 49 §3º)</span>
						<span class="text-xs sm:text-sm font-bold text-emerald-800 tabular-nums">
							{formatarBRL(s.totalSobrevivem)}
						</span>
					</div>
					<div class="p-2 sm:p-2.5 bg-rose-50/60 border border-rose-200 flex sm:flex-col items-center sm:items-center justify-between sm:justify-center text-center">
						<span class="text-[10px] text-rose-800 font-bold uppercase">Preso no Stay</span>
						<span class="text-xs sm:text-sm font-bold text-rose-800 tabular-nums">
							{formatarBRL(s.totalMorrem)}
						</span>
					</div>
				</div>
			</div>

			<!-- Two Mini Diagnostic Cards (Relógio 216 + Safra ZARC) -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<!-- Relógio 216 Card -->
				<div class="p-3 bg-slate-50 border border-slate-200 space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-bold text-slate-800 flex items-center gap-1">
							<span class="i-lucide-clock-3 text-xs text-slate-600"></span>
							Relógio 216 (CNJ)
						</span>
						<span class="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-white border border-slate-300 text-slate-700">
							{r.grau}
						</span>
					</div>
					<p class="text-[11px] text-slate-600 leading-snug">
						Inscrição Junta: <strong class="text-slate-900">{p.dataRegistroJunta}</strong> ({r.tempoFormalizacaoMeses} meses).
						LCDPR: <strong class="text-slate-900">{r.lcdprOk ? 'Ativa' : 'Pendente'}</strong>.
					</p>
					<div class="text-[10px] text-slate-500 italic">
						{r.motivo}
					</div>
				</div>

				<!-- Safra vs CPR Card -->
				<div class="p-3 bg-slate-50 border border-slate-200 space-y-1.5">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-bold text-slate-800 flex items-center gap-1">
							<span class="i-lucide-sprout text-xs text-emerald-600"></span>
							Carta de Produtividade
						</span>
						<span class="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-white border border-slate-300 {safra.coberturaOk ? 'text-emerald-700' : 'text-rose-700'}">
							{safra.coberturaOk ? 'Safra Cobre' : 'Déficit Safra'}
						</span>
					</div>
					<p class="text-[11px] text-slate-600 leading-snug">
						Capacidade: <strong class="text-slate-900">{safra.capacidadePeso.toLocaleString('pt-BR')} sc</strong> ({p.areaPlantadaCAR} ha × {p.produtividadeZarc} sc/ha).
						CPR: <strong class="text-slate-900">{p.volumeComprometidoCPR.toLocaleString('pt-BR')} sc</strong>.
					</p>
					<div class="text-[10px] text-slate-500 italic">
						{safra.motivo}
					</div>
				</div>
			</div>

			<!-- Orientação Prática -->
			{#if analise.iaResposta?.orientacaoBalcao || d.razoes[0]}
				<div class="p-3 bg-slate-900 text-white space-y-1 text-xs">
					<div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
						<span class="i-lucide-shield text-xs"></span>
						Recomendação Prática para o Operador
					</div>
					<p class="text-slate-200 leading-relaxed text-xs">
						{analise.iaResposta?.orientacaoBalcao || d.razoes[0]}
					</p>
				</div>
			{/if}
		</div>

		<!-- Footer Action Buttons -->
		<div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
			{#if onNovoCadastro}
				<button
					type="button"
					onclick={() => {
						onClose();
						onNovoCadastro();
					}}
					class="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors duration-150 cursor-pointer text-center"
				>
					+ Cadastrar Outro CNPJ
				</button>
			{:else}
				<div></div>
			{/if}

			<div class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
				<button
					type="button"
					onclick={onClose}
					class="w-full sm:w-auto px-4 py-2 sm:py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors duration-150 cursor-pointer text-center"
				>
					Fechar
				</button>
				<button
					type="button"
					onclick={() => {
						onClose();
						onVerDossie();
					}}
					class="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 text-center"
				>
					<span>Ver Dossiê</span>
					<span class="i-lucide-arrow-right text-xs"></span>
				</button>
			</div>
		</div>
	</div>
</div>
