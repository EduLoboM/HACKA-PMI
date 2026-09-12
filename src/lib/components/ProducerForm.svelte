<script lang="ts">
	import type { PerfilProdutor, Garantia } from '$lib/krillshield/types';
	import { GARANTIAS } from '$lib/krillshield/types';
	import { validarCNPJ, formatarCNPJ, limparCNPJ } from '$lib/krillshield/cnpj';

	let { produtor, onClose, onSaved } = $props<{
		produtor: PerfilProdutor | null;
		onClose: () => void;
		onSaved: (id: number) => void;
	}>();

	type LinhaPosicao = { instrumento: Garantia; valor: number };

	// svelte-ignore state_referenced_locally
	const inicial = {
		nome: produtor?.nome ?? '',
		cnpjCpf: produtor?.cnpjCpf ? formatarCNPJ(produtor.cnpjCpf) : '',
		dataRegistroJunta: produtor?.dataRegistroJunta ?? new Date().toISOString().slice(0, 10),
		escrituracaoLCDPR: produtor?.escrituracaoLCDPR ?? false,
		areaPlantadaCAR: produtor?.areaPlantadaCAR ?? 500,
		produtividadeZarc: produtor?.produtividadeZarc ?? 60,
		volumeComprometidoCPR: produtor?.volumeComprometidoCPR ?? 30000,
		possuiCPRFisica: produtor?.possuiCPRFisica ?? false,
		podeConstituirFiducia: produtor?.podeConstituirFiducia ?? false,
		riscoMoratoria: produtor?.riscoMoratoria ?? false,
		posicoes: produtor
			? (Object.entries(produtor.posicaoPorInstrumento) as [Garantia, number][])
					.filter(([, v]) => v && v > 0)
					.map(([instrumento, valor]) => ({ instrumento, valor }))
			: [{ instrumento: 'duplicata_mercantil' as Garantia, valor: 250000 }]
	};

	let nome = $state(inicial.nome);
	let cnpjCpf = $state(inicial.cnpjCpf);
	let dataRegistroJunta = $state(inicial.dataRegistroJunta);
	let escrituracaoLCDPR = $state(inicial.escrituracaoLCDPR);
	let areaPlantadaCAR = $state(inicial.areaPlantadaCAR);
	let produtividadeZarc = $state(inicial.produtividadeZarc);
	let volumeComprometidoCPR = $state(inicial.volumeComprometidoCPR);
	let possuiCPRFisica = $state(inicial.possuiCPRFisica);
	let podeConstituirFiducia = $state(inicial.podeConstituirFiducia);
	let riscoMoratoria = $state(inicial.riscoMoratoria);
	let posicoes = $state<LinhaPosicao[]>(inicial.posicoes);

	let salvando = $state(false);
	let consultandoCNPJ = $state(false);
	let msgConsulta = $state('');
	let msgSucessoAuto = $state(false);
	let erro = $state('');
	let instrumentosOpcoes = $derived(Object.keys(GARANTIAS) as Garantia[]);

	let cnpjLimpo = $derived(limparCNPJ(cnpjCpf));
	let cnpjValido = $derived(validarCNPJ(cnpjCpf));

	const PRESETS_RAPIDOS = [
		{ nome: 'SLC Agrícola', cnpj: '89.096.457/0001-55', estado: 'FIADO' },
		{ nome: 'Jalles Machado', cnpj: '02.635.522/0001-95', estado: 'FIADO' },
		{ nome: 'Agropecuária Tamakavy', cnpj: '24.956.666/0001-86', estado: 'SÓ EXTRACONCURSAL' },
		{ nome: 'Coamo Agro', cnpj: '75.904.383/0001-21', estado: 'FIADO' },
		{ nome: 'Agrogalaxy (RJ)', cnpj: '21.240.146/0001-84', estado: 'À VISTA' }
	];

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function onInputCNPJ(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		const limpo = limparCNPJ(val);
		if (limpo.length === 14) {
			cnpjCpf = formatarCNPJ(limpo);
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				consultarCNPJ();
			}, 250);
		} else {
			cnpjCpf = val;
		}
	}

	async function aplicarPreset(cnpj: string) {
		cnpjCpf = cnpj;
		await consultarCNPJ();
	}

	async function consultarCNPJ() {
		if (cnpjLimpo.length !== 14) {
			msgConsulta = 'Digite os 14 dígitos do CNPJ para consulta automática.';
			msgSucessoAuto = false;
			return;
		}
		consultandoCNPJ = true;
		msgConsulta = '';
		msgSucessoAuto = false;
		erro = '';
		try {
			const res = await fetch(`/api/cnpj/${cnpjLimpo}`);
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.message ?? `Erro HTTP ${res.status}`);
			}
			const data = await res.json();
			if (data.ok) {
				cnpjCpf = data.cnpj || formatarCNPJ(cnpjLimpo);
				if (data.nomeComposto || data.razaoSocial) {
					nome = data.nomeComposto || data.razaoSocial;
				}
				if (data.dataInicioAtividade) {
					dataRegistroJunta = data.dataInicioAtividade;
				}
				if (data.areaPlantadaCAR) {
					areaPlantadaCAR = data.areaPlantadaCAR;
				}
				if (data.produtividadeZarc) {
					produtividadeZarc = data.produtividadeZarc;
				}
				if (data.volumeComprometidoCPR) {
					volumeComprometidoCPR = data.volumeComprometidoCPR;
				}
				if (data.escrituracaoLCDPR !== undefined) {
					escrituracaoLCDPR = data.escrituracaoLCDPR;
				}
				if (data.podeConstituirFiducia !== undefined) {
					podeConstituirFiducia = data.podeConstituirFiducia;
				}
				if (data.possuiCPRFisica !== undefined) {
					possuiCPRFisica = data.possuiCPRFisica;
				}
				if (data.riscoMoratoria !== undefined) {
					riscoMoratoria = data.riscoMoratoria;
				}
				if (data.sugestaoPosicoes && data.sugestaoPosicoes.length > 0) {
					if (posicoes.length <= 1) {
						posicoes = data.sugestaoPosicoes;
					}
				}
				msgConsulta = `Automação concluída: Dados da Receita e benchmarks ZARC preenchidos automaticamente (${data.situacao || 'Ativa'}).`;
				msgSucessoAuto = true;
			}
		} catch (e) {
			msgConsulta = e instanceof Error ? e.message : 'Não foi possível consultar na base externa.';
			msgSucessoAuto = false;
		} finally {
			consultandoCNPJ = false;
		}
	}

	function adicionarPosicao() {
		posicoes = [...posicoes, { instrumento: 'duplicata_mercantil' as Garantia, valor: 100000 }];
	}

	function removerPosicao(i: number) {
		posicoes = posicoes.filter((_, idx) => idx !== i);
	}

	async function salvar() {
		erro = '';
		salvando = true;
		try {
			const posicaoPorInstrumento: Record<string, number> = {};
			for (const l of posicoes) {
				if (l.valor > 0) posicaoPorInstrumento[l.instrumento] = Number(l.valor);
			}

			const payload = {
				nome,
				cnpjCpf: formatarCNPJ(cnpjCpf),
				dataRegistroJunta,
				escrituracaoLCDPR,
				areaPlantadaCAR: Number(areaPlantadaCAR),
				produtividadeZarc: Number(produtividadeZarc),
				volumeComprometidoCPR: Number(volumeComprometidoCPR),
				possuiCPRFisica,
				podeConstituirFiducia,
				riscoMoratoria,
				posicaoPorInstrumento
			};

			const modo = produtor ? 'PUT' : 'POST';
			const url = produtor ? `/api/produtor/${produtor.id}` : '/api/produtor';
			const res = await fetch(url, {
				method: modo,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const r = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(r.error ?? `HTTP ${res.status}`);
			onSaved(produtor?.id ?? Number(r.id));
		} catch (e) {
			erro = e instanceof Error ? e.message : String(e);
		} finally {
			salvando = false;
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 sm:p-8">
	<div class="w-full max-w-2xl bg-white border border-slate-300 shadow-xl overflow-hidden my-auto">
		<!-- Header -->
		<div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 bg-slate-50">
			<div>
				<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
					{produtor ? 'Editar Perfil do Produtor' : 'Nova Empresa na Carteira'}
				</h3>
				<p class="text-xs text-slate-500">
					A alteração recalcula imediatamente as regras da LREF e do Provimento 216
				</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				aria-label="Fechar formulário"
				class="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
			>
				<span class="i-lucide-x text-sm"></span>
			</button>
		</div>

		<!-- Presets Bar (1-Click Fill) -->
		{#if !produtor}
			<div class="px-4 sm:px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center gap-2">
				<span class="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
					<span class="i-lucide-sparkles text-emerald-600"></span>
					Preenchimento 1-Clique:
				</span>
				<div class="flex flex-wrap items-center gap-1.5">
					{#each PRESETS_RAPIDOS as p}
						<button
							type="button"
							onclick={() => aplicarPreset(p.cnpj)}
							disabled={consultandoCNPJ}
							class="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-emerald-200 text-slate-700 hover:bg-emerald-100/60 hover:text-emerald-900 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
						>
							<span class="font-semibold">{p.nome}</span>
							<span class="text-[9px] text-slate-500 font-mono ml-1">({p.estado})</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Form Body -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				salvar();
			}}
			class="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5"
		>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="pf-nome" class="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome Fantasia</label>
					<input
						id="pf-nome"
						bind:value={nome}
						required
						placeholder="Ex.: SLC Agrícola S.A."
						class="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150 shadow-sm"
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="pf-cnpj" class="block text-xs font-semibold text-slate-700">CNPJ / CPF</label>
						<span class="text-[10px] text-emerald-700 font-medium">✨ Automação ao digitar 14 dígitos</span>
					</div>
					<div class="flex items-center gap-1.5">
						<input
							id="pf-cnpj"
							value={cnpjCpf}
							oninput={onInputCNPJ}
							required
							placeholder="00.000.000/0001-00"
							class="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150 shadow-sm font-mono"
						/>
						<button
							type="button"
							onclick={consultarCNPJ}
							disabled={consultandoCNPJ || cnpjLimpo.length !== 14}
							title="Consultar dados cadastrais na Receita / BrasilAPI"
							class="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
						>
							{#if consultandoCNPJ}
								<span class="i-lucide-loader-2 text-xs animate-spin"></span>
							{:else}
								<span class="i-lucide-sparkles text-xs text-emerald-600"></span>
							{/if}
							<span class="hidden sm:inline">Auto-Preencher</span>
						</button>
					</div>
					{#if cnpjLimpo.length === 14}
						{#if cnpjValido}
							<div class="text-[10px] text-emerald-700 font-mono font-semibold mt-1 flex items-center gap-1">
								<span class="i-lucide-check-circle text-xs text-emerald-600"></span>
								<span>CNPJ Válido (Receita Federal)</span>
							</div>
						{:else}
							<div class="text-[10px] text-rose-700 font-mono font-semibold mt-1 flex items-center gap-1">
								<span class="i-lucide-alert-triangle text-xs text-rose-600"></span>
								<span>Dígitos verificadores inválidos (Módulo 11)</span>
							</div>
						{/if}
					{/if}
					{#if msgConsulta}
						<div class="text-[11px] mt-1.5 p-2 rounded-lg {msgSucessoAuto ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-50 text-slate-600 italic'}">
							{msgConsulta}
						</div>
					{/if}
				</div>
				<div>
					<label for="pf-junta" class="block text-xs font-semibold text-slate-700 mb-1">Data Inscrição Junta Comercial</label>
					<input
						id="pf-junta"
						type="date"
						bind:value={dataRegistroJunta}
						class="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150 shadow-sm"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<label for="pf-area" class="block text-xs font-semibold text-slate-700 mb-1">Área Plantada CAR (ha)</label>
					<input
						id="pf-area"
						type="number"
						min="0"
						bind:value={areaPlantadaCAR}
						class="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150 shadow-sm tabular-nums"
					/>
				</div>
				<div>
					<label for="pf-zarc" class="block text-xs font-semibold text-slate-700 mb-1">Produtividade ZARC (sc/ha)</label>
					<input
						id="pf-zarc"
						type="number"
						min="0"
						bind:value={produtividadeZarc}
						class="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150 shadow-sm tabular-nums"
					/>
				</div>
				<div>
					<label for="pf-volume" class="block text-xs font-semibold text-slate-700 mb-1">Volume CPR (sc)</label>
					<input
						id="pf-volume"
						type="number"
						min="0"
						bind:value={volumeComprometidoCPR}
						class="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150 shadow-sm tabular-nums"
					/>
				</div>
			</div>

			<!-- Checkbox Matrix -->
			<div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
				<label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
					<input type="checkbox" bind:checked={escrituracaoLCDPR} class="accent-emerald-600 w-4 h-4 rounded" />
					Escrituração LCDPR ativa
				</label>
				<label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
					<input type="checkbox" bind:checked={possuiCPRFisica} class="accent-emerald-600 w-4 h-4 rounded" />
					Possui CPR física emitida
				</label>
				<label class="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
					<input type="checkbox" bind:checked={podeConstituirFiducia} class="accent-emerald-600 w-4 h-4 rounded" />
					Bens livres para fidúcia
				</label>
				<label class="flex items-center gap-2 text-xs font-medium text-rose-800 cursor-pointer select-none sm:col-span-3 pt-2 border-t border-slate-200/60">
					<input type="checkbox" bind:checked={riscoMoratoria} class="accent-rose-600 w-4 h-4 rounded" />
					Indicativo de moratória / RJ iminente (condiciona cartaz à vista)
				</label>
			</div>

			<!-- Posições por Instrumento -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<div>
						<span class="text-xs font-bold text-slate-800 block">Posições Financeiras na Carteira Krill</span>
						<span class="text-[11px] text-slate-500">Classificação jurídica dos títulos para cálculo do Stay Period</span>
					</div>
					<button
						type="button"
						onclick={adicionarPosicao}
						class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-[background-color] duration-150 cursor-pointer"
					>
						<span class="i-lucide-plus text-xs"></span>
						Instrumento
					</button>
				</div>

				<div class="space-y-2">
					{#each posicoes as pos, i}
						<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
							<select
								bind:value={pos.instrumento}
								class="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none cursor-pointer"
							>
								{#each instrumentosOpcoes as g}
									<option value={g}>{GARANTIAS[g].rotulo} ({GARANTIAS[g].categoria})</option>
								{/each}
							</select>
							<div class="flex items-center gap-2">
								<div class="relative flex-1 sm:w-36">
									<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">R$</span>
									<input
										type="number"
										min="0"
										bind:value={pos.valor}
										placeholder="0,00"
										class="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono tabular-nums"
									/>
								</div>
								<button
									type="button"
									onclick={() => removerPosicao(i)}
									aria-label="Remover instrumento"
									class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-[background-color,color] duration-150 cursor-pointer"
								>
									<span class="i-lucide-trash-2 text-sm"></span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			{#if erro}
				<div class="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 font-medium">
					{erro}
				</div>
			{/if}

			<!-- Bottom Actions -->
			<div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-200">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 sm:py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors duration-150 cursor-pointer text-center"
				>
					Cancelar
				</button>
				<button
					type="submit"
					disabled={salvando}
					class="px-5 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors duration-150 cursor-pointer disabled:opacity-50 text-center"
				>
					{salvando ? 'Salvando...' : produtor ? 'Salvar Alterações' : 'Cadastrar e Avaliar'}
				</button>
			</div>
		</form>
	</div>
</div>