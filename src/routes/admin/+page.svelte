<script lang="ts">
	import { formatarBRL, ESTADOS_CARTAZ, type EstadoCartaz } from '$lib/krillshield/types';

	let { data } = $props();

	let busca = $state('');
	let filtroEstado = $state<'TODOS' | EstadoCartaz>('TODOS');
	let laudoSelecionado = $state<{
		nome: string;
		cnpjCpf: string;
		estado: string;
		data: string;
		texto: string;
	} | null>(null);

	let historicoFiltrado = $derived(
		(data.historicoAvaliacoes as any[]).filter((h) => {
			const bateBusca =
				!busca.trim() ||
				h.nome.toLowerCase().includes(busca.toLowerCase()) ||
				h.cnpjCpf.includes(busca);
			const bateEstado = filtroEstado === 'TODOS' || h.estadoCartaz === filtroEstado;
			return bateBusca && bateEstado;
		})
	);

	function badgeClasse(estado: string) {
		const meta = ESTADOS_CARTAZ[estado as EstadoCartaz];
		if (!meta) return 'bg-slate-100 text-slate-800 border-slate-200';
		return meta.bg;
	}

	function rotuloEstado(estado: string) {
		const meta = ESTADOS_CARTAZ[estado as EstadoCartaz];
		return meta?.rotulo ?? estado;
	}

	function abrirLaudo(h: any) {
		laudoSelecionado = {
			nome: h.nome,
			cnpjCpf: h.cnpjCpf,
			estado: h.estadoCartaz,
			data: h.createdAt,
			texto: h.textoEspelho ?? 'Laudo não disponível para este registro.'
		};
	}

	let copiado = $state(false);
	let exportando = $state(false);
	let exportandoLaudo = $state(false);

	async function copiarLaudo() {
		if (!laudoSelecionado?.texto) return;
		try {
			await navigator.clipboard.writeText(laudoSelecionado.texto);
			copiado = true;
			setTimeout(() => (copiado = false), 2000);
		} catch {
			// fallback
		}
	}

	async function exportarPdfAdmin() {
		if (exportando) return;
		exportando = true;
		try {
			const { exportarRelatorioAdminPDF } = await import('$lib/krillshield/exportPdf');
			exportarRelatorioAdminPDF({
				kpis: data.kpis,
				instrumentos: data.instrumentos,
				topRiscoStay: data.topRiscoStay,
				historico: (data.historicoAvaliacoes ?? []) as Array<{
					createdAt: string;
					nome: string;
					cnpjCpf: string;
					estadoCartaz: string;
					totalMorrem: number;
					totalSobrevivem: number;
				}>
			});
		} catch (e) {
			console.error('Falha ao exportar PDF', e);
		} finally {
			exportando = false;
		}
	}

	async function exportarPdfLaudo() {
		if (!laudoSelecionado || exportandoLaudo) return;
		exportandoLaudo = true;
		try {
			const { exportarLaudoIndividualPDF } = await import('$lib/krillshield/exportPdf');
			exportarLaudoIndividualPDF(laudoSelecionado);
		} catch (e) {
			console.error('Falha ao exportar laudo PDF', e);
		} finally {
			exportandoLaudo = false;
		}
	}
</script>

<svelte:head>
	<title>Painel Financeiro & Auditoria do Stay · KrillShield</title>
</svelte:head>

