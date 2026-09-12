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
</script>

<div class="bg-white border border-slate-200 p-3.5 sm:p-6 space-y-4 sm:space-y-6">
	<!-- Top Bar -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200">
		<div class="flex items-start gap-3">
			<div class="w-8 h-8 bg-slate-900 text-white flex items-center justify-center shrink-0 text-base font-bold">
				<span class="i-lucide-file-text"></span>
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
						Espelho
					</h3>
				</div>
				<p class="text-xs text-slate-500 mt-0.5">
					Parecer Técnico & Auditoria de Balcão · Verificação prévia do passivo agro e enquadramento LREF
				</p>
			</div>
		</div>

		<!-- Actions & Tab Switcher -->
		<div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
			<!-- Live Provider Tag -->
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium bg-slate-100 border border-slate-200 text-slate-700 justify-center sm:justify-start">
				<span class="w-1.5 h-1.5 rounded-full {provedor.includes('gemini') ? 'bg-sky-600' : 'bg-emerald-600'}"></span>
				{provedor.includes('gemini') ? 'Motor: Gemini 3.6 Flash' : 'Motor: Determinístico'}
			</span>

			<!-- Tab Switcher -->
			<div class="flex items-center border border-slate-200 text-xs w-full sm:w-auto">
				<button
					type="button"
					onclick={() => (abaAtiva = 'inteligencia')}
					class="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-center font-semibold transition-colors duration-150 cursor-pointer {abaAtiva === 'inteligencia'
						? 'bg-slate-900 text-white'
						: 'bg-white text-slate-600 hover:text-slate-900'}"
				>
					Parecer & Rastreabilidade
				</button>
				<button
					type="button"
					onclick={() => (abaAtiva = 'laudo')}
					class="flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-center font-semibold border-l border-slate-200 transition-colors duration-150 cursor-pointer {abaAtiva === 'laudo'
						? 'bg-slate-900 text-white'
						: 'bg-white text-slate-600 hover:text-slate-900'}"
				>
					Laudo Pericial Formal
				</button>
			</div>

			<!-- Trigger Rewrite Button -->
			<button
				type="button"
				onclick={onRegredigir}
				disabled={carregando}
				class="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 transition-colors duration-150 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
			>
				{#if carregando}
					<span class="i-lucide-loader-2 text-xs animate-spin"></span>
					<span>Atualizando Parecer...</span>
				{:else}
					<span class="i-lucide-refresh-cw text-xs"></span>
					<span>Atualizar Parecer Técnico</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- TAB 1: PARECER EXECUTIVO & FONTES AUDITADAS -->
	{#if abaAtiva === 'inteligencia'}
		<div class="space-y-5">
			<!-- Executive Summary (Parecer do Comitê) -->
			<div class="border-l-4 border-slate-900 bg-slate-50 p-4 space-y-2">
				<div class="flex items-center justify-between gap-2">
					<span class="text-[10px] font-bold uppercase tracking-wider text-slate-700">
						Parecer Técnico-Consultivo do Comitê de Crédito
					</span>
					<span class="text-[10px] font-mono font-semibold text-slate-500">
						Auditoria de Risco de Balcão · D+0
					</span>
				</div>

				<p class="text-xs font-medium text-slate-800 leading-relaxed">
					{iaResposta?.resumoExecutivo ?? 'Selecione uma empresa na carteira para visualizar o parecer técnico.'}
				</p>

				{#if iaResposta?.orientacaoBalcao}
					<div class="pt-2 border-t border-slate-200 flex items-start gap-2 text-xs text-slate-700">
						<span class="i-lucide-user-check text-slate-700 text-sm shrink-0 mt-0.5"></span>
						<div>
							<strong class="text-slate-900 font-bold">Diretriz de Condução Comercial:</strong>
							<span class="ml-1 text-slate-700">{iaResposta.orientacaoBalcao}</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Recommendations vs. Restrictions Matrix -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<!-- CONDIÇÕES OPERACIONAIS RECOMENDADAS -->
				<div class="p-4 border border-emerald-200 bg-emerald-50/20 space-y-2.5">
					<div class="flex items-center justify-between pb-2 border-b border-emerald-200/60">
						<div class="flex items-center gap-1.5">
							<span class="i-lucide-check text-emerald-700 text-sm"></span>
							<h4 class="text-xs font-bold uppercase tracking-wider text-emerald-900">
								Condições Operacionais Recomendadas
							</h4>
						</div>
						<span class="text-[10px] font-mono font-bold text-emerald-800">
							Diretrizes Favoráveis
						</span>
					</div>

					<ul class="space-y-2 text-xs text-slate-800">
						{#if iaResposta?.recomendacoes && iaResposta.recomendacoes.length > 0}
							{#each iaResposta.recomendacoes as rec}
								<li class="flex items-start gap-2 leading-relaxed">
									<span class="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
									<span>{rec}</span>
								</li>
							{/each}
						{:else}
							<li class="text-slate-500 italic text-[11px]">Nenhuma diretriz adicional necessária para este perfil.</li>
						{/if}
					</ul>
				</div>

				<!-- SALVAGUARDAS & PONTOS DE ATENÇÃO -->
				<div class="p-4 border border-amber-200 bg-amber-50/20 space-y-2.5">
					<div class="flex items-center justify-between pb-2 border-b border-amber-200/60">
						<div class="flex items-center gap-1.5">
							<span class="i-lucide-alert-triangle text-amber-700 text-sm"></span>
							<h4 class="text-xs font-bold uppercase tracking-wider text-amber-950">
								Salvaguardas & Pontos de Atenção Contratual
							</h4>
						</div>
						<span class="text-[10px] font-mono font-bold text-amber-900">
							Mitigação Jurídica
						</span>
					</div>

					<ul class="space-y-2 text-xs text-slate-800">
						{#if iaResposta?.restricoes && iaResposta.restricoes.length > 0}
							{#each iaResposta.restricoes as res}
								<li class="flex items-start gap-2 leading-relaxed">
									<span class="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5"></span>
									<span>{res}</span>
								</li>
							{/each}
						{:else}
							<li class="text-emerald-800 font-medium flex items-center gap-1.5 text-[11px]">
								<span class="i-lucide-check-circle text-xs text-emerald-600"></span>
								Perfil de baixo risco: nenhuma salvaguarda impeditiva para esta operação.
							</li>
						{/if}
					</ul>
				</div>
			</div>

			<!-- RASTREABILIDADE: FONTES OFICIAIS AUDITADAS -->
			<div class="space-y-2.5 pt-1">
				<div class="flex items-center justify-between">
					<div>
						<h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">
							Rastreabilidade & Procedência dos Dados Auditados
						</h4>
						<p class="text-[11px] text-slate-500">
							Bases públicas e cadastros oficiais verificados pelo motor regulatório
						</p>
					</div>
					<span class="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
						5 Bases Oficiais
					</span>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
					{#if iaResposta?.fontesAuditadas}
						{#each iaResposta.fontesAuditadas as f}
							<div class="p-3 bg-slate-50 border border-slate-200 space-y-1">
								<div class="flex items-center justify-between gap-1.5">
									<span class="text-xs font-bold text-slate-900 truncate">{f.fonte}</span>
									<span class="text-[10px] font-mono font-bold px-1.5 py-0.2 border {f.status === 'ok'
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
			<div class="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
				<div>
					<span class="text-xs font-bold text-slate-900 uppercase tracking-wider">Documento Oficial de Balcão (Laudo Pericial)</span>
					<p class="text-[11px] text-slate-500">Formatado para impressão, dossiê do comitê e auditoria jurídica</p>
				</div>
				<button
					type="button"
					onclick={copiarLaudo}
					class="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors duration-150 cursor-pointer w-full sm:w-auto"
				>
					<span class="{copiado ? 'i-lucide-check text-emerald-600' : 'i-lucide-copy text-slate-500'} text-xs"></span>
					<span>{copiado ? 'Copiado!' : 'Copiar Laudo'}</span>
				</button>
			</div>

			<div class="border border-slate-200 bg-slate-50 p-3 sm:p-4">
				<pre class="text-[11px] leading-relaxed text-slate-800 font-mono whitespace-pre-wrap break-words max-h-120 overflow-y-auto">{iaResposta?.laudoFormatado || texto}</pre>
			</div>
		</div>
	{/if}
</div>

