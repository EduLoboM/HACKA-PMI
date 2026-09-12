<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type {
		AnaliseKrillShield,
		PerfilProdutor,
		Garantia,
		EstadoCartaz
	} from '$lib/krillshield/types';
	import { GARANTIAS, ESTADOS_CARTAZ, formatarBRL } from '$lib/krillshield/types';
	import { gerarRespostaPadrao } from '$lib/krillshield/atendente';
	import { classificarCarteira } from '$lib/krillshield/rebaixamento';
	import PosterDeDecisao from '$lib/components/PosterDeDecisao.svelte';
	import StayVisor from '$lib/components/StayVisor.svelte';
	import RegraCard from '$lib/components/RegraCard.svelte';
	import Espelho from '$lib/components/Espelho.svelte';
	import RexControl from '$lib/components/RexControl.svelte';
	import ProducerForm from '$lib/components/ProducerForm.svelte';
	import ZonaRebaixamento from '$lib/components/ZonaRebaixamento.svelte';
	import TrilhaDeDegraus from '$lib/components/TrilhaDeDegraus.svelte';
	import ModalPosicaoProdutor from '$lib/components/ModalPosicaoProdutor.svelte';

	type LinhaBalcao = {
		id: number;
		cnpjCpf: string;
		nome: string;
		estado: EstadoCartaz;
		morrem: number;
		sobrevivem: number;
		instrumento: string | null;
	};

	let { data } = $props<{
		data: {
			produtores: LinhaBalcao[];
			resumo: Record<EstadoCartaz, number>;
			user: { id: number; nome: string; email: string } | null;
		};
	}>();

	async function sair() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		window.location.assign('/login');
	}

	let produtores = $derived((data.produtores ?? []) as LinhaBalcao[]);
	let resumo = $derived(
		(data.resumo ?? { FIADO: 0, 'SÓ_EXTRACONCURSAL': 0, 'À_VISTA': 0 }) as Record<
			EstadoCartaz,
			number
		>
	);
	let produtorId = $state<number | null>(null);
	let analise = $state<AnaliseKrillShield | null>(null);
	let basePerfil = $state<PerfilProdutor | null>(null);
	let carregando = $state(false);
	let espelhoCarregando = $state(false);
	let flipAtivo = $state(false);
	let erro = $state('');
	let provedor = $state('atendente-modelo · determinístico');
	let filtro = $state<'TODOS' | EstadoCartaz>('TODOS');
	let busca = $state('');

	type FormEstado =
		| { modo: 'criar' }
		| { modo: 'editar'; produtor: PerfilProdutor }
		| null;
	let form = $state<FormEstado>(null);
	let analiseModalPosicao = $state<AnaliseKrillShield | null>(null);

	async function avaliar(alvo?: PerfilProdutor) {
		if (produtorId == null) return;
		carregando = true;
		erro = '';
		try {
			const res = await fetch('/api/avaliar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ produtorId, perfil: alvo ?? null })
			});
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error ?? `HTTP ${res.status}`);
			}
			const r = (await res.json()) as AnaliseKrillShield;
			if (!r.iaResposta) {
				r.iaResposta = gerarRespostaPadrao(r);
			}
			analise = r;
			if (!alvo) basePerfil = r.perfil;
		} catch (e) {
			erro = e instanceof Error ? e.message : String(e);
			analise = null;
		} finally {
			carregando = false;
		}
	}

	async function redigirComAtendente() {
		if (!analise?.textoEspelho) return;
		espelhoCarregando = true;
		try {
			const res = await fetch('/api/atendente', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ laudoAtual: analise.textoEspelho, contexto: analise })
			});
			const r = await res.json();
			if (analise) {
				analise = {
					...analise,
					textoEspelho: r.texto ?? analise.textoEspelho,
					iaResposta: r.respostaIA ?? analise.iaResposta
				};
				provedor = r.provedor?.includes('gemini') ? `${r.provedor} · Atendente IA` : 'atendente-modelo · determinístico';
			}
		} catch {
			erro = 'Falha ao redigir com o Atendente';
		} finally {
			espelhoCarregando = false;
		}
	}

	function toggleFlip() {
		flipAtivo = !flipAtivo;
		if (basePerfil) {
			avaliar(flipAtivo ? { ...basePerfil, dataRegistroJunta: '2025-11-01', areaPlantadaCAR: 400 } : basePerfil);
		}
	}

	async function semearDemo() {
		await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true }) });
		await invalidateAll();
		const primeiro = produtores[0]?.id ?? null;
		produtorId = primeiro;
		flipAtivo = false;
		provedor = 'atendente-modelo · determinístico';
		avaliar();
	}

	function selecionar(p: LinhaBalcao) {
		if (p.id === produtorId) return;
		produtorId = p.id;
		flipAtivo = false;
		provedor = 'atendente-modelo · determinístico';
		avaliar();
	}

	function abrirCriar() {
		form = { modo: 'criar' };
	}

	async function abrirEditar(id: number) {
		const res = await fetch(`/api/produtor/${id}`);
		const r = await res.json();
		if (r.perfil) form = { modo: 'editar', produtor: r.perfil };
	}

	async function excluir(p: LinhaBalcao) {
		if (!globalThis.confirm(`Excluir ${p.nome}? Essa ação não pode ser desfeita.`)) return;
		const res = await fetch(`/api/produtor/${p.id}`, { method: 'DELETE' });
		if (!res.ok) {
			erro = 'Falha ao excluir produtor';
			return;
		}
		if (produtorId === p.id) {
			produtorId = null;
			analise = null;
			basePerfil = null;
		}
		await invalidateAll();
	}

	async function salvo(novoId: number) {
		form = null;
		produtorId = novoId;
		flipAtivo = false;
		provedor = 'atendente-modelo · determinístico';
		await invalidateAll();
		await avaliar();
		if (analise) {
			analiseModalPosicao = analise;
		}
	}

	async function abrirModalPosicao(p: LinhaBalcao) {
		produtorId = p.id;
		flipAtivo = false;
		provedor = 'atendente-modelo · determinístico';
		await avaliar();
		if (analise) {
			analiseModalPosicao = analise;
		}
	}

	function verDossieCompleto() {
		analiseModalPosicao = null;
		tick().then(() => {
			const el = document.getElementById('secao-dossie');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		});
	}

	function badgeClasse(estado: EstadoCartaz) {
		const m = ESTADOS_CARTAZ[estado];
		return `${m.bg}`;
	}

	let classificacao = $derived(classificarCarteira(produtores));

	let filtrados = $derived.by(() => {
		const base =
			filtro === 'TODOS'
				? classificacao.ranking
				: classificacao.ranking.filter((p) => p.estado === filtro);

		if (!busca.trim()) return base;
		const termo = busca.trim().toLowerCase();
		return base.filter(
			(p) =>
				p.nome.toLowerCase().includes(termo) ||
				p.cnpjCpf.toLowerCase().includes(termo)
		);
	});

	let indiceCorteFiltrado = $derived(filtrados.findIndex((p) => p.zona === 'REBAIXAMENTO'));

	let totalExposicao = $derived(produtores.reduce((s: number, p: LinhaBalcao) => s + p.morrem, 0));
	let totalCarteira = $derived(produtores.reduce((s: number, p: LinhaBalcao) => s + p.morrem + p.sobrevivem, 0));

	let statusRelogio = $derived.by(() => {
		if (!analise) return 'neutro' as const;
		switch (analise.relogio.grau) {
			case 'FORMALIZANDO':
				return 'risco' as const;
			case 'ELEGIVEL_RJ':
				return 'alerta' as const;
			default:
				return 'ok' as const;
		}
	});
	let statusSafra = $derived.by(() =>
		!analise ? ('neutro' as const) : analise.safra.sinalRisco ? ('risco' as const) : ('ok' as const)
	);
	let statusCarteira = $derived.by(() => {
		if (!analise) return 'neutro' as const;
		return analise.stay.morrem.some((i) => i.destinoFinal === 'morre') ? ('alerta' as const) : ('ok' as const);
	});

	let posicoes = $derived(
		analise
			? (Object.entries(analise.perfil.posicaoPorInstrumento) as [Garantia, number][]).filter(
					([, v]) => v && v > 0
				)
			: []
	);

	let selecionadaLinha = $derived(
		produtorId != null ? produtores.find((p: LinhaBalcao) => p.id === produtorId) ?? null : null
	);

	async function irAoCorte() {
		filtro = 'TODOS';
		await tick();
		document.getElementById('linha-rebaixamento')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	onMount(() => {
		produtorId = produtores[0]?.id ?? null;
		avaliar();
	});
</script>

<!-- Header -->
<header class="sticky top-0 z-40 bg-white border-b border-slate-200">
	<div class="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-4">
		<!-- Brand & Logo -->
		<div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
			<div class="w-7 h-7 bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-xs font-mono">
				KF
			</div>
			<div class="min-w-0">
				<span class="block text-sm font-bold tracking-tight text-slate-900 leading-none truncate">
					KRILL<span class="text-emerald-700">SHIELD</span>
					<span class="text-xs font-normal text-slate-500 ml-2 font-mono hidden md:inline">Terminal de Risco de Crédito Agro</span>
				</span>
			</div>
		</div>

		<!-- Direct Action -->
		<div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
			{#if data.user}
				<span class="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
					<span class="i-lucide-user text-xs"></span>
					<span class="truncate max-w-[140px]">{data.user.email}</span>
				</span>
				<button
					onclick={sair}
					class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-medium transition cursor-pointer"
					title="Sair da conta"
				>
					<span class="i-lucide-log-out text-xs"></span>
					<span class="hidden sm:inline">Sair</span>
				</button>
			{/if}
			<a
				href="/admin"
				class="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors duration-150"
				title="Painel Financeiro Admin"
			>
				<span class="i-lucide-shield-alert text-xs text-rose-600"></span>
				<span class="hidden sm:inline">Painel Financeiro Admin</span>
				<span class="sm:hidden">Admin</span>
			</a>
			<button
				type="button"
				onclick={abrirCriar}
				class="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors duration-150 cursor-pointer"
				title="Cadastrar Nova Empresa"
			>
				<span class="i-lucide-plus text-xs"></span>
				<span class="hidden sm:inline">Nova Empresa</span>
				<span class="sm:hidden">Nova</span>
			</button>
		</div>
	</div>
</header>

<main class="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6">
	<!-- Title & Actions Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
		<div>
			<h1 class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
				Balcão de Decisão & Classificação de Carteira
			</h1>
			<p class="text-xs text-slate-600 mt-0.5">
				{produtores.length} empresas monitoradas sob as regras da Lei 11.101/2005 e Provimento CNJ 216/2026.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={semearDemo}
				class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors duration-150 cursor-pointer font-mono"
			>
				<span class="i-lucide-refresh-cw text-xs text-slate-500"></span>
				<span>Reiniciar Base (57)</span>
			</button>
		</div>
	</div>

	{#if erro}
		<div class="border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 font-mono">
			{erro}
		</div>
	{/if}

	<!-- Telemetry Ribbon (2x2 on mobile, 4-col on desktop) -->
	<section class="bg-slate-200 gap-px border border-slate-200 grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
		<!-- Carteira Total -->
		<button
			type="button"
			onclick={() => (filtro = 'TODOS')}
			class="bg-white text-left p-3 sm:p-4 transition-colors duration-150 cursor-pointer {filtro === 'TODOS'
				? 'bg-slate-50 ring-2 ring-inset ring-slate-900'
				: 'hover:bg-slate-50/60'}"
		>
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
					Carteira Total
				</span>
				<span class="text-[10px] font-mono text-slate-400">Geral</span>
			</div>
			<span class="block text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums font-mono">
				{produtores.length}
			</span>
			<span class="block text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate font-mono">
				Risco Stay: <strong class="text-slate-900">{formatarBRL(totalExposicao)}</strong>
			</span>
		</button>

		<!-- FIADO -->
		<button
			type="button"
			onclick={() => (filtro = 'FIADO')}
			class="bg-white text-left p-3 sm:p-4 transition-colors duration-150 cursor-pointer {filtro === 'FIADO'
				? 'bg-emerald-50/60 ring-2 ring-inset ring-emerald-600'
				: 'hover:bg-emerald-50/30'}"
		>
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
					NORMALIDADE
				</span>
				<span class="w-2 h-2 rounded-full bg-emerald-600"></span>
			</div>
			<span class="block text-xl sm:text-2xl font-black text-emerald-900 mt-1 tabular-nums font-mono">
				{resumo.FIADO}
			</span>
			<span class="block text-[11px] sm:text-xs text-emerald-700 mt-0.5 truncate">
				Fluxo padrão de balcão
			</span>
		</button>

		<!-- SÓ EXTRACONCURSAL -->
		<button
			type="button"
			onclick={() => (filtro = 'SÓ_EXTRACONCURSAL')}
			class="bg-white text-left p-3 sm:p-4 transition-colors duration-150 cursor-pointer {filtro === 'SÓ_EXTRACONCURSAL'
				? 'bg-amber-50/60 ring-2 ring-inset ring-amber-500'
				: 'hover:bg-amber-50/30'}"
		>
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold uppercase tracking-wider text-amber-900">
					SÓ EXTRACONCURSAL
				</span>
				<span class="w-2 h-2 rounded-full bg-amber-500"></span>
			</div>
			<span class="block text-xl sm:text-2xl font-black text-amber-950 mt-1 tabular-nums font-mono">
				{resumo['SÓ_EXTRACONCURSAL']}
			</span>
			<span class="block text-[11px] sm:text-xs text-amber-800 mt-0.5 truncate">
				Recuperáveis com garantia
			</span>
		</button>

		<!-- À VISTA -->
		<button
			type="button"
			onclick={() => (filtro = 'À_VISTA')}
			class="bg-white text-left p-3 sm:p-4 transition-colors duration-150 cursor-pointer {filtro === 'À_VISTA'
				? 'bg-rose-50/60 ring-2 ring-inset ring-rose-600'
				: 'hover:bg-rose-50/30'}"
		>
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold uppercase tracking-wider text-rose-900">
					ZONA REBAIXADA
				</span>
				<span class="w-2 h-2 rounded-full bg-rose-600"></span>
			</div>
			<span class="block text-xl sm:text-2xl font-black text-rose-950 mt-1 tabular-nums font-mono">
				{resumo['À_VISTA']}
			</span>
			<span class="block text-[11px] sm:text-xs text-rose-800 mt-0.5 truncate">
				Cobrança imediata D+0
			</span>
		</button>
	</section>

	<ZonaRebaixamento
		{classificacao}
		{filtro}
		onFiltrar={(f) => (filtro = f)}
		onIrAoCorte={irAoCorte}
	/>

	<!-- Table of Producers -->
	<section class="bg-white border border-slate-200 overflow-hidden">
		<div class="px-3 sm:px-5 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50">
			<div class="flex items-center gap-2">
				<span class="i-lucide-list-ordered text-slate-500 text-sm"></span>
				<h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Classificação da Carteira</h3>
			</div>
			<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
				<div class="relative w-full sm:w-64">
					<span class="absolute left-2.5 top-1/2 -translate-y-1/2 i-lucide-search text-xs text-slate-400"></span>
					<input
						type="text"
						bind:value={busca}
						placeholder="Buscar empresa ou CNPJ..."
						class="w-full pl-8 pr-3 py-1.5 sm:py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500"
					/>
				</div>
				<div class="flex items-center justify-between sm:justify-start gap-2">
					<span class="text-[11px] sm:text-xs font-mono text-slate-500 shrink-0">
						Exibindo <strong class="text-slate-900">{filtrados.length}</strong> de {produtores.length}
						{#if classificacao.posicaoCorte != null && filtro === 'TODOS'}
							<span class="text-rose-700 font-bold"> · corte no {classificacao.posicaoCorte}º</span>
						{/if}
					</span>
					<span class="text-[10px] text-slate-400 font-mono sm:hidden">
						← deslize →
					</span>
				</div>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-xs min-w-[560px]">
				<thead>
					<tr class="text-left text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 bg-slate-50">
						<th class="pl-4 pr-1 py-2.5 font-mono w-10">#</th>
						<th class="px-3 py-2.5">Razão Social</th>
						<th class="px-4 py-2.5 hidden sm:table-cell font-mono">CNPJ / CPF</th>
						<th class="px-4 py-2.5">Estado do Cartaz</th>
						<th class="px-4 py-2.5 text-right font-mono">R$ no Stay</th>
						<th class="px-4 py-2.5 text-right hidden md:table-cell font-mono">R$ Blindado</th>
						<th class="px-6 py-2.5 text-right">Ações</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filtrados as p, i}
						{#if i === indiceCorteFiltrado && indiceCorteFiltrado >= 0}
							<tr id="linha-rebaixamento" class="bg-rose-900 text-white font-mono">
								<td colspan="7" class="px-4 py-2 text-[11px] font-bold">
									<div class="flex items-center gap-2">
										<span class="i-lucide-scissors text-xs"></span>
										<span>ZONA DE REBAIXAMENTO — daqui para baixo não vale ir atrás. Foque nos que ainda dá para salvar.</span>
									</div>
								</td>
							</tr>
						{/if}
						{@const selecionado = produtorId === p.id}
						<tr
							onclick={() => selecionar(p)}
							class="cursor-pointer transition-colors duration-100 {selecionado
								? 'bg-slate-100 font-medium'
								: p.zona === 'REBAIXAMENTO'
									? 'bg-rose-50/30 hover:bg-rose-50/60'
									: p.ultimoASalvar
										? 'bg-amber-50/40 hover:bg-amber-50/70'
										: 'hover:bg-slate-50'}"
						>
							<td class="pl-4 pr-1 py-2.5 font-mono font-bold text-slate-700">
								{p.posicao}
							</td>
							<td class="px-3 py-2.5">
								<span class="block font-bold text-slate-900 max-w-64 truncate">{p.nome}</span>
								<div class="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500">
									<span>{Math.round(p.taxaBlindagem * 100)}% blindado</span>
									{#if p.ultimoASalvar}
										<span class="font-bold text-amber-800 uppercase">· último recuperável</span>
									{/if}
									{#if p.primeiroRebaixado}
										<span class="font-bold text-rose-800 uppercase">· 1º rebaixado</span>
									{/if}
								</div>
								<span class="text-[10px] text-slate-500 sm:hidden font-mono">{p.cnpjCpf}</span>
							</td>
							<td class="px-4 py-2.5 font-mono text-slate-600 hidden sm:table-cell">{p.cnpjCpf}</td>
							<td class="px-4 py-2.5">
								<span class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-mono border {badgeClasse(p.estado)}">
									{p.instrumento && p.estado === 'SÓ_EXTRACONCURSAL' ? p.instrumento : ESTADOS_CARTAZ[p.estado].rotulo}
								</span>
							</td>
							<td class="px-4 py-2.5 text-right font-bold tabular-nums font-mono {p.morrem > 0 ? 'text-rose-700' : 'text-slate-400'}">
								{formatarBRL(p.morrem)}
							</td>
							<td class="px-4 py-2.5 text-right font-bold tabular-nums font-mono {p.sobrevivem > 0 ? 'text-emerald-700' : 'text-slate-400'} hidden md:table-cell">
								{formatarBRL(p.sobrevivem)}
							</td>
							<td class="px-6 py-2.5 text-right">
								<div class="inline-flex items-center gap-1">
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											abrirModalPosicao(p);
										}}
										class="px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors duration-150 cursor-pointer flex items-center gap-1"
										title="Ver modal de posição desta empresa"
									>
										<span class="i-lucide-shield text-xs text-emerald-600"></span>
										<span>Posição</span>
									</button>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											abrirEditar(p.id);
										}}
										class="px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
									>
										Editar
									</button>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											excluir(p);
										}}
										class="px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors duration-150 cursor-pointer"
									>
										Excluir
									</button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtrados.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-8 text-center text-slate-500 text-xs">
								Nenhuma empresa cadastrada neste estado de cartaz.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Deep Analysis Section for the Selected Producer -->
	{#if selecionadaLinha}
		<section id="secao-dossie" class="space-y-4">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 pb-2 border-b border-slate-200">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
						Prancha de Análise · {selecionadaLinha.nome}
					</h2>
					<span class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold font-mono border {badgeClasse(selecionadaLinha.estado as EstadoCartaz)}">
						{ESTADOS_CARTAZ[selecionadaLinha.estado as EstadoCartaz].rotulo}
					</span>
				</div>
				<span class="text-[11px] sm:text-xs text-slate-600 font-mono">
					CNPJ: {selecionadaLinha.cnpjCpf}
				</span>
			</div>

			{#if carregando && !analise}
				<div class="flex items-center justify-center py-16 bg-white border border-slate-200">
					<div class="flex items-center gap-2 text-slate-600 font-mono text-xs">
						<span class="i-lucide-loader-2 text-slate-900 text-base animate-spin"></span>
						<span>Processando regras determinísticas...</span>
					</div>
				</div>
			{:else if analise}
				<div class="relative space-y-4">
					{#if carregando}
						<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs">
							<div class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 text-xs font-mono text-slate-800">
								<span class="i-lucide-loader-2 text-slate-900 text-sm animate-spin"></span>
								<span>Reavaliando parâmetros...</span>
							</div>
						</div>
					{/if}

					<!-- Asymmetric 2-Column Inspection Grid -->
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
						<!-- Left Column (8 cols): Poster, Telemetry Cluster, and Rex Control -->
						<div class="lg:col-span-8 space-y-4">
							<!-- Decision Poster -->
							<PosterDeDecisao decisao={analise.decisao} />

							<!-- Diagnostic Telemetry Cluster -->
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<RegraCard
									titulo="Relógio 216"
									icone="i-lucide-clock-3"
									status={statusRelogio}
									resumo={`Grau ${analise.relogio.grau} · ${analise.relogio.tempoFormalizacaoMeses}m Junta`}
									detalhe={analise.relogio.motivo}
								/>
								<RegraCard
									titulo="Safra vs CPR"
									icone="i-lucide-sprout"
									status={statusSafra}
									resumo={`Capacidade ${analise.safra.capacidadePeso} sc vs ${analise.perfil.volumeComprometidoCPR} sc`}
									detalhe={analise.safra.motivo}
								/>
								<RegraCard
									titulo="Carteira Krill"
									icone="i-lucide-briefcase"
									status={statusCarteira}
									resumo={`${posicoes.length} instrumento(s) vigentes`}
									detalhe="Destino no stay determinado pela garantia real e capacidade de safra."
								/>
							</div>

							<!-- Rex Flip Simulation Control -->
							{#if basePerfil}
								<RexControl perfilBase={basePerfil} flipAtivo={flipAtivo} onToggle={toggleFlip} />
							{/if}
						</div>

						<!-- Right Column (4 cols): Stay Visor, Trilha de Degraus & Position Breakdown -->
						<div class="lg:col-span-4 space-y-4">
							<StayVisor stay={analise.stay} />

							{#if analise.degraus && analise.degraus.length > 0}
								<TrilhaDeDegraus degraus={analise.degraus} />
							{/if}

							<!-- Posições por Instrumento Details Card -->
							<div class="bg-white border border-slate-200 p-4 space-y-3">
								<div class="flex items-center justify-between pb-2 border-b border-slate-200">
									<div>
										<h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">
											Posição por Instrumento
										</h4>
										<span class="text-[10px] text-slate-500">Títulos registrados para este produtor</span>
									</div>
									<span class="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
										{posicoes.length} item(s)
									</span>
								</div>

								<div class="space-y-1.5">
									{#each posicoes as [g, v]}
										<div class="flex items-center justify-between gap-2 text-xs p-2 bg-slate-50 border border-slate-200">
											<div class="min-w-0">
												<span class="block font-bold text-slate-800 truncate">{GARANTIAS[g].rotulo}</span>
												<span class="text-[10px] text-slate-500">{GARANTIAS[g].categoria}</span>
											</div>
											<span class="font-bold text-slate-900 tabular-nums font-mono shrink-0">
												{formatarBRL(v)}
											</span>
										</div>
									{/each}
									{#if posicoes.length === 0}
										<div class="text-xs text-slate-500 italic py-2 text-center font-mono">
											Nenhum instrumento financeiro cadastrado.
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Espelho Technical Document Sheet -->
		<section>
			<Espelho
				analise={analise}
				texto={analise?.textoEspelho ?? ''}
				iaResposta={analise?.iaResposta}
				provedor={provedor}
				carregando={espelhoCarregando}
				onRegredigir={redigirComAtendente}
			/>
		</section>
	{/if}

	{#if !analise && !carregando && totalCarteira > 0}
		<div class="text-center text-slate-500 text-xs py-8 font-mono">
			Selecione uma empresa na carteira acima para visualizar a prancha de decisão.
		</div>
	{/if}
</main>

<!-- Minimalist Corporate Footer -->
<footer class="mt-auto border-t border-slate-200 bg-white py-4 text-[11px] text-slate-500 font-mono">
	<div class="max-w-7xl mx-auto px-3 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
		<span>KrillShield · Krill Tech · Inteligência e Risco de Crédito no Agro</span>
		<span>Regras determinísticas sobre bases oficiais (DataJud, SICAR, ZARC, Junta Comercial)</span>
	</div>
</footer>

<!-- Modal Form -->
{#if form}
	<ProducerForm
		produtor={form.modo === 'editar' ? form.produtor : null}
		onClose={() => (form = null)}
		onSaved={salvo}
	/>
{/if}

<!-- Modal de Posição do Produtor Cadastrado / Selecionado -->
{#if analiseModalPosicao}
	<ModalPosicaoProdutor
		analise={analiseModalPosicao}
		onClose={() => (analiseModalPosicao = null)}
		onVerDossie={verDossieCompleto}
		onNovoCadastro={abrirCriar}
	/>
{/if}