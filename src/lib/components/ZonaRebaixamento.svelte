<script lang="ts">
	import type { ClassificacaoCarteira } from '$lib/krillshield/rebaixamento';
	import type { EstadoCartaz } from '$lib/krillshield/types';
	import { formatarBRL } from '$lib/krillshield/types';

	let {
		classificacao,
		filtro,
		onFiltrar,
		onIrAoCorte
	} = $props<{
		classificacao: ClassificacaoCarteira;
		filtro: 'TODOS' | EstadoCartaz;
		onFiltrar: (f: 'TODOS' | EstadoCartaz) => void;
		onIrAoCorte: () => void;
	}>();

	let t = $derived(classificacao.totais);
	let total = $derived(t.salvaveis + t.rebaixados);
	let pctFiado = $derived(total > 0 ? ((total - t.alvoSalvamento - t.rebaixados) / total) * 100 : 0);
	let pctAlvo = $derived(total > 0 ? (t.alvoSalvamento / total) * 100 : 0);
	let pctRebaix = $derived(total > 0 ? (t.rebaixados / total) * 100 : 0);
	let nNormalidade = $derived(t.salvaveis - t.alvoSalvamento);
	let leftCorte = $derived(Math.max(0, Math.min(100, 100 - pctRebaix)));
</script>

