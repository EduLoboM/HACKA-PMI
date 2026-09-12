<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type {
		AnaliseKrillShield,
		PerfilProdutor,
		Garantia,
		EstadoCartaz
	} from '$lib/krillshield/types';
	import { GARANTIAS, ESTADOS_CARTAZ, formatarBRL } from '$lib/krillshield/types';
	import PosterDeDecisao from '$lib/components/PosterDeDecisao.svelte';
	import StayVisor from '$lib/components/StayVisor.svelte';
	import RegraCard from '$lib/components/RegraCard.svelte';
	import Espelho216 from '$lib/components/Espelho216.svelte';
	import RexControl from '$lib/components/RexControl.svelte';
	import ProducerForm from '$lib/components/ProducerForm.svelte';

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

	let produtores = $state<LinhaBalcao[]>([]);
	let resumo = $state<Record<EstadoCartaz, number>>({ FIADO: 0, 'SÓ_EXTRACONCURSAL': 0, 'À_VISTA': 0 });
	let produtorId = $state<number | null>(null);
	let analise = $state<AnaliseKrillShield | null>(null);
	let basePerfil = $state<PerfilProdutor | null>(null);
	let carregando = $state(false);
	let espelhoCarregando = $state(false);
	let flipAtivo = $state(false);
	let erro = $state('');
	let provedor = $state('atendente-modelo · determinístico');
	let filtro = $state<'TODOS' | EstadoCartaz>('TODOS');

	type FormEstado =
		| { modo: 'criar' }
		| { modo: 'editar'; produtor: PerfilProdutor }
		| null;
	let form = $state<FormEstado>(null);

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
			if (r.texto && analise) {
				analise = { ...analise, textoEspelho: r.texto };
				provedor = r.provedor === 'gemini-free' ? 'gemini-free · Atendente LLM' : 'atendente-modelo · determinístico';
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
		avaliar();
	}

	function badgeClasse(estado: EstadoCartaz) {
		const m = ESTADOS_CARTAZ[estado];
		return `${m.bg} ${m.borda} ${m.texto}`;
	}

	let filtrados = $derived(
		filtro === 'TODOS' ? produtores : produtores.filter((p) => p.estado === filtro)
	);

	let totalExposicao = $derived(produtores.reduce((s, p) => s + p.morrem, 0));
	let totalCarteira = $derived(produtores.reduce((s, p) => s + p.morrem + p.sobrevivem, 0));

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
		produtorId != null ? produtores.find((p) => p.id === produtorId) ?? null : null
	);

	onMount(() => {
		produtores = data.produtores ?? [];
		resumo = data.resumo ?? resumo;
		produtorId = produtores[0]?.id ?? null;
		avaliar();
	});
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500/30 selection:text-white">
	<header class="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3 min-w-0">
				<span class="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
					<span class="i-lucide-shield text-lg"></span>
				</span>
				<div class="min-w-0">
					<span class="block font-black tracking-tight leading-none truncate">
						KrillShield <span class="text-rose-400">v2.0</span>
					</span>
					<span class="block text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
						Consolidação Operacional de Balcão · PMI-DF 2026
					</span>
				</div>
			</div>
			<div class="flex items-center gap-2 sm:gap-3">
				<span class="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 text-[11px] font-semibold">
					<span class="i-lucide-database mr-1.5"></span>
					SQLite · WAL
				</span>
				<span class="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 text-[11px] font-semibold overflow-hidden max-w-[180px]">
					<span class="i-lucide-user mr-1.5 shrink-0"></span>
					<span class="truncate">{data.user?.email ?? 'conta'}</span>
				</span>
				<button
					onclick={sair}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/60 text-[11px] font-semibold transition cursor-pointer"
					title="Sair da conta"
				>
					<span class="i-lucide-log-out"></span>
					Sair
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-5 py-8 space-y-8">
		<div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-black tracking-tight">Balcão de Decisão do Crédito no Agro</h1>
				<p class="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
					{produtores.length} empresas na carteira. Adicione dados e observe o cartaz mudar —
					garantia e reais mudam, não o modelo.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
				<button
					type="button"
					onclick={abrirCriar}
					class="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition active:scale-95 cursor-pointer"
				>
					<span class="i-lucide-plus mr-1"></span>Nova empresa
				</button>
				<button
					type="button"
					onclick={semearDemo}
					class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
				>
					Reiniciar demo (57)
				</button>
			</div>
		</div>

		{#if erro}
			<div class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{erro}</div>
		{/if}

		<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
			<button type="button" onclick={() => (filtro = 'TODOS')} class="group text-left rounded-2xl border p-4 transition cursor-pointer {filtro === 'TODOS' ? 'border-slate-500 bg-slate-800/50' : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'}">
				<span class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Carteira total</span>
				<span class="block text-3xl font-black text-white mt-1 tabular-nums">{produtores.length}</span>
				<span class="block text-[11px] text-slate-500 mt-1 truncate">Exposição se RJ hoje: {formatarBRL(totalExposicao)}</span>
			</button>
			<button type="button" onclick={() => (filtro = 'FIADO')} class="group text-left rounded-2xl border p-4 transition cursor-pointer {filtro === 'FIADO' ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-emerald-500/40'}">
				<span class="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">FIADO</span>
				<span class="block text-3xl font-black text-emerald-300 mt-1 tabular-nums">{resumo.FIADO}</span>
				<span class="block text-[11px] text-slate-500 mt-1">Último recurso: {formatarBRL(produtores.filter((p) => p.estado === 'FIADO').reduce((s, p) => s + p.morrem, 0))}</span>
			</button>
			<button type="button" onclick={() => (filtro = 'SÓ_EXTRACONCURSAL')} class="group text-left rounded-2xl border p-4 transition cursor-pointer {filtro === 'SÓ_EXTRACONCURSAL' ? 'border-amber-400/60 bg-amber-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-amber-500/40'}">
				<span class="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">SÓ EXTRACONCURSAL</span>
				<span class="block text-3xl font-black text-amber-300 mt-1 tabular-nums">{resumo['SÓ_EXTRACONCURSAL']}</span>
				<span class="block text-[11px] text-slate-500 mt-1">Exigem garantia blindada</span>
			</button>
			<button type="button" onclick={() => (filtro = 'À_VISTA')} class="group text-left rounded-2xl border p-4 transition cursor-pointer {filtro === 'À_VISTA' ? 'border-rose-400/60 bg-rose-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-rose-500/40'}">
				<span class="text-[11px] uppercase tracking-wider text-rose-400 font-semibold">À VISTA</span>
				<span class="block text-3xl font-black text-rose-300 mt-1 tabular-nums">{resumo['À_VISTA']}</span>
				<span class="block text-[11px] text-slate-500 mt-1">Liquidação imediata exigida</span>
			</button>
		</section>

		<section class="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
			<div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
				<h2 class="text-sm font-bold text-slate-200">Empresas na carteira</h2>
				<span class="text-xs text-slate-500">{filtrados.length} de {produtores.length}</span>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
							<th class="px-5 py-2.5 font-semibold">Empresa</th>
							<th class="px-3 py-2.5 font-semibold hidden sm:table-cell">CNPJ / CPF</th>
							<th class="px-3 py-2.5 font-semibold">Estado do cartaz</th>
							<th class="px-3 py-2.5 font-semibold text-right">R$ morrem</th>
							<th class="px-3 py-2.5 font-semibold text-right hidden md:table-cell">R$ sobrevivem</th>
							<th class="px-5 py-2.5 font-semibold text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#each filtrados as p}
							<tr
								onclick={() => selecionar(p)}
								class="border-b border-slate-800/70 hover:bg-slate-800/30 cursor-pointer transition {produtorId === p.id ? 'bg-slate-800/40 ring-inset' : ''}"
							>
								<td class="px-5 py-3">
									<span class="block text-slate-200 font-semibold max-w-55 truncate">{p.nome}</span>
									<span class="text-[11px] text-slate-500 sm:hidden">{p.cnpjCpf}</span>
								</td>
								<td class="px-3 py-3 text-slate-400 hidden sm:table-cell">{p.cnpjCpf}</td>
								<td class="px-3 py-3">
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border {badgeClasse(p.estado)}">
										{p.instrumento && p.estado === 'SÓ_EXTRACONCURSAL' ? p.instrumento : ESTADOS_CARTAZ[p.estado].rotulo}
									</span>
								</td>
								<td class="px-3 py-3 text-right font-bold tabular-nums {p.morrem > 0 ? 'text-rose-400' : 'text-slate-600'}">
									{formatarBRL(p.morrem)}
								</td>
								<td class="px-3 py-3 text-right font-bold tabular-nums {p.sobrevivem > 0 ? 'text-emerald-400' : 'text-slate-600'} hidden md:table-cell">
									{formatarBRL(p.sobrevivem)}
								</td>
								<td class="px-5 py-3 text-right">
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											abrirEditar(p.id);
										}}
										class="px-2 py-1 rounded-lg text-[11px] font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
									>
										Editar
									</button>
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											excluir(p);
										}}
										class="px-2 py-1 rounded-lg text-[11px] font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition cursor-pointer ml-1.5"
									>
										Excluir
									</button>
								</td>
							</tr>
						{/each}
						{#if filtrados.length === 0}
							<tr>
								<td colspan={6} class="px-5 py-10 text-center text-slate-500 text-sm">
									Nenhuma empresa neste estado.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</section>

		{#if selecionadaLinha}
			<section class="space-y-6">
				<div class="flex items-center gap-3">
					<h2 class="text-sm font-bold text-slate-200">Análise do produtor</h2>
					<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border {badgeClasse(selecionadaLinha.estado)}">
						{ESTADOS_CARTAZ[selecionadaLinha.estado].rotulo}
					</span>
				</div>

				{#if carregando && !analise}
					<div class="flex items-center justify-center py-16">
						<span class="i-lucide-loader-2 text-slate-400 text-3xl animate-spin"></span>
					</div>
				{:else if analise}
					<div class="relative">
						{#if carregando}
							<div class="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 rounded-2xl">
								<span class="i-lucide-loader-2 text-slate-300 text-3xl animate-spin"></span>
							</div>
						{/if}

						<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div class="lg:col-span-2 space-y-6">
								<PosterDeDecisao decisao={analise.decisao} />

								{#if basePerfil}
									<RexControl perfilBase={basePerfil} flipAtivo={flipAtivo} onToggle={toggleFlip} />
								{/if}

								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<RegraCard
										titulo="Relógio 216"
										icone="i-lucide-clock-3"
										status={statusRelogio}
										resumo={`Grau ${analise.relogio.grau} · ${analise.relogio.tempoFormalizacaoMeses} meses de formalização`}
										detalhe={analise.relogio.motivo}
									/>
									<RegraCard
										titulo="Safra vs CPR"
										icone="i-lucide-sprout"
										status={statusSafra}
										resumo={`Capacidade ${analise.safra.capacidadePeso} sc vs ${analise.perfil.volumeComprometidoCPR} sc prometidos`}
										detalhe={analise.safra.motivo}
									/>
									<RegraCard
										titulo="Carteira Krill"
										icone="i-lucide-briefcase"
										status={statusCarteira}
										resumo={`${posicoes.length} instrumento(s) na posição atual`}
										detalhe="Destino por instrumento é função determinística do tipo de garantia e da cobertura da safra."
									/>
								</div>
							</div>

							<div class="space-y-6">
								<StayVisor stay={analise.stay} />

								<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
									<div class="flex items-center justify-between mb-3">
										<span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">Posição por Instrumento</span>
										<span class="text-xs text-slate-500">{analise.perfil.cnpjCpf}</span>
									</div>
									<div class="space-y-2">
										{#each posicoes as [g, v]}
											<div class="flex items-center justify-between gap-2 text-xs border-b border-slate-800/70 pb-2 last:border-0">
												<div class="min-w-0">
													<span class="block text-slate-300 font-semibold truncate">{GARANTIAS[g].rotulo}</span>
													<span class="text-[10px] text-slate-500">{GARANTIAS[g].categoria}</span>
												</div>
												<span class="font-bold text-slate-200 tabular-nums shrink-0">{formatarBRL(v)}</span>
											</div>
										{/each}
										{#if posicoes.length === 0}
											<div class="text-xs text-slate-500 italic">Sem posições registradas.</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</section>

			<section>
				<Espelho216
					texto={analise?.textoEspelho ?? ''}
					provedor={provedor}
					carregando={espelhoCarregando}
					onRegredigir={redigirComAtendente}
				/>
			</section>
		{/if}

		{#if !analise && !carregando && totalCarteira > 0}
			<div class="text-center text-slate-500 text-sm py-6">
				Selecione uma empresa na carteira para ver o Laudo de Tela Única.
			</div>
		{/if}
	</main>

	<footer class="border-t border-slate-800/80 py-6 text-center text-[11px] text-slate-600">
		<div class="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-2">
			<span>KrillShield v2.0 · Hackathon PMI-DF 2026 · Krill Tech</span>
			<span>Regras determinísticas sobre bases públicas (DataJud, SICAR, ZARC, Junta Comercial) · LLM apenas redige o laudo</span>
		</div>
	</footer>
</div>

{#if form}
	<ProducerForm
		produtor={form.modo === 'editar' ? form.produtor : null}
		onClose={() => (form = null)}
		onSaved={salvo}
	/>
{/if}