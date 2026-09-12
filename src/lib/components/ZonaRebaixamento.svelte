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

<section class="bg-white border border-slate-200">
	<div class="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200">
		<div class="min-w-0">
			<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
				Classificação da carteira · linha de corte
			</span>
			<h3 class="text-sm font-bold text-slate-900 tracking-tight mt-0.5">
				Zona de rebaixamento
			</h3>
			<p class="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
				Daonde não vale mais ir atrás. Acima da linha ainda dá para salvar; abaixo, não persiga crédito — cobre D+0.
			</p>
		</div>
		{#if classificacao.posicaoCorte != null}
			<button
				type="button"
				onclick={onIrAoCorte}
				class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors duration-150 cursor-pointer font-mono"
			>
				<span class="i-lucide-scissors text-xs"></span>
				<span>Linha de corte: {classificacao.posicaoCorte}º</span>
			</button>
		{:else}
			<span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold font-mono">
				<span class="i-lucide-shield-check text-xs"></span>
				<span>Ninguém na zona</span>
			</span>
		{/if}
	</div>

	<div class="px-5 pt-3 pb-2 border-b border-slate-200">
		<div class="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
			<span>Ainda dá para salvar →</span>
			<span>← Não vale ir atrás</span>
		</div>
		<div class="relative">
			<div class="h-2 w-full bg-slate-100 border border-slate-200 flex overflow-hidden">
				{#if pctFiado > 0}
					<div class="h-full shrink-0 bg-emerald-600" style="width: {pctFiado}%" title="Normalidade"></div>
				{/if}
				{#if pctAlvo > 0}
					<div class="h-full shrink-0 bg-amber-500" style="width: {pctAlvo}%" title="Ainda dá para salvar"></div>
				{/if}
				{#if pctRebaix > 0}
					<div class="h-full shrink-0 bg-rose-600" style="width: {pctRebaix}%" title="Zona de rebaixamento"></div>
				{/if}
			</div>
			{#if pctRebaix > 0 && pctRebaix < 100}
				<div
					class="absolute top-[-5px] bottom-[-5px] w-0.5 bg-rose-900 pointer-events-none"
					style="left: {leftCorte}%"
					title="Linha de corte"
				></div>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1.5 text-xs font-mono text-slate-600">
			<span class="inline-flex items-center gap-1.5">
				<span class="w-2 h-2 bg-emerald-600"></span>
				Normalidade: {nNormalidade}
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span class="w-2 h-2 bg-amber-500"></span>
				Alvo: {t.alvoSalvamento}
			</span>
			<span class="inline-flex items-center gap-1.5 font-bold text-rose-800">
				<span class="w-2 h-2 bg-rose-600"></span>
				Rebaixadas: {t.rebaixados}
			</span>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
		<button
			type="button"
			onclick={() => onFiltrar(filtro === 'SÓ_EXTRACONCURSAL' ? 'TODOS' : 'SÓ_EXTRACONCURSAL')}
			class="text-left p-4 bg-white hover:bg-amber-50/40 transition-colors duration-150 cursor-pointer {filtro === 'SÓ_EXTRACONCURSAL'
				? 'bg-amber-50/50'
				: ''}"
		>
			<div class="flex items-center justify-between gap-2 mb-1">
				<span class="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-mono">
					Acima da linha · ir atrás
				</span>
				<span class="i-lucide-target text-amber-700 text-sm"></span>
			</div>
			<div class="text-xl font-black text-slate-900 tabular-nums font-mono leading-none">
				{t.alvoSalvamento}
				<span class="text-xs font-sans text-slate-500 font-bold">alvo(s)</span>
			</div>
			<p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
				{t.salvaveis} fora da zona · {formatarBRL(t.blindadoSalvavel)} blindado.
				{#if t.presoSalvavel > 0}
					{formatarBRL(t.presoSalvavel)} preso no stay — ainda cabe instrumento.
				{/if}
			</p>
		</button>

		<button
			type="button"
			onclick={() => onFiltrar(filtro === 'À_VISTA' ? 'TODOS' : 'À_VISTA')}
			class="text-left p-4 bg-white hover:bg-rose-50/40 transition-colors duration-150 cursor-pointer {filtro === 'À_VISTA'
				? 'bg-rose-50/50'
				: ''}"
		>
			<div class="flex items-center justify-between gap-2 mb-1">
				<span class="text-[10px] font-bold uppercase tracking-wider text-rose-900 font-mono">
					Abaixo da linha · não persiga
				</span>
				<span class="i-lucide-ban text-rose-700 text-sm"></span>
			</div>
			<div class="text-xl font-black text-rose-950 tabular-nums font-mono leading-none">
				{t.rebaixados}
				<span class="text-xs font-sans text-rose-700 font-bold">rebaixada(s)</span>
			</div>
			<p class="text-xs text-rose-900/80 mt-1.5 leading-relaxed">
				{formatarBRL(t.exposicaoRebaixamento)} nesta zona. Não vale ir atrás — cobre à vista, não renegocie prazo.
			</p>
		</button>
	</div>

	{#if classificacao.ultimoASalvar || classificacao.primeiroRebaixado}
		<div class="px-5 py-2 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-600 font-mono">
			{#if classificacao.ultimoASalvar}
				<div class="min-w-0">
					<span class="font-bold text-amber-900">Último a se salvar:</span>
					<span class="font-semibold text-slate-800 ml-1">{classificacao.ultimoASalvar.posicao}º {classificacao.ultimoASalvar.nome}</span>
				</div>
			{/if}
			{#if classificacao.primeiroRebaixado}
				<div class="min-w-0">
					<span class="font-bold text-rose-800">Primeiro rebaixado:</span>
					<span class="font-semibold text-slate-800 ml-1">{classificacao.primeiroRebaixado.posicao}º {classificacao.primeiroRebaixado.nome}</span>
				</div>
			{/if}
		</div>
	{/if}
</section>
