<script lang="ts">
	import type { PerfilProdutor, Garantia } from '$lib/krillshield/types';
	import { GARANTIAS } from '$lib/krillshield/types';

	let { produtor, onClose, onSaved } = $props<{
		produtor: PerfilProdutor | null;
		onClose: () => void;
		onSaved: (id: number) => void;
	}>();

	type LinhaPosicao = { instrumento: Garantia; valor: number };

	// svelte-ignore state_referenced_locally
	const inicial = {
		nome: produtor?.nome ?? '',
		cnpjCpf: produtor?.cnpjCpf ?? '',
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
	let erro = $state('');
	let instrumentosOpcoes = $derived(Object.keys(GARANTIAS) as Garantia[]);

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
				cnpjCpf,
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

<div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 sm:p-8">
	<div class="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
		<div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
			<div>
				<h2 class="text-lg font-black text-slate-100">
					{produtor ? 'Editar produtor' : 'Nova empresa na carteira'}
				</h2>
				<p class="text-xs text-slate-500">
					Alterações reanalisam o cartaz instantaneamente (regras determinísticas).
				</p>
			</div>
			<button
				type="button"
				onclick={onClose}
				aria-label="Fechar formulário"
				class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
			>
				<span class="i-lucide-x text-lg"></span>
			</button>
		</div>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				salvar();
			}}
			class="px-6 py-5 space-y-5"
		>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="sm:col-span-2">
					<label for="pf-nome" class="block text-xs font-semibold text-slate-400 mb-1">Razão social</label>
					<input
						id="pf-nome"
						bind:value={nome}
						required
						placeholder="Ex.: Fazenda Boa Safra Ltda"
						class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
					/>
				</div>
				<div>
					<label for="pf-cnpj" class="block text-xs font-semibold text-slate-400 mb-1">CNPJ / CPF</label>
					<input
						id="pf-cnpj"
						bind:value={cnpjCpf}
						required
						placeholder="00.000.000/0001-00"
						class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
					/>
				</div>
				<div>
					<label for="pf-junta" class="block text-xs font-semibold text-slate-400 mb-1">Inscrição na Junta Comercial</label>
					<input
						id="pf-junta"
						type="date"
						bind:value={dataRegistroJunta}
						class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<label for="pf-area" class="block text-xs font-semibold text-slate-400 mb-1">Área plantada (CAR)</label>
					<input
						id="pf-area"
						type="number"
						min="0"
						bind:value={areaPlantadaCAR}
						class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
					/>
				</div>
				<div>
					<label for="pf-zarc" class="block text-xs font-semibold text-slate-400 mb-1">Produtividade (ZARC)</label>
					<input
						id="pf-zarc"
						type="number"
						min="0"
						bind:value={produtividadeZarc}
						class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
					/>
				</div>
				<div>
					<label for="pf-volume" class="block text-xs font-semibold text-slate-400 mb-1">Volume comprometido (CPR)</label>
					<input
						id="pf-volume"
						type="number"
						min="0"
						bind:value={volumeComprometidoCPR}
						class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
					<input type="checkbox" bind:checked={escrituracaoLCDPR} class="accent-rose-500" />
					Escrituração LCDPR ativa
				</label>
				<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
					<input type="checkbox" bind:checked={possuiCPRFisica} class="accent-rose-500" />
					Possui CPR física emitida
				</label>
				<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
					<input type="checkbox" bind:checked={podeConstituirFiducia} class="accent-rose-500" />
					Máquinas livres p/ fidúcia
				</label>
				<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer sm:col-span-3">
					<input type="checkbox" bind:checked={riscoMoratoria} class="accent-rose-500" />
					Sinal de moratória iminente (força cartaz À VISTA)
				</label>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-semibold text-slate-400">Posições financeiras atuais (Carteira Krill)</span>
					<button
						type="button"
						onclick={adicionarPosicao}
						class="px-2 py-1 rounded-lg text-[11px] font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
					>
						+ Instrumento
					</button>
				</div>

				<div class="space-y-2">
					{#each posicoes as pos, i}
						<div class="flex items-center gap-2">
							<select
								bind:value={pos.instrumento}
								class="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none cursor-pointer"
							>
								{#each instrumentosOpcoes as g}
									<option value={g}>{GARANTIAS[g].rotulo}</option>
								{/each}
							</select>
							<input
								type="number"
								min="0"
								bind:value={pos.valor}
								placeholder="R$"
								class="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
							/>
							<button
								type="button"
								onclick={() => removerPosicao(i)}
								aria-label="Remover instrumento"
								class="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 cursor-pointer"
							>
								<span class="i-lucide-trash-2 text-sm"></span>
							</button>
						</div>
					{/each}
				</div>
			</div>

			{#if erro}
				<div class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">{erro}</div>
			{/if}

			<div class="flex items-center justify-end gap-2 pt-2">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="submit"
					disabled={salvando}
					class="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-sm font-bold text-white transition cursor-pointer disabled:opacity-50"
				>
					{salvando ? 'Salvando...' : produtor ? 'Salvar alterações' : 'Cadastrar e analisar'}
				</button>
			</div>
		</form>
	</div>
</div>