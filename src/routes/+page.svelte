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

	function obterIniciais(nome: string) {
		const partes = nome.trim().split(/\s+/).filter(Boolean);
		if (partes.length === 0) return 'KS';
		if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
		return (partes[0][0] + partes[1][0]).toUpperCase();
	}

	let exportandoLaudoBanner = $state(false);

	async function exportarLaudoPDF() {
		if (!analise || exportandoLaudoBanner) return;
		exportandoLaudoBanner = true;
		try {
			const { exportarLaudoIndividualPDF } = await import('$lib/krillshield/exportPdf');
			exportarLaudoIndividualPDF({
				nome: analise.perfil.nome,
				cnpjCpf: analise.perfil.cnpjCpf,
				estado: analise.decisao.estado,
				data: new Date().toLocaleDateString('pt-BR'),
				texto: analise.iaResposta?.laudoFormatado || analise.textoEspelho || ''
			});
		} catch (e) {
			console.error('Falha ao exportar laudo em PDF', e);
		} finally {
			exportandoLaudoBanner = false;
		}
	}

	let classificacao = $derived(classificarCarteira(produtores));

	let linhaRankingModal = $derived.by(() => {
		const m = analiseModalPosicao;
		if (!m) return null;
		return classificacao.ranking.find((r) => r.id === m.perfil.id) ?? null;
	});

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
	let totalBlindado = $derived(produtores.reduce((s: number, p: LinhaBalcao) => s + p.sobrevivem, 0));
	let taxaBlindagemCarteira = $derived(
		totalCarteira > 0 ? Math.round((totalBlindado / totalCarteira) * 100) : 0
	);

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
<header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
	<div class="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-15 flex items-center justify-between gap-2 sm:gap-3">
		<!-- Brand & Logo -->
		<div class="flex items-center gap-2 sm:gap-3 min-w-0">
			<div class="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
				<span class="i-lucide-shield-check text-base sm:text-lg"></span>
			</div>
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<span class="text-sm font-black tracking-tight text-slate-900 leading-none truncate">
						KRILL<span class="text-emerald-600">SHIELD</span>
					</span>
					<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
						Terminal Agro v2.0
					</span>
				</div>
				<span class="text-[11px] text-slate-400 font-medium hidden md:block mt-0.5 truncate">
					Terminal de Risco Concursal & Crédito no Agronegócio
				</span>
			</div>
		</div>

		<!-- Direct Actions & System Status -->
		<div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
			<!-- Live DataJud / ZARC badge -->
			<div class="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600">
				<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span>DataJud / ZARC Online · D+0</span>
			</div>

			{#if data.user}
				<div class="hidden md:flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-mono text-slate-700">
					<div class="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
						{data.user.nome ? data.user.nome[0].toUpperCase() : 'U'}
					</div>
					<span class="truncate max-w-[130px] font-semibold">{data.user.email}</span>
				</div>
				<button
					onclick={sair}
					class="inline-flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
					title="Sair da conta"
					aria-label="Sair da conta"
				>
					<span class="i-lucide-log-out text-xs"></span>
					<span class="hidden sm:inline">Sair</span>
				</button>
			{/if}

			<a
				href="/admin"
				class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
				title="Painel Financeiro e Dossiê Admin"
			>
				<span class="i-lucide-shield-alert text-xs text-rose-600"></span>
				<span class="hidden sm:inline">Painel Admin</span>
				<span class="sm:hidden">Admin</span>
			</a>

			<button
				type="button"
				onclick={abrirCriar}
				class="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
				title="Cadastrar Nova Empresa na Carteira"
			>
				<span class="i-lucide-plus text-xs text-emerald-400"></span>
				<span class="hidden sm:inline">Nova Empresa</span>
				<span class="sm:hidden">Nova</span>
			</button>
		</div>
	</div>
</header>

<main class="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6 w-full min-w-0">
	<!-- Title & Actions Bar -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200/80">
		<div>
			<div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
				<h1 class="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
					Balcão de Decisão & Classificação de Carteira
				</h1>
				<span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700">
					LREF 11.101/05 & CNJ 216/26
				</span>
			</div>
			<p class="text-xs text-slate-500 max-w-2xl leading-relaxed">
				Motor determinístico para {produtores.length} empresas monitoradas. Avaliação de blindagem contra o Stay Period de 180 dias e capacidade produtiva ZARC.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2 self-start md:self-auto">
			<button
				type="button"
				onclick={semearDemo}
				class="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer font-mono shadow-2xs"
				title="Restaurar base canônica com as 57 empresas de referência"
			>
				<span class="i-lucide-refresh-cw text-xs text-slate-500"></span>
				<span>Reiniciar Base (57)</span>
			</button>
		</div>
	</div>

	{#if erro}
		<div class="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 font-mono flex items-center gap-2 shadow-2xs">
			<span class="i-lucide-alert-octagon text-rose-600 text-base shrink-0"></span>
			<span>{erro}</span>
		</div>
	{/if}

	<!-- Telemetry Ribbon (4 KPI Cards) -->
	<section class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
		<!-- Carteira Total -->
		<button
			type="button"
			onclick={() => (filtro = 'TODOS')}
			class="bg-white rounded-2xl p-3.5 sm:p-5 border transition-all duration-150 cursor-pointer text-left shadow-xs flex flex-col justify-between {filtro === 'TODOS'
				? 'border-slate-900 ring-2 ring-slate-900/10 shadow-sm bg-slate-50/50'
				: 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40'}"
		>
			<div class="flex items-center justify-between gap-1">
				<span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
					Carteira Total
				</span>
				<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold {filtro === 'TODOS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}">
					Geral
				</span>
			</div>
			<div class="my-1.5 sm:my-2">
				<span class="block text-xl sm:text-3xl font-black text-slate-900 tabular-nums font-mono">
					{produtores.length}
				</span>
				<span class="text-[10px] sm:text-[11px] text-slate-500 font-medium">empresas monitoradas</span>
			</div>
			<div class="pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-600 font-mono flex flex-col xs:flex-row xs:items-center justify-between gap-0.5 sm:gap-1">
				<span class="text-slate-500">Risco Stay:</span>
				<strong class="text-slate-900 font-bold truncate">{formatarBRL(totalExposicao)}</strong>
			</div>
		</button>

		<!-- FIADO (Normalidade) -->
		<button
			type="button"
			onclick={() => (filtro = 'FIADO')}
			class="bg-white rounded-2xl p-3.5 sm:p-5 border transition-all duration-150 cursor-pointer text-left shadow-xs flex flex-col justify-between {filtro === 'FIADO'
				? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/40'
				: 'border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20'}"
		>
			<div class="flex items-center justify-between gap-1">
				<span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
					NORMALIDADE
				</span>
				<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
			</div>
			<div class="my-1.5 sm:my-2">
				<span class="block text-xl sm:text-3xl font-black text-emerald-900 tabular-nums font-mono">
					{resumo.FIADO}
				</span>
				<span class="text-[10px] sm:text-[11px] text-emerald-700 font-medium">
					{produtores.length > 0 ? Math.round((resumo.FIADO / produtores.length) * 100) : 0}% da carteira
				</span>
			</div>
			<div class="pt-2 border-t border-emerald-100 text-[10px] sm:text-[11px] text-emerald-800 flex flex-col xs:flex-row xs:items-center justify-between gap-0.5 sm:gap-1">
				<span class="text-emerald-700">Fluxo balcão:</span>
				<strong class="font-bold">Crédito Limpo</strong>
			</div>
		</button>

		<!-- SÓ EXTRACONCURSAL -->
		<button
			type="button"
			onclick={() => (filtro = 'SÓ_EXTRACONCURSAL')}
			class="bg-white rounded-2xl p-3.5 sm:p-5 border transition-all duration-150 cursor-pointer text-left shadow-xs flex flex-col justify-between {filtro === 'SÓ_EXTRACONCURSAL'
				? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-amber-50/40'
				: 'border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20'}"
		>
			<div class="flex items-center justify-between gap-1">
				<span class="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-mono truncate">
					EXTRACONCURSAL
				</span>
				<span class="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 shrink-0"></span>
			</div>
			<div class="my-1.5 sm:my-2">
				<span class="block text-xl sm:text-3xl font-black text-amber-950 tabular-nums font-mono">
					{resumo['SÓ_EXTRACONCURSAL']}
				</span>
				<span class="text-[10px] sm:text-[11px] text-amber-800 font-medium">
					{produtores.length > 0 ? Math.round((resumo['SÓ_EXTRACONCURSAL'] / produtores.length) * 100) : 0}% recuperáveis
				</span>
			</div>
			<div class="pt-2 border-t border-amber-100 text-[10px] sm:text-[11px] text-amber-900 flex flex-col xs:flex-row xs:items-center justify-between gap-0.5 sm:gap-1">
				<span class="text-amber-800">Condição:</span>
				<strong class="font-bold">Garantia Real</strong>
			</div>
		</button>

		<!-- À VISTA (Zona Rebaixada) -->
		<button
			type="button"
			onclick={() => (filtro = 'À_VISTA')}
			class="bg-white rounded-2xl p-3.5 sm:p-5 border transition-all duration-150 cursor-pointer text-left shadow-xs flex flex-col justify-between {filtro === 'À_VISTA'
				? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/40'
				: 'border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/20'}"
		>
			<div class="flex items-center justify-between gap-1">
				<span class="text-[10px] font-bold uppercase tracking-wider text-rose-900 font-mono truncate">
					ZONA REBAIXADA
				</span>
				<span class="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shrink-0"></span>
			</div>
			<div class="my-1.5 sm:my-2">
				<span class="block text-xl sm:text-3xl font-black text-rose-950 tabular-nums font-mono">
					{resumo['À_VISTA']}
				</span>
				<span class="text-[10px] sm:text-[11px] text-rose-800 font-medium">
					{produtores.length > 0 ? Math.round((resumo['À_VISTA'] / produtores.length) * 100) : 0}% em risco crítico
				</span>
			</div>
			<div class="pt-2 border-t border-rose-100 text-[10px] sm:text-[11px] text-rose-900 flex flex-col xs:flex-row xs:items-center justify-between gap-0.5 sm:gap-1">
				<span class="text-rose-800">Condição:</span>
				<strong class="font-bold">Cobrança D+0</strong>
			</div>
		</button>
	</section>

	<!-- Zona de Rebaixamento Component -->
	<ZonaRebaixamento
		{classificacao}
		{filtro}
		onFiltrar={(f) => (filtro = f)}
		onIrAoCorte={irAoCorte}
	/>

	<!-- Table of Producers -->
	<section class="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs w-full min-w-0">
		<!-- Header Controls -->
		<div class="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50">
			<div class="flex items-center gap-2.5">
				<div class="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
					<span class="i-lucide-list-ordered text-sm"></span>
				</div>
				<div>
					<h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">
						Classificação da Carteira por Nível de Risco
					</h3>
					<span class="text-[11px] text-slate-500">Ordenação por taxa de blindagem e exposição concorrencial</span>
				</div>
			</div>

			<!-- Search & Filter Controls -->
			<div class="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
				<!-- Search Field with Clear Button -->
				<div class="relative w-full sm:w-72">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 i-lucide-search text-xs text-slate-400"></span>
					<input
						type="text"
						bind:value={busca}
						placeholder="Buscar empresa ou CNPJ..."
						class="w-full pl-8 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all font-sans"
					/>
					{#if busca}
						<button
							type="button"
							onclick={() => (busca = '')}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer"
							title="Limpar busca"
						>
							<span class="i-lucide-x"></span>
						</button>
					{/if}
				</div>

				<!-- Filter Chips -->
				<div class="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full pb-1 [-webkit-overflow-scrolling:touch]">
					<button
						type="button"
						onclick={() => (filtro = 'TODOS')}
						class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 font-mono {filtro === 'TODOS' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
					>
						Todos ({produtores.length})
					</button>
					<button
						type="button"
						onclick={() => (filtro = 'FIADO')}
						class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 font-mono {filtro === 'FIADO' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}"
					>
						Fiado ({resumo.FIADO})
					</button>
					<button
						type="button"
						onclick={() => (filtro = 'SÓ_EXTRACONCURSAL')}
						class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 font-mono {filtro === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}"
					>
						Extraconcursal ({resumo['SÓ_EXTRACONCURSAL']})
					</button>
					<button
						type="button"
						onclick={() => (filtro = 'À_VISTA')}
						class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 font-mono {filtro === 'À_VISTA' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-50 text-rose-900 hover:bg-rose-100'}"
					>
						À Vista ({resumo['À_VISTA']})
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile Table Swipe Hint -->
		<div class="sm:hidden px-4 py-1.5 bg-slate-50/90 text-[10px] text-slate-500 font-mono flex items-center justify-between border-b border-slate-100">
			<span class="flex items-center gap-1 text-slate-600">
				<span class="i-lucide-arrow-left-right text-xs text-slate-400"></span>
				Deslize a tabela para ver ações →
			</span>
			<span class="font-bold">{filtrados.length} itens</span>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
			<table class="w-full text-xs min-w-[580px]">
				<thead>
					<tr class="text-left text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 bg-slate-50/70 font-mono">
						<th class="pl-4 pr-1 py-3 w-12 text-center">#</th>
						<th class="px-4 py-3">Razão Social / Empresa</th>
						<th class="px-4 py-3 hidden sm:table-cell">CNPJ / CPF</th>
						<th class="px-4 py-3">Estado do Cartaz</th>
						<th class="px-4 py-3 text-right">R$ no Stay</th>
						<th class="px-4 py-3 text-right hidden md:table-cell">R$ Blindado</th>
						<th class="px-5 py-3 text-right">Ações</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filtrados as p, i}
						{#if i === indiceCorteFiltrado && indiceCorteFiltrado >= 0}
							<tr id="linha-rebaixamento" class="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white font-mono shadow-inner">
								<td colspan="7" class="px-5 py-3 text-xs font-bold">
									<div class="flex items-center gap-2.5">
										<div class="w-6 h-6 rounded-lg bg-rose-800 flex items-center justify-center shrink-0">
											<span class="i-lucide-scissors text-sm text-rose-200"></span>
										</div>
										<span class="tracking-wide">
											LINHA DE CORTE DA CARTEIRA ({classificacao.posicaoCorte}º lugar) — Daqui para baixo, risco concursal inviabiliza crédito a prazo. Exija liquidação D+0.
										</span>
									</div>
								</td>
							</tr>
						{/if}
						{@const selecionado = produtorId === p.id}
						<tr
							onclick={() => selecionar(p)}
							class="cursor-pointer transition-all duration-100 {selecionado
								? 'bg-slate-100/90 font-semibold border-l-4 border-slate-900 shadow-2xs'
								: p.zona === 'REBAIXAMENTO'
									? 'bg-rose-50/25 hover:bg-rose-50/50'
									: p.ultimoASalvar
										? 'bg-amber-50/30 hover:bg-amber-50/60'
										: 'hover:bg-slate-50/80'}"
						>
							<td class="pl-4 pr-1 py-3 font-mono font-bold text-center {selecionado ? 'text-slate-950' : 'text-slate-500'}">
								#{p.posicao}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-2.5">
									<div class="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-mono font-black text-[10px] shrink-0">
										{obterIniciais(p.nome)}
									</div>
									<div class="min-w-0">
										<span class="block font-bold text-slate-900 max-w-72 truncate leading-tight">{p.nome}</span>
										<div class="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-500">
											<span class="font-semibold text-emerald-700">{Math.round(p.taxaBlindagem * 100)}% blindado</span>
											{#if p.ultimoASalvar}
												<span class="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded uppercase">último recuperável</span>
											{/if}
											{#if p.primeiroRebaixado}
												<span class="font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded uppercase">1º rebaixado</span>
											{/if}
										</div>
										<span class="text-[10px] text-slate-500 sm:hidden font-mono block mt-0.5">{p.cnpjCpf}</span>
									</div>
								</div>
							</td>
							<td class="px-4 py-3 font-mono text-slate-600 hidden sm:table-cell text-xs">{p.cnpjCpf}</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold font-mono rounded-full border {badgeClasse(p.estado)}">
									<span class="w-1.5 h-1.5 rounded-full {p.estado === 'FIADO' ? 'bg-emerald-500' : p.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-500' : 'bg-rose-500'}"></span>
									{p.instrumento && p.estado === 'SÓ_EXTRACONCURSAL' ? p.instrumento : ESTADOS_CARTAZ[p.estado].rotulo}
								</span>
							</td>
							<td class="px-4 py-3 text-right font-bold tabular-nums font-mono {p.morrem > 0 ? 'text-rose-700' : 'text-slate-400'}">
								{formatarBRL(p.morrem)}
							</td>
							<td class="px-4 py-3 text-right font-bold tabular-nums font-mono {p.sobrevivem > 0 ? 'text-emerald-700' : 'text-slate-400'} hidden md:table-cell">
								{formatarBRL(p.sobrevivem)}
							</td>
							<td class="px-5 py-3 text-right">
								<div class="inline-flex items-center gap-1.5">
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											abrirModalPosicao(p);
										}}
										class="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors duration-150 cursor-pointer flex items-center gap-1"
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
										class="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
										title="Editar parâmetros cadastrais"
									>
										Editar
									</button>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											excluir(p);
										}}
										class="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors duration-150 cursor-pointer"
										title="Excluir da carteira"
									>
										<span class="i-lucide-trash-2 text-xs"></span>
									</button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtrados.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center text-slate-500 text-xs font-mono">
								<div class="flex flex-col items-center justify-center gap-2">
									<span class="i-lucide-search-x text-2xl text-slate-400"></span>
									<span>Nenhuma empresa encontrada com os filtros atuais.</span>
									<button
										type="button"
										onclick={() => {
											filtro = 'TODOS';
											busca = '';
										}}
										class="mt-1 text-xs font-bold text-slate-900 underline cursor-pointer"
									>
										Limpar filtros de busca
									</button>
								</div>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Deep Analysis Section for the Selected Producer -->
	{#if selecionadaLinha}
		<section id="secao-dossie" class="space-y-4 pt-2">
			<!-- Dossier Banner Header -->
			<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
				<div class="flex items-center gap-3 min-w-0">
					<div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-xs">
						{obterIniciais(selecionadaLinha.nome)}
					</div>
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
								Prancha de Análise · {selecionadaLinha.nome}
							</h2>
							<span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold font-mono rounded-full border {badgeClasse(selecionadaLinha.estado as EstadoCartaz)}">
								<span class="w-1.5 h-1.5 rounded-full {selecionadaLinha.estado === 'FIADO' ? 'bg-emerald-500' : selecionadaLinha.estado === 'SÓ_EXTRACONCURSAL' ? 'bg-amber-500' : 'bg-rose-500'}"></span>
								{ESTADOS_CARTAZ[selecionadaLinha.estado as EstadoCartaz].rotulo}
							</span>
						</div>
						<div class="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
							<span>CNPJ: <strong class="text-slate-800">{selecionadaLinha.cnpjCpf}</strong></span>
							<span>·</span>
							<span>Posição: <strong class="text-slate-800">#{selecionadaLinha.id}</strong> na esteira</span>
						</div>
					</div>
				</div>

				<!-- Quick Actions on Selected Company Banner -->
				<div class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
					<button
						type="button"
						onclick={exportarLaudoPDF}
						disabled={exportandoLaudoBanner || !analise}
						class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50 shadow-2xs w-full sm:w-auto text-center"
						title="Exportar Parecer Técnico Desta Empresa em PDF"
					>
						{#if exportandoLaudoBanner}
							<span class="i-lucide-loader-2 text-xs animate-spin"></span>
							<span>Gerando...</span>
						{:else}
							<span class="i-lucide-file-down text-xs text-rose-600"></span>
							<span>Laudo PDF</span>
						{/if}
					</button>

					<button
						type="button"
						onclick={() => abrirModalPosicao(selecionadaLinha)}
						class="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-all cursor-pointer shadow-2xs w-full sm:w-auto text-center"
						title="Ver Modal de Posição Detalhada"
					>
						<span class="i-lucide-shield text-xs text-emerald-600"></span>
						<span>Ver Posição</span>
					</button>
				</div>
			</div>

			{#if carregando && !analise}
				<div class="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs">
					<div class="flex items-center gap-3 text-slate-600 font-mono text-xs">
						<span class="i-lucide-loader-2 text-slate-900 text-lg animate-spin"></span>
						<span>Processando regras determinísticas sob a Lei 11.101/05...</span>
					</div>
				</div>
			{:else if analise}
				<div class="relative space-y-4 w-full min-w-0">
					{#if carregando}
						<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-xs rounded-2xl">
							<div class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 shadow-md">
								<span class="i-lucide-loader-2 text-slate-900 text-sm animate-spin"></span>
								<span>Reavaliando parâmetros...</span>
							</div>
						</div>
					{/if}

					<!-- Asymmetric 2-Column Inspection Grid -->
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full min-w-0">
						<!-- Left Column (8 cols): Poster, Telemetry Cluster, and Rex Control -->
						<div class="lg:col-span-8 space-y-4 w-full min-w-0">
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
						<div class="lg:col-span-4 space-y-4 w-full min-w-0">
							<StayVisor stay={analise.stay} />

							{#if analise.degraus && analise.degraus.length > 0}
								<TrilhaDeDegraus degraus={analise.degraus} />
							{/if}

							<!-- Posições por Instrumento Details Card -->
							<div class="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
								<div class="flex items-center justify-between pb-2.5 border-b border-slate-100">
									<div>
										<h4 class="text-xs font-bold uppercase tracking-wider text-slate-900">
											Posição por Instrumento
										</h4>
										<span class="text-[10px] text-slate-400">Títulos registrados para este produtor</span>
									</div>
									<span class="text-[10px] font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
										{posicoes.length} item(s)
									</span>
								</div>

								<div class="space-y-2">
									{#each posicoes as [g, v]}
										<div class="flex items-center justify-between gap-2 text-xs p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
											<div class="min-w-0">
												<span class="block font-bold text-slate-800 truncate">{GARANTIAS[g].rotulo}</span>
												<span class="text-[10px] text-slate-400">{GARANTIAS[g].categoria}</span>
											</div>
											<span class="font-bold text-slate-900 tabular-nums font-mono shrink-0 text-xs">
												{formatarBRL(v)}
											</span>
										</div>
									{/each}
									{#if posicoes.length === 0}
										<div class="text-xs text-slate-400 italic py-3 text-center font-mono">
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
		<div class="text-center text-slate-500 text-xs py-12 font-mono bg-white border border-slate-200/80 rounded-2xl shadow-xs">
			<span class="i-lucide-mouse-pointer-click text-xl text-slate-400 block mb-1"></span>
			Selecione uma empresa na carteira acima para visualizar a prancha de decisão.
		</div>
	{/if}
</main>

<!-- Minimalist Corporate Footer -->
<footer class="mt-auto border-t border-slate-200 bg-white py-5 text-xs text-slate-500 font-mono">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
		<div class="flex items-center gap-2">
			<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
			<span class="font-bold text-slate-700">KrillShield v2.0</span>
			<span>· Krill Tech · Inteligência e Risco de Crédito no Agro</span>
		</div>
		<span class="text-[11px] text-slate-400">
			Regras determinísticas sobre bases oficiais (DataJud, SICAR, ZARC, Junta Comercial)
		</span>
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
		ranking={linhaRankingModal}
		totalCarteira={classificacao.ranking.length}
		posicaoCorte={classificacao.posicaoCorte}
		onClose={() => (analiseModalPosicao = null)}
		onVerDossie={verDossieCompleto}
		onNovoCadastro={abrirCriar}
	/>
{/if}