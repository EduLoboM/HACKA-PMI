<script lang="ts">
	import type { AnaliseKrillShield, RespostaIA } from '$lib/krillshield/types';

	let {
		analise,
		texto,
		iaResposta,
		provedor,
		carregando,
		onRegredigir
	} = $props<{
		analise: AnaliseKrillShield | null;
		texto: string;
		iaResposta?: RespostaIA;
		provedor: string;
		carregando: boolean;
		onRegredigir: () => void;
	}>();

	let abaAtiva = $state<'inteligencia' | 'laudo'>('inteligencia');
	let copiado = $state(false);
	let exportandoPDF = $state(false);

	async function copiarLaudo() {
		const conteudo = iaResposta?.laudoFormatado || texto;
		if (!conteudo) return;
		try {
			await navigator.clipboard.writeText(conteudo);
			copiado = true;
			setTimeout(() => (copiado = false), 2200);
		} catch {
			// Fallback se permissão de clipboard falhar
		}
	}

	async function exportarPDF() {
		if (!analise || exportandoPDF) return;
		exportandoPDF = true;
		try {
			const { exportarLaudoIndividualPDF } = await import('$lib/krillshield/exportPdf');
			exportarLaudoIndividualPDF({
				nome: analise.perfil.nome,
				cnpjCpf: analise.perfil.cnpjCpf,
				estado: analise.decisao.estado,
				data: new Date().toLocaleDateString('pt-BR'),
				texto: iaResposta?.laudoFormatado || texto || ''
			});
		} catch (e) {
			console.error('Falha ao exportar PDF do laudo', e);
		} finally {
			exportandoPDF = false;
		}
	}
</script>