<section class="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
	<div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
					Classificação da Carteira · Linha de Corte
				</span>
				<span class="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-slate-200/70 text-slate-700">
					Art. 49 LREF
				</span>
			</div>
			<h3 class="text-sm font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-1.5">
				<span class="i-lucide-scissors text-rose-600 text-sm"></span>
				Zona de Rebaixamento Concursal
			</h3>
			<p class="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
				Limiar operacional do crédito. Acima da linha de corte, créditos são recuperáveis via garantias; abaixo, o risco concursal inviabiliza prazo — cobre D+0.
			</p>
		</div>
		{#if classificacao.posicaoCorte != null}
			<button
				type="button"
				onclick={onIrAoCorte}
				class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all duration-150 cursor-pointer font-mono shadow-2xs self-start sm:self-auto"
			>
				<span class="i-lucide-scissors text-xs text-rose-600"></span>
				<span>Ir ao Corte: {classificacao.posicaoCorte}º lugar</span>
			</button>
		{:else}
			<span class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl font-mono self-start sm:self-auto">
				<span class="i-lucide-shield-check text-xs text-emerald-600"></span>
				<span>Carteira 100% Blindada</span>
			</span>
		{/if}
	</div>

	<!-- Spectrum Bar -->
	<div class="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100">
		<div class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
			<span class="flex items-center gap-1 text-emerald-700">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
				Ainda dá para salvar (Crédito Recuperável) →
			</span>
			<span class="flex items-center gap-1 text-rose-700">
				← Não vale ir atrás (Cobrança D+0)
				<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
			</span>
		</div>
		<div class="relative py-1">
			<div class="h-3 w-full bg-slate-100 rounded-full border border-slate-200/80 flex overflow-hidden shadow-inner">
				{#if pctFiado > 0}
					<div class="h-full shrink-0 bg-emerald-500 transition-all duration-300" style="width: {pctFiado}%" title="Normalidade: {nNormalidade} empresas"></div>
				{/if}
				{#if pctAlvo > 0}
					<div class="h-full shrink-0 bg-amber-400 transition-all duration-300" style="width: {pctAlvo}%" title="Alvo de Salvamento: {t.alvoSalvamento} empresas"></div>
				{/if}
				{#if pctRebaix > 0}
					<div class="h-full shrink-0 bg-rose-500 transition-all duration-300" style="width: {pctRebaix}%" title="Zona Rebaixada: {t.rebaixados} empresas"></div>
				{/if}
			</div>
			{#if pctRebaix > 0 && pctRebaix < 100}
				<div
					class="absolute top-0 bottom-0 w-1 bg-slate-950 rounded-full shadow-md pointer-events-none"
					style="left: {leftCorte}%"
					title="Linha de corte operacional"
				></div>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2 text-xs font-mono text-slate-600">
			<span class="inline-flex items-center gap-1.5 font-medium">
				<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
				Normalidade: <strong class="text-slate-800">{nNormalidade}</strong>
			</span>
			<span class="inline-flex items-center gap-1.5 font-medium text-amber-900">
				<span class="w-2 h-2 rounded-full bg-amber-400"></span>
				Alvo Salvável: <strong class="text-amber-950">{t.alvoSalvamento}</strong>
			</span>
			<span class="inline-flex items-center gap-1.5 font-bold text-rose-800">
				<span class="w-2 h-2 rounded-full bg-rose-500"></span>
				Rebaixadas: <strong class="text-rose-950">{t.rebaixados}</strong>
			</span>
		</div>
	</div>

	<!-- Action Grid (Salvável vs Rebaixamento) -->
	<div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
		<button
			type="button"
			onclick={() => onFiltrar(filtro === 'SÓ_EXTRACONCURSAL' ? 'TODOS' : 'SÓ_EXTRACONCURSAL')}
			class="text-left p-4 sm:p-5 bg-white hover:bg-amber-50/40 transition-all duration-150 cursor-pointer {filtro === 'SÓ_EXTRACONCURSAL'
				? 'bg-amber-50/60 ring-2 ring-inset ring-amber-400'
				: ''}"
		>
			<div class="flex items-center justify-between gap-2 mb-1.5">
				<span class="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-mono flex items-center gap-1">
					<span class="i-lucide-target text-amber-600 text-xs"></span>
					Acima da linha · Ir Atrás
				</span>
				<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
					{filtro === 'SÓ_EXTRACONCURSAL' ? 'Filtro Ativo' : 'Clique para filtrar'}
				</span>
			</div>
			<div class="text-2xl font-black text-slate-900 tabular-nums font-mono leading-none">
				{t.alvoSalvamento}
				<span class="text-xs font-sans text-slate-500 font-bold">empresa(s) alvo</span>
			</div>
			<p class="text-xs text-slate-600 mt-2 leading-relaxed">
				<strong class="text-slate-900">{t.salvaveis}</strong> fora da zona de perigo · <strong class="text-emerald-700">{formatarBRL(t.blindadoSalvavel)}</strong> blindados.
				{#if t.presoSalvavel > 0}
					<span class="text-amber-900 block mt-0.5">
						{formatarBRL(t.presoSalvavel)} presos no stay — superáveis mediante garantia real.
					</span>
				{/if}
			</p>
		</button>

		<button
			type="button"
			onclick={() => onFiltrar(filtro === 'À_VISTA' ? 'TODOS' : 'À_VISTA')}
			class="text-left p-4 sm:p-5 bg-white hover:bg-rose-50/40 transition-all duration-150 cursor-pointer {filtro === 'À_VISTA'
				? 'bg-rose-50/60 ring-2 ring-inset ring-rose-400'
				: ''}"
		>
			<div class="flex items-center justify-between gap-2 mb-1.5">
				<span class="text-[10px] font-bold uppercase tracking-wider text-rose-900 font-mono flex items-center gap-1">
					<span class="i-lucide-ban text-rose-600 text-xs"></span>
					Abaixo da linha · Não Persiga
				</span>
				<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-200">
					{filtro === 'À_VISTA' ? 'Filtro Ativo' : 'Clique para filtrar'}
				</span>
			</div>
			<div class="text-2xl font-black text-rose-950 tabular-nums font-mono leading-none">
				{t.rebaixados}
				<span class="text-xs font-sans text-rose-700 font-bold">empresa(s) rebaixada(s)</span>
			</div>
			<p class="text-xs text-rose-900/90 mt-2 leading-relaxed">
				<strong class="text-rose-950 font-bold">{formatarBRL(t.exposicaoRebaixamento)}</strong> nesta zona. Não conceda prazo — retenção concursiva é iminente.
			</p>
		</button>
	</div>

	{#if classificacao.ultimoASalvar || classificacao.primeiroRebaixado}
		<div class="px-4 sm:px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
			{#if classificacao.ultimoASalvar}
				<div class="flex items-center gap-1.5 min-w-0">
					<span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
					<span class="font-bold text-amber-900">Último a se salvar:</span>
					<span class="font-semibold text-slate-800 truncate">{classificacao.ultimoASalvar.posicao}º {classificacao.ultimoASalvar.nome}</span>
				</div>
			{/if}
			{#if classificacao.primeiroRebaixado}
				<div class="flex items-center gap-1.5 min-w-0">
					<span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
					<span class="font-bold text-rose-800">Primeiro rebaixado:</span>
					<span class="font-semibold text-slate-800 truncate">{classificacao.primeiroRebaixado.posicao}º {classificacao.primeiroRebaixado.nome}</span>
				</div>
			{/if}
		</div>
	{/if}
</section>
