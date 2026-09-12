import Database from 'better-sqlite3';
import type { PerfilProdutor } from '$lib/krillshield/types';
import { inserirProdutor } from './db';
import { gerarDemoProdutores } from './dadosDemo';

function showcase(): Omit<PerfilProdutor, 'id'>[] {
	return [
		{
			cnpjCpf: '10.807.374/0001-77',
			nome: 'Boa Safra Sementes S.A. — Unidade Arbolina',
			dataRegistroJunta: '2018-05-10',
			escrituracaoLCDPR: true,
			areaPlantadaCAR: 1200,
			produtividadeZarc: 60,
			volumeComprometidoCPR: 30000,
			possuiCPRFisica: true,
			podeConstituirFiducia: true,
			riscoMoratoria: false,
			posicaoPorInstrumento: {
				duplicata_mercantil: 350000,
				alienacao_fiduciaria: 250000,
				cpr_fisica: 150000
			}
		},
		{
			cnpjCpf: '03.143.716/0001-36',
			nome: 'Agropecuária Tamakavy S.A. (São Félix do Araguaia - MT)',
			dataRegistroJunta: '2025-02-15', // Inscrita há 12 meses (< 24m, Relógio 216 FORMALIZANDO)
			escrituracaoLCDPR: true,
			areaPlantadaCAR: 1100,
			produtividadeZarc: 58,
			volumeComprometidoCPR: 28000,
			possuiCPRFisica: false,
			podeConstituirFiducia: true,
			riscoMoratoria: false,
			posicaoPorInstrumento: {
				duplicata_mercantil: 280000,
				alienacao_fiduciaria: 320000
			}
		},
		{
			cnpjCpf: '07.628.528/0001-59',
			nome: 'BrasilAgro — Cia. Brasileira de Propriedades Agrícolas',
			dataRegistroJunta: '2015-09-01',
			escrituracaoLCDPR: true,
			areaPlantadaCAR: 2400,
			produtividadeZarc: 65,
			volumeComprometidoCPR: 75000,
			possuiCPRFisica: true,
			podeConstituirFiducia: true,
			riscoMoratoria: false,
			posicaoPorInstrumento: {
				duplicata_mercantil: 800000,
				alienacao_fiduciaria: 600000,
				cpr_fisica: 400000,
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