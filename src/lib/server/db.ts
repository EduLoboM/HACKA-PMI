import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.KRILLSHIELD_DB || path.resolve('data/krillshield.db');

let _db: Database.Database | null = null;

function initSchema(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS produtores (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			cnpj_cpf TEXT NOT NULL UNIQUE,
			nome TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS relogio216 (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produtor_id INTEGER NOT NULL UNIQUE REFERENCES produtores(id) ON DELETE CASCADE,
			data_registro_junta TEXT NOT NULL,
			escrituracao_lcdpr INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS carta_produtividade (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produtor_id INTEGER NOT NULL UNIQUE REFERENCES produtores(id) ON DELETE CASCADE,
			area_plantada_car REAL NOT NULL,
			produtividade_zarc REAL NOT NULL,
			volume_comprometido_cpr REAL NOT NULL,
			tem_cpr_fisica INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS carteira_krill (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produtor_id INTEGER NOT NULL REFERENCES produtores(id) ON DELETE CASCADE,
			instrumento TEXT NOT NULL CHECK(instrumento IN (
				'duplicata_mercantil','nota_promissoria','penhor_agricola',
				'alienacao_fiduciaria','cpr_fisica','cpr_financeira'
			)),
			valor REAL NOT NULL DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS perfil_extra (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produtor_id INTEGER NOT NULL UNIQUE REFERENCES produtores(id) ON DELETE CASCADE,
			pode_constituir_fiducia INTEGER NOT NULL DEFAULT 0,
			risco_moratoria INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS avaliacoes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produtor_id INTEGER NOT NULL REFERENCES produtores(id) ON DELETE CASCADE,
			estado_cartaz TEXT NOT NULL,
			instrumento_nomeado TEXT,
			total_morrem REAL NOT NULL DEFAULT 0,
			total_sobrevivem REAL NOT NULL DEFAULT 0,
			relogio_sinal INTEGER NOT NULL DEFAULT 0,
			relogio_grau TEXT NOT NULL,
			safra_sinal INTEGER NOT NULL DEFAULT 0,
			safra_cobertura_ok INTEGER NOT NULL DEFAULT 0,
			texto_espelho TEXT,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE INDEX IF NOT EXISTS idx_carteira_produtor ON carteira_krill(produtor_id);
		CREATE INDEX IF NOT EXISTS idx_avaliacoes_produtor ON avaliacoes(produtor_id);
		CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_cnpj_cpf ON produtores(cnpj_cpf);
	`);

	db.exec('PRAGMA journal_mode = WAL');
	db.exec('PRAGMA foreign_keys = ON');
}

export function getDb(): Database.Database {
	if (_db) return _db;

	const dir = path.dirname(DB_PATH);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	_db = new Database(DB_PATH);
	initSchema(_db);
	return _db;
}

export function inserirProdutor(
	db: Database.Database,
	dados: {
		cnpjCpf: string;
		nome: string;
		dataRegistroJunta: string;
		escrituracaoLCDPR: boolean;
		areaPlantadaCAR: number;
		produtividadeZarc: number;
		volumeComprometidoCPR: number;
		possuiCPRFisica: boolean;
		podeConstituirFiducia: boolean;
		riscoMoratoria: boolean;
		posicaoPorInstrumento: Record<string, number>;
	}
): number {
	const tx = db.transaction(() => {
		const r1 = db.prepare(
			'INSERT INTO produtores (cnpj_cpf, nome) VALUES (?, ?)'
		).run(dados.cnpjCpf, dados.nome);
		const pid = r1.lastInsertRowid;

		db.prepare(
			'INSERT INTO relogio216 (produtor_id, data_registro_junta, escrituracao_lcdpr) VALUES (?, ?, ?)'
		).run(pid, dados.dataRegistroJunta, dados.escrituracaoLCDPR ? 1 : 0);

		db.prepare(
			'INSERT INTO carta_produtividade (produtor_id, area_plantada_car, produtividade_zarc, volume_comprometido_cpr, tem_cpr_fisica) VALUES (?, ?, ?, ?, ?)'
		).run(pid, dados.areaPlantadaCAR, dados.produtividadeZarc, dados.volumeComprometidoCPR, dados.possuiCPRFisica ? 1 : 0);

		db.prepare(
			'INSERT INTO perfil_extra (produtor_id, pode_constituir_fiducia, risco_moratoria) VALUES (?, ?, ?)'
		).run(pid, dados.podeConstituirFiducia ? 1 : 0, dados.riscoMoratoria ? 1 : 0);

		const stmtCarteira = db.prepare(
			'INSERT INTO carteira_krill (produtor_id, instrumento, valor) VALUES (?, ?, ?)'
		);
		for (const [inst, val] of Object.entries(dados.posicaoPorInstrumento)) {
			if (val && val > 0) stmtCarteira.run(pid, inst, val);
		}

		return Number(pid);
	});
	return tx();
}

export function atualizarProdutor(
	db: Database.Database,
	produtorId: number,
	dados: {
		nome?: string;
		cnpjCpf?: string;
		dataRegistroJunta: string;
		escrituracaoLCDPR: boolean;
		areaPlantadaCAR: number;
		produtividadeZarc: number;
		volumeComprometidoCPR: number;
		possuiCPRFisica: boolean;
		podeConstituirFiducia: boolean;
		riscoMoratoria: boolean;
		posicaoPorInstrumento: Record<string, number>;
	}
): void {
	const tx = db.transaction(() => {
		if (dados.nome !== undefined || dados.cnpjCpf !== undefined) {
			const base = db.prepare('SELECT nome, cnpj_cpf FROM produtores WHERE id = ?').get(produtorId) as {
				nome: string;
				cnpj_cpf: string;
			};
			db.prepare('UPDATE produtores SET nome = ?, cnpj_cpf = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
				dados.nome ?? base.nome,
				dados.cnpjCpf ?? base.cnpj_cpf,
				produtorId
			);
		} else {
			db.prepare('UPDATE produtores SET updated_at = datetime(\'now\') WHERE id = ?').run(produtorId);
		}
		db.prepare('UPDATE relogio216 SET data_registro_junta = ?, escrituracao_lcdpr = ? WHERE produtor_id = ?')
			.run(dados.dataRegistroJunta, dados.escrituracaoLCDPR ? 1 : 0, produtorId);
		db.prepare(
			'UPDATE carta_produtividade SET area_plantada_car = ?, produtividade_zarc = ?, volume_comprometido_cpr = ?, tem_cpr_fisica = ? WHERE produtor_id = ?'
		).run(dados.areaPlantadaCAR, dados.produtividadeZarc, dados.volumeComprometidoCPR, dados.possuiCPRFisica ? 1 : 0, produtorId);
		db.prepare('UPDATE perfil_extra SET pode_constituir_fiducia = ?, risco_moratoria = ? WHERE produtor_id = ?')
			.run(dados.podeConstituirFiducia ? 1 : 0, dados.riscoMoratoria ? 1 : 0, produtorId);
		db.prepare('DELETE FROM carteira_krill WHERE produtor_id = ?').run(produtorId);
		const stmtCarteira = db.prepare('INSERT INTO carteira_krill (produtor_id, instrumento, valor) VALUES (?, ?, ?)');
		for (const [inst, val] of Object.entries(dados.posicaoPorInstrumento)) {
			if (val && val > 0) stmtCarteira.run(produtorId, inst, val);
		}
	});
	tx();
}

export function buscarProdutorCompleto(db: Database.Database, produtorId: number) {
	const prod = db.prepare('SELECT id, cnpj_cpf, nome FROM produtores WHERE id = ?').get(produtorId) as any;
	if (!prod) return null;

	const rel = db.prepare('SELECT * FROM relogio216 WHERE produtor_id = ?').get(produtorId) as any;
	const cap = db.prepare('SELECT * FROM carta_produtividade WHERE produtor_id = ?').get(produtorId) as any;
	const extra = db.prepare('SELECT * FROM perfil_extra WHERE produtor_id = ?').get(produtorId) as any;
	const carteira = db.prepare('SELECT instrumento, valor FROM carteira_krill WHERE produtor_id = ?').all(produtorId) as any[];

	const posicaoPorInstrumento: Record<string, number> = {};
	for (const c of carteira) {
		posicaoPorInstrumento[c.instrumento] = c.valor;
	}

	return {
		id: prod.id,
		cnpjCpf: prod.cnpj_cpf,
		nome: prod.nome,
		dataRegistroJunta: rel.data_registro_junta,
		escrituracaoLCDPR: rel.escrituracao_lcdpr === 1,
		areaPlantadaCAR: cap.area_plantada_car,
		produtividadeZarc: cap.produtividade_zarc,
		volumeComprometidoCPR: cap.volume_comprometido_cpr,
		possuiCPRFisica: cap.tem_cpr_fisica === 1,
		podeConstituirFiducia: extra.pode_constituir_fiducia === 1,
		riscoMoratoria: extra.risco_moratoria === 1,
		posicaoPorInstrumento
	};
}

export function salvarAvaliacao(
	db: Database.Database,
	produtorId: number,
	analise: {
		estadoCartaz: string;
		instrumentoNomeado: string | null;
		totalMorrem: number;
		totalSobrevivem: number;
		relogioSinal: boolean;
		relogioGrau: string;
		safraSinal: boolean;
		safraCoberturaOk: boolean;
		textoEspelho: string;
	}
): number {
	const r = db.prepare(
		`INSERT INTO avaliacoes (
			produtor_id, estado_cartaz, instrumento_nomeado,
			total_morrem, total_sobrevivem,
			relogio_sinal, relogio_grau,
			safra_sinal, safra_cobertura_ok,
			texto_espelho
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		produtorId,
		analise.estadoCartaz,
		analise.instrumentoNomeado,
		analise.totalMorrem,
		analise.totalSobrevivem,
		analise.relogioSinal ? 1 : 0,
		analise.relogioGrau,
		analise.safraSinal ? 1 : 0,
		analise.safraCoberturaOk ? 1 : 0,
		analise.textoEspelho
	);
	return Number(r.lastInsertRowid);
}

export function listarAvaliacoes(db: Database.Database, produtorId: number, limite = 10) {
	return db.prepare(
		'SELECT * FROM avaliacoes WHERE produtor_id = ? ORDER BY created_at DESC LIMIT ?'
	).all(produtorId, limite);
}