<!-- Header Corporativo -->
<header class="sticky top-0 z-40 bg-white border-b border-slate-200">
	<div class="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-4">
		<div class="flex items-center gap-2 sm:gap-3 min-w-0">
			<a
				href="/"
				class="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors duration-150 font-mono"
				title="Voltar ao Balcão"
			>
				<span class="i-lucide-arrow-left text-xs"></span>
				<span class="hidden sm:inline">Balcão</span>
			</a>
			<div class="h-4 w-px bg-slate-200 hidden sm:block"></div>
			<div class="w-6 h-6 bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-[10px] font-mono">
				KF
			</div>
			<div class="min-w-0">
				<span class="block text-sm font-bold tracking-tight text-slate-900 leading-none truncate">
					KRILL<span class="text-emerald-700">SHIELD</span>
					<span class="text-xs font-normal text-slate-500 ml-2 font-mono hidden md:inline">Painel Executivo Financeiro</span>
				</span>
			</div>
		</div>

		<div class="flex items-center gap-2 text-xs font-mono shrink-0">
			<span class="text-slate-500 hidden lg:inline">Perfil: <strong>Comitê de Crédito & CFO</strong></span>
			<span class="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs">
				{data.kpis.totalEmpresas} Empresas
			</span>
		</div>
	</div>
</header>

