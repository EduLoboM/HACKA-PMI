import Database from 'better-sqlite3';
import type { PerfilProdutor } from '$lib/krillshield/types';
import { inserirProdutor } from './db';
import { gerarDemoProdutores } from './dadosDemo';

function showcase(): Omit<PerfilProdutor, 'id'>[] {
	return [
		{
			cnpjCpf: '12.345.678/0001-90',
			nome: 'Fazenda Boa Safra — Arbolina de Campo',
			cnpjCpf: '10.807.374/0001-77',
			nome: 'Boa Safra Sementes S.A. — Unidade Arbolina',
			dataRegistroJunta: '2018-05-10',
			escrituracaoLCDPR: true,
			areaPlantadaCAR: 1000,
			produtividadeZarc: 60,
			volumeComprometidoCPR: 30000,
			possuiCPRFisica: true,
			podeConstituirFiducia: true,
			riscoMoratoria: false,
			posicaoPorInstrumento: {
				duplicata_mercantil: 400000,
				cpr_fisica: 100000
			}
		},
		{
			cnpjCpf: '98.765.432/0001-01',
			nome: 'Agropecuária Sudoeste LTDA',
			cnpjCpf: '03.143.716/0001-36',
			nome: 'Agropecuária Tamakavy S.A. (São Félix do Araguaia - MT)',
			dataRegistroJunta: '2023-02-20',
			escrituracaoLCDPR: true,
			areaPlantadaCAR: 500,
			produtividadeZarc: 55,
			volumeComprometidoCPR: 40000,
			possuiCPRFisica: false,
			podeConstituirFiducia: false,
			riscoMoratoria: false,
			posicaoPorInstrumento: {
				nota_promissoria: 250000,
				penhor_agricola: 120000
			}
		},
		{
			cnpjCpf: '45.678.900/0001-12',
			nome: 'Grãos do Cerrado S.A.',
			cnpjCpf: '07.628.528/0001-59',
			nome: 'BrasilAgro — Cia. Brasileira de Propriedades Agrícolas',
			dataRegistroJunta: '2015-09-01',
			escrituracaoLCDPR: true,
			areaPlantadaCAR: 2000,
			produtividadeZarc: 65,
			volumeComprometidoCPR: 100000,
			possuiCPRFisica: true,
			podeConstituirFiducia: true,
			riscoMoratoria: false,
			posicaoPorInstrumento: {
				duplicata_mercantil: 900000,
				cpr_fisica: 400000,
				alienacao_fiduciaria: 350000,
				cpr_financeira: 200000
			}
		}
	];
}

export function semearDatabase(db: Database.Database, force = false): void {
	const count = db.prepare('SELECT COUNT(*) AS n FROM produtores').get() as { n: number };
	if (count.n > 0 && !force) return;

	if (force) {
		const tx = db.transaction(() => {
			db.prepare('DELETE FROM produtores').run();
			db.prepare("DELETE FROM sqlite_sequence WHERE name = 'produtores'").run();
			db.prepare("DELETE FROM sqlite_sequence WHERE name = 'avaliacoes'").run();
		});
		tx();
	}

	const todos = [...showcase(), ...gerarDemoProdutores()];
	const tx = db.transaction(() => {
		for (const p of todos) {
			inserirProdutor(db, p);
		}
	});
	tx();
}

export function ensureSeeded(db: Database.Database): void {
	semearDatabase(db);
}