<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
	<!-- Top Bar -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
		<div class="flex items-start gap-3">
			<div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
				<span class="i-lucide-file-text text-lg"></span>
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
						Espelho & Laudo Pericial
					</h3>
					<span class="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
						Provimento 216
					</span>
				</div>
				<p class="text-xs text-slate-500 mt-0.5">
					Parecer Técnico & Auditoria de Balcão · Verificação prévia do passivo agro e enquadramento LREF
				</p>
			</div>
		</div>

		<!-- Actions & Tab Switcher -->
		<div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
			<!-- Live Provider Tag -->
			<span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-semibold bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 justify-center sm:justify-start shadow-2xs">
				<span class="w-2 h-2 rounded-full {provedor.includes('gemini') ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'}"></span>
				{provedor.includes('gemini') ? 'Motor: Gemini 3.6 Flash' : 'Motor: Determinístico'}
			</span>

			<!-- Tab Switcher -->
			<div class="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80 text-xs w-full sm:w-auto">
				<button
					type="button"
					onclick={() => (abaAtiva = 'inteligencia')}
					class="flex-1 sm:flex-none px-3.5 py-1.5 text-center font-bold rounded-lg transition-all duration-150 cursor-pointer {abaAtiva === 'inteligencia'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					Parecer & Rastreabilidade
				</button>
				<button
					type="button"
					onclick={() => (abaAtiva = 'laudo')}
					class="flex-1 sm:flex-none px-3.5 py-1.5 text-center font-bold rounded-lg transition-all duration-150 cursor-pointer {abaAtiva === 'laudo'
						? 'bg-white text-slate-900 shadow-xs'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					Laudo Pericial Formal
				</button>
			</div>

			<!-- PDF Export Button -->
			<button
				type="button"
				onclick={exportarPDF}
				disabled={exportandoPDF || !analise}
				class="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-2xs w-full sm:w-auto"
				title="Baixar Laudo Técnico Oficial em formato PDF"
			>
				{#if exportandoPDF}
					<span class="i-lucide-loader-2 text-xs animate-spin text-slate-700"></span>
					<span>Gerando PDF...</span>
				{:else}
					<span class="i-lucide-file-down text-xs text-rose-600"></span>
					<span>Exportar PDF</span>
				{/if}
			</button>

			<!-- Trigger Rewrite Button -->
			<button
				type="button"
				onclick={onRegredigir}
				disabled={carregando}
				class="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-2xs w-full sm:w-auto"
			>
				{#if carregando}
					<span class="i-lucide-loader-2 text-xs animate-spin"></span>
					<span>Atualizando Parecer...</span>
				{:else}
					<span class="i-lucide-sparkles text-xs text-amber-400"></span>
					<span>Atualizar Parecer IA</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- TAB 1: PARECER EXECUTIVO & FONTES AUDITADAS -->
	{#if abaAtiva === 'inteligencia'}
		<div class="space-y-5">
			<!-- Executive Summary (Parecer do Comitê) -->
			<div class="rounded-xl border-l-4 border-slate-900 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5 space-y-2 border border-slate-100 shadow-2xs">
				<div class="flex items-center justify-between gap-2">
					<span class="text-[10px] font-bold uppercase tracking-wider text-slate-700 font-mono">
						Parecer Técnico-Consultivo do Comitê de Crédito
					</span>
					<span class="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
						Auditoria D+0
					</span>
				</div>

				<p class="text-xs font-semibold text-slate-800 leading-relaxed">
					{iaResposta?.resumoExecutivo ?? 'Selecione uma empresa na carteira para visualizar o parecer técnico.'}
				</p>

				{#if iaResposta?.orientacaoBalcao}
					<div class="pt-2.5 border-t border-slate-200/80 flex items-start gap-2 text-xs text-slate-700">
						<span class="i-lucide-compass text-slate-800 text-sm shrink-0 mt-0.5"></span>
						<div>
							<strong class="text-slate-900 font-bold">Diretriz de Condução Comercial:</strong>
							<span class="ml-1 text-slate-700 font-normal">{iaResposta.orientacaoBalcao}</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Recommendations vs. Restrictions Matrix -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<!-- CONDIÇÕES OPERACIONAIS RECOMENDADAS -->
				<div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/25 space-y-3">
					<div class="flex items-center justify-between pb-2 border-b border-emerald-200/60">
						<div class="flex items-center gap-1.5">
							<span class="i-lucide-check-circle-2 text-emerald-600 text-sm"></span>
							<h4 class="text-xs font-bold uppercase tracking-wider text-emerald-950">
								Condições Operacionais Recomendadas
							</h4>
						</div>
						<span class="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
							Favoráveis
						</span>
					</div>

					<ul class="space-y-2 text-xs text-slate-800">
						{#if iaResposta?.recomendacoes && iaResposta.recomendacoes.length > 0}
							{#each iaResposta.recomendacoes as rec}
								<li class="flex items-start gap-2 leading-relaxed">
									<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
									<span>{rec}</span>
								</li>
							{/each}
						{:else}
							<li class="text-slate-500 italic text-[11px]">Nenhuma diretriz adicional necessária para este perfil.</li>
						{/if}
					</ul>
				</div>

				<!-- SALVAGUARDAS & PONTOS DE ATENÇÃO -->
				<div class="p-4 rounded-xl border border-amber-200 bg-amber-50/25 space-y-3">
					<div class="flex items-center justify-between pb-2 border-b border-amber-200/60">
						<div class="flex items-center gap-1.5">
							<span class="i-lucide-alert-triangle text-amber-600 text-sm"></span>
							<h4 class="text-xs font-bold uppercase tracking-wider text-amber-950">
								Salvaguardas & Pontos de Atenção Contratual
							</h4>
						</div>
						<span class="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
							Mitigação Jurídica
						</span>
					</div>

					<ul class="space-y-2 text-xs text-slate-800">
						{#if iaResposta?.restricoes && iaResposta.restricoes.length > 0}
							{#each iaResposta.restricoes as res}
								<li class="flex items-start gap-2 leading-relaxed">
									<span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
									<span>{res}</span>
								</li>
							{/each}
						{:else}
							<li class="text-emerald-800 font-semibold flex items-center gap-1.5 text-[11px]">
								<span class="i-lucide-check-circle text-xs text-emerald-600"></span>
								Perfil de baixo risco: nenhuma salvaguarda impeditiva para esta operação.
							</li>
						{/if}
					</ul>
				</div>
			</div>

			<!-- RASTREABILIDADE: FONTES OFICIAIS AUDITADAS -->
			<div class="space-y-3 pt-1">
				<div class="flex items-center justify-between">
					<div>
						<h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">
							Rastreabilidade & Procedência dos Dados Auditados
						</h4>
						<p class="text-[11px] text-slate-500">
							Bases públicas e cadastros oficiais verificados pelo motor regulatório
						</p>
					</div>
					<span class="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
						5 Bases Oficiais
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#if iaResposta?.fontesAuditadas}
						{#each iaResposta.fontesAuditadas as f}
							<div class="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-slate-300 transition-colors">
								<div class="flex items-center justify-between gap-1.5">
									<span class="text-xs font-bold text-slate-900 truncate">{f.fonte}</span>
									<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border {f.status === 'ok'
										? 'bg-emerald-50 text-emerald-800 border-emerald-200'
										: f.status === 'alerta'
											? 'bg-amber-50 text-amber-900 border-amber-200'
											: 'bg-rose-50 text-rose-900 border-rose-200'}">
										{f.status === 'ok' ? 'Auditado' : f.status === 'alerta' ? 'Atenção' : 'Risco'}
									</span>
								</div>
								<div class="text-xs font-bold text-slate-900 font-mono">
									{f.dado}
								</div>
								<p class="text-[11px] text-slate-500 leading-snug">
									{f.descricao}
								</p>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- TAB 2: LAUDO TÉCNICO FORMAL COMPLETO (DOCUMENTO) -->
		<div class="space-y-3">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
				<div>
					<span class="text-xs font-bold text-slate-900 uppercase tracking-wider">Documento Oficial de Balcão (Laudo Pericial)</span>
					<p class="text-[11px] text-slate-500">Formatado para impressão, dossiê do comitê e auditoria jurídica</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={copiarLaudo}
						class="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
					>
						<span class="{copiado ? 'i-lucide-check text-emerald-600' : 'i-lucide-copy text-slate-500'} text-xs"></span>
						<span>{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
					</button>
					<button
						type="button"
						onclick={exportarPDF}
						disabled={exportandoPDF || !analise}
						class="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors duration-150 cursor-pointer disabled:opacity-50"
					>
						<span class="i-lucide-file-down text-xs text-rose-400"></span>
						<span>Baixar PDF</span>
					</button>
				</div>
			</div>

			<div class="border border-slate-200 rounded-xl bg-slate-50/90 p-4">
				<pre class="text-[11px] leading-relaxed text-slate-800 font-mono whitespace-pre-wrap break-words max-h-120 overflow-y-auto selection:bg-emerald-200">{iaResposta?.laudoFormatado || texto}</pre>
			</div>
		</div>
	{/if}
</div>