<main class="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full min-w-0">
	<!-- Title & Subtitle -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
		<div>
			<h1 class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
				Consolidação Financeira Global & Exposição ao Stay Period
			</h1>
			<p class="text-xs text-slate-600 mt-0.5">
				Apuração consolidada da carteira sob os efeitos do art. 6º da Lei nº 11.101/2005 e Provimento CNJ nº 216/2026.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs font-mono text-slate-500 hidden sm:inline">
				DataJud / LREF Base: <strong>180 dias</strong>
			</span>
			<button
				type="button"
				onclick={exportarPdfAdmin}
				disabled={exportando}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
			>
				{#if exportando}
					<span class="i-lucide-loader-2 text-xs animate-spin"></span>
					<span>Gerando PDF...</span>
				{:else}
					<span class="i-lucide-file-down text-xs"></span>
					<span>Exportar PDF</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Executive KPI Ribbon (2x2 on mobile + 5th item spanning 2 cols, 5-col on desktop) -->
	<section class="bg-slate-200 gap-px border border-slate-200 grid grid-cols-2 lg:grid-cols-5 overflow-hidden">
		<!-- Total Carteira -->
		<div class="bg-white p-3 sm:p-4 space-y-1">
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
				Carteira Total
			</span>
			<span class="block text-lg sm:text-xl font-black text-slate-900 tabular-nums font-mono">
				{formatarBRL(data.kpis.totalGeral)}
			</span>
			<span class="block text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
				Volume total faturado
			</span>
		</div>

		<!-- Total Sobrevivem (Blindados) -->
		<div class="bg-white p-3 sm:p-4 space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
					Blindados
				</span>
				<span class="w-2 h-2 rounded-full bg-emerald-600"></span>
			</div>
			<span class="block text-lg sm:text-xl font-black text-emerald-950 tabular-nums font-mono">
				{formatarBRL(data.kpis.totalSobrevivem)}
			</span>
			<span class="block text-[10px] sm:text-[11px] text-emerald-700 font-mono truncate">
				Extraconcursal protegido
			</span>
		</div>

		<!-- Total Morrem (Presos no Stay) -->
		<div class="bg-white p-3 sm:p-4 space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
					Presos no Stay
				</span>
				<span class="w-2 h-2 rounded-full bg-rose-600"></span>
			</div>
			<span class="block text-lg sm:text-xl font-black text-rose-950 tabular-nums font-mono">
				{formatarBRL(data.kpis.totalMorrem)}
			</span>
			<span class="block text-[10px] sm:text-[11px] text-rose-700 font-mono truncate">
				Suspensos no concurso
			</span>
		</div>

		<!-- Deságio Previsto (Perda) -->
		<div class="bg-white p-3 sm:p-4 space-y-1">
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
				Perda Est. (30%)
			</span>
			<span class="block text-lg sm:text-xl font-black text-slate-900 tabular-nums font-mono">
				{formatarBRL(data.kpis.perdaPrevistaDesagio)}
			</span>
			<span class="block text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
				Evaporação est. em RJ
			</span>
		</div>

		<!-- Taxa Global de Blindagem (Spans 2 cols on mobile) -->
		<div class="bg-white p-3 sm:p-4 space-y-1 col-span-2 lg:col-span-1">
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
				Índice de Blindagem
			</span>
			<span class="block text-lg sm:text-xl font-black tabular-nums font-mono {data.kpis.taxaBlindagemGlobal >= 70 ? 'text-emerald-700' : 'text-amber-700'}">
				{data.kpis.taxaBlindagemGlobal.toFixed(1)}%
			</span>
			<span class="block text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
				Recuperação: {formatarBRL(data.kpis.recuperacaoProvavel)}
			</span>
		</div>
	</section>

	<!-- Barra de Proporção Técnica Global -->
	<section class="bg-white border border-slate-200 p-3.5 sm:p-4 space-y-2">
		<div class="flex flex-col sm:flex-row justify-between text-xs font-mono font-bold gap-1">
			<span class="text-emerald-700">
				Blindados à RJ: {data.kpis.taxaBlindagemGlobal.toFixed(1)}% ({formatarBRL(data.kpis.totalSobrevivem)})
			</span>
			<span class="text-rose-700">
				Expostos ao Stay: {(100 - data.kpis.taxaBlindagemGlobal).toFixed(1)}% ({formatarBRL(data.kpis.totalMorrem)})
			</span>
		</div>
		<div class="h-2.5 sm:h-3 w-full bg-slate-100 flex overflow-hidden border border-slate-200">
			<div
				class="h-full bg-emerald-600 transition-[width] duration-300"
				style="width: {data.kpis.taxaBlindagemGlobal}%"
				title="Sobrevivem"
			></div>
			<div
				class="h-full bg-rose-600 transition-[width] duration-300"
				style="width: {100 - data.kpis.taxaBlindagemGlobal}%"
				title="Morrem no Stay"
			></div>
		</div>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-mono pt-0.5 gap-0.5">
			<span>Art. 49, § 3º (Alienação Fiduciária) & CPR Física</span>
			<span>Art. 6º (Suspensão por 180 dias)</span>
		</div>
	</section>

	<!-- 2-Column Grid: Balanço de Instrumentos & Concentração de Risco -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start w-full min-w-0">
		<!-- Coluna 1 (7 cols): Balanço Consolidado por Instrumento Jurídico -->
		<div class="lg:col-span-7 bg-white border border-slate-200 overflow-hidden space-y-0 w-full min-w-0">
			<div class="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">
						Balanço por Instrumento Jurídico
					</h3>
					<span class="text-[10px] text-slate-500 font-mono">Consolidação de garantias na carteira</span>
				</div>
				<span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700">
					6 Modalidades
				</span>
			</div>

			<div class="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
				<table class="w-full text-xs min-w-[480px]">
					<thead>
						<tr class="text-left text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 bg-slate-50">
							<th class="px-4 py-2.5">Instrumento</th>
							<th class="px-3 py-2.5">Eficácia no Stay</th>
							<th class="px-3 py-2.5 text-right font-mono">Contratos</th>
							<th class="px-3 py-2.5 text-right font-mono">Total (R$)</th>
							<th class="px-4 py-2.5 text-right font-mono">% Portfólio</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 font-mono">
						{#each data.instrumentos as inst}
							{@const extraconcursal = inst.destinoBase === 'sobrevive'}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-2.5 font-sans font-bold text-slate-900">
									{inst.rotulo}
									<span class="block text-[10px] font-normal text-slate-500">{inst.categoria}</span>
								</td>
								<td class="px-3 py-2.5 font-sans">
									<span class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold border {extraconcursal ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}">
										{extraconcursal ? 'Sobrevive' : 'Entra no Stay'}
									</span>
								</td>
								<td class="px-3 py-2.5 text-right text-slate-700">
									{inst.quantidadeOcorrencias}
								</td>
								<td class="px-3 py-2.5 text-right font-bold text-slate-900">
									{formatarBRL(inst.totalValor)}
								</td>
								<td class="px-4 py-2.5 text-right text-slate-600">
									{inst.percentualCarteira.toFixed(1)}%
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Coluna 2 (5 cols): Radar de Concentração de Risco (Top Exposições Concursais) -->
		<div class="lg:col-span-5 bg-white border border-slate-200 overflow-hidden space-y-0 w-full min-w-0">
			<div class="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-rose-900">
						Maior Risco no Stay (Top 10)
					</h3>
					<span class="text-[10px] text-slate-500 font-mono">Empresas com mais capital quirografário</span>
				</div>
				<span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800">
					Alvo de Blindagem
				</span>
			</div>

			<div class="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
				<table class="w-full text-xs min-w-[340px]">
					<thead>
						<tr class="text-left text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 bg-slate-50">
							<th class="px-4 py-2.5">Empresa</th>
							<th class="px-3 py-2.5">Cartaz</th>
							<th class="px-4 py-2.5 text-right font-mono">Preso no Stay</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each data.topRiscoStay as emp}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-2">
									<span class="block font-bold text-slate-900 truncate max-w-44">{emp.nome}</span>
									<span class="text-[10px] text-slate-500 font-mono">{emp.cnpjCpf}</span>
								</td>
								<td class="px-3 py-2">
									<span class="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold font-mono border {badgeClasse(emp.estado)}">
										{rotuloEstado(emp.estado)}
									</span>
								</td>
								<td class="px-4 py-2 text-right font-bold text-rose-700 font-mono tabular-nums">
									{formatarBRL(emp.morrem)}
								</td>
							</tr>
						{/each}
						{#if data.topRiscoStay.length === 0}
							<tr>
								<td colspan="3" class="px-4 py-6 text-center text-slate-500 font-mono text-xs">
									Nenhuma empresa com crédito retido no Stay.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Seção 3: Livro-Razão & Histórico Cronológico de Auditorias -->
	<section class="bg-white border border-slate-200 overflow-hidden space-y-0 w-full min-w-0">
		<div class="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
			<div>
				<h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">
					Histórico de Avaliações & Livro-Razão de Auditorias
				</h3>
				<span class="text-[10px] text-slate-500 font-mono">
					{historicoFiltrado.length} registros encontrados na base SQLite
				</span>
			</div>

			<!-- Filtros e Busca -->
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
				<div class="relative w-full sm:w-52">
					<input
						type="text"
						bind:value={busca}
						placeholder="Buscar empresa ou CNPJ..."
						class="w-full pl-7 pr-2 py-1.5 sm:py-1 text-xs border border-slate-300 bg-white text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
					/>
					<span class="i-lucide-search absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></span>
				</div>

				<select
					bind:value={filtroEstado}
					class="py-1.5 sm:py-1 px-2 text-xs border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:border-slate-900 cursor-pointer w-full sm:w-auto"
				>
					<option value="TODOS">Todos os Cartazes</option>
					<option value="FIADO">NORMALIDADE</option>
					<option value="SÓ_EXTRACONCURSAL">SÓ EXTRACONCURSAL</option>
					<option value="À_VISTA">À VISTA (Rebaixamento)</option>
				</select>
			</div>
		</div>

		<div class="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
			<table class="w-full text-xs min-w-[620px]">
				<thead>
					<tr class="text-left text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 bg-slate-50 font-mono">
						<th class="px-4 py-2.5">Data / Hora</th>
						<th class="px-4 py-2.5">Empresa</th>
						<th class="px-3 py-2.5">CNPJ</th>
						<th class="px-3 py-2.5">Estado do Cartaz</th>
						<th class="px-3 py-2.5 text-right">R$ no Stay</th>
						<th class="px-3 py-2.5 text-right">R$ Blindado</th>
						<th class="px-4 py-2.5 text-right">Laudo</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-mono">
					{#each historicoFiltrado as h}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-2 text-slate-500 text-[11px]">
								{h.createdAt}
							</td>
							<td class="px-4 py-2 font-sans font-bold text-slate-900 max-w-56 truncate">
								{h.nome}
							</td>
							<td class="px-3 py-2 text-slate-600">
								{h.cnpjCpf}
							</td>
							<td class="px-3 py-2 font-sans">
								<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold border {badgeClasse(h.estadoCartaz)}">
									{rotuloEstado(h.estadoCartaz)}
								</span>
							</td>
							<td class="px-3 py-2 text-right font-bold {h.totalMorrem > 0 ? 'text-rose-700' : 'text-slate-400'}">
								{formatarBRL(h.totalMorrem)}
							</td>
							<td class="px-3 py-2 text-right font-bold text-emerald-700">
								{formatarBRL(h.totalSobrevivem)}
							</td>
							<td class="px-4 py-2 text-right">
								<button
									type="button"
									onclick={() => abrirLaudo(h)}
									class="px-2.5 py-1 text-[11px] font-bold font-sans text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
								>
									Ver Laudo
								</button>
							</td>
						</tr>
					{/each}
					{#if historicoFiltrado.length === 0}
						<tr>
							<td colspan="7" class="px-4 py-8 text-center text-slate-500 text-xs font-sans">
								Nenhum registro encontrado para os filtros selecionados.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</section>
</main>

<!-- Modal de Inspeção do Laudo Pericial -->
{#if laudoSelecionado}
	<div class="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/60 p-0 sm:p-4 md:p-8">
		<div class="w-full max-w-3xl bg-white border border-slate-300 shadow-xl overflow-hidden space-y-0 my-0 sm:my-auto rounded-none sm:rounded-xl">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 gap-2">
				<div>
					<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
						Laudo Oficial de Balcão · {laudoSelecionado.nome}
					</h3>
					<span class="text-xs text-slate-500 font-mono block sm:inline">
						CNPJ: {laudoSelecionado.cnpjCpf} · {laudoSelecionado.data}
					</span>
				</div>
				<div class="flex items-center gap-1.5 self-end sm:self-auto">
					<button
						type="button"
						onclick={exportarPdfLaudo}
						disabled={exportandoLaudo}
						class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-150 cursor-pointer disabled:opacity-60"
					>
						{#if exportandoLaudo}
							<span class="i-lucide-loader-2 text-xs animate-spin"></span>
							<span>PDF...</span>
						{:else}
							<span class="i-lucide-file-down text-xs"></span>
							<span>PDF</span>
						{/if}
					</button>
					<button
						type="button"
						onclick={copiarLaudo}
						class="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
					>
						<span class="{copiado ? 'i-lucide-check text-emerald-600' : 'i-lucide-copy text-slate-500'} text-xs"></span>
						<span>{copiado ? 'Copiado!' : 'Copiar'}</span>
					</button>
					<button
						type="button"
						aria-label="Fechar laudo"
						onclick={() => (laudoSelecionado = null)}
						class="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
					>
						<span class="i-lucide-x text-sm"></span>
					</button>
				</div>
			</div>

			<div class="p-3.5 sm:p-5 bg-slate-50 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto border-b border-slate-200">
				<pre class="text-[11px] sm:text-xs leading-relaxed text-slate-800 font-mono whitespace-pre-wrap break-words">{laudoSelecionado.texto}</pre>
			</div>

			<div class="px-4 sm:px-6 py-2.5 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-2 text-center sm:text-left">
				<span>Provimento CNJ nº 216/2026 & Lei nº 11.101/2005</span>
				<button
					type="button"
					onclick={() => (laudoSelecionado = null)}
					class="px-3 py-1 bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors duration-150 cursor-pointer w-full sm:w-auto"
				>
					Fechar
				</button>
			</div>
		</div>
	</div>
{/if}
