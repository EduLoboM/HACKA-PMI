import { getDb, buscarProdutorCompleto, listarTodasAvaliacoesHistorico } from '$lib/server/db';
import { ensureSeeded } from '$lib/server/seed';
import { analisar } from '$lib/krillshield/engine';
import { GARANTIAS, type Garantia, type EstadoCartaz } from '$lib/krillshield/types';

export interface AgregadoInstrumento {
	instrumento: Garantia;
	rotulo: string;
	categoria: string;
	destinoBase: string;
	totalValor: number;
	quantidadeOcorrencias: number;
	percentualCarteira: number;
}

export async function load() {
	const db = getDb();
	ensureSeeded(db);

	const rows = db.prepare('SELECT id FROM produtores ORDER BY id').all() as { id: number }[];

	let totalGeral = 0;
	let totalSobrevivem = 0;
	let totalMorrem = 0;

	const contadoresEstado: Record<EstadoCartaz, number> = {
		FIADO: 0,
		'SÓ_EXTRACONCURSAL': 0,
		'À_VISTA': 0
	};

	const instrumentosMap: Record<Garantia, { valor: number; qtd: number }> = {
		duplicata_mercantil: { valor: 0, qtd: 0 },
		nota_promissoria: { valor: 0, qtd: 0 },
		penhor_agricola: { valor: 0, qtd: 0 },
		alienacao_fiduciaria: { valor: 0, qtd: 0 },
		cpr_fisica: { valor: 0, qtd: 0 },
		cpr_financeira: { valor: 0, qtd: 0 }
	};

	const empresasDetalhadas = [];

	for (const r of rows) {
		const perfil = buscarProdutorCompleto(db, r.id);
		if (!perfil) continue;

		const analise = analisar(perfil);
		const morrem = analise.stay.totalMorrem;
		const sobrevivem = analise.stay.totalSobrevivem;
		const totalEmpresa = morrem + sobrevivem;

		totalGeral += totalEmpresa;
		totalSobrevivem += sobrevivem;
		totalMorrem += morrem;

		contadoresEstado[analise.decisao.estado]++;

		for (const [instStr, val] of Object.entries(perfil.posicaoPorInstrumento)) {
			const inst = instStr as Garantia;
			if (val && val > 0 && instrumentosMap[inst]) {
				instrumentosMap[inst].valor += val;
				instrumentosMap[inst].qtd += 1;
			}
		}

		empresasDetalhadas.push({
			id: r.id,
			nome: perfil.nome,
			cnpjCpf: perfil.cnpjCpf,
			estado: analise.decisao.estado,
			instrumentoNomeado: analise.decisao.instrumentoRotulo,
			totalEmpresa,
			morrem,
			sobrevivem,
			taxaBlindagem: totalEmpresa > 0 ? sobrevivem / totalEmpresa : 1,
			relogioGrau: analise.relogio.grau,
			tempoJuntaMeses: analise.relogio.tempoFormalizacaoMeses,
			safraCoberturaOk: analise.safra.coberturaOk,
			volumeComprometidoCPR: perfil.volumeComprometidoCPR,
			areaPlantadaCAR: perfil.areaPlantadaCAR
		});
	}

	// Top riscos no Stay Period (maiores perdas concursais potenciais)
	const topRiscoStay = [...empresasDetalhadas]
		.filter((e) => e.morrem > 0)
		.sort((a, b) => b.morrem - a.morrem)
		.slice(0, 10);

	// Instrumentos consolidados
	const instrumentosConsolidados: AgregadoInstrumento[] = (Object.keys(GARANTIAS) as Garantia[])
		.map((g) => {
			const meta = GARANTIAS[g];
			const dados = instrumentosMap[g];
			return {
				instrumento: g,
				rotulo: meta.rotulo,
				categoria: meta.categoria,
				destinoBase: meta.destinoBase,
				totalValor: dados.valor,
				quantidadeOcorrencias: dados.qtd,
				percentualCarteira: totalGeral > 0 ? (dados.valor / totalGeral) * 100 : 0
			};
		})
		.sort((a, b) => b.totalValor - a.totalValor);

	const taxaBlindagemGlobal = totalGeral > 0 ? (totalSobrevivem / totalGeral) * 100 : 0;
	const desagioMedioRJ = 0.30;
	const perdaPrevistaDesagio = totalMorrem * desagioMedioRJ;
	const recuperacaoProvavel = totalMorrem * (1 - desagioMedioRJ);

	// Histórico de avaliações gravadas no banco
	const historicoAvaliacoes = listarTodasAvaliacoesHistorico(db, 100);

	return {
		kpis: {
			totalEmpresas: rows.length,
			totalGeral,
			totalSobrevivem,
			totalMorrem,
			taxaBlindagemGlobal,
			desagioMedioRJ,
			perdaPrevistaDesagio,
			recuperacaoProvavel,
			resumoEstados: contadoresEstado
		},
		instrumentos: instrumentosConsolidados,
		topRiscoStay,
		historicoAvaliacoes,
		empresasDetalhadas
	};
}

