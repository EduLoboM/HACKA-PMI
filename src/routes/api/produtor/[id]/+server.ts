import { json } from '@sveltejs/kit';
import type { PerfilProdutor } from '$lib/krillshield/types';
import {
	getDb,
	buscarProdutorCompleto,
	listarAvaliacoes,
	atualizarProdutor,
	inserirProdutor
} from '$lib/server/db';
import { exigeAuth } from '$lib/server/auth';

function preparar(body: unknown) {
	const b = body as Partial<PerfilProdutor>;
	return {
		nome: String(b.nome ?? ''),
		cnpjCpf: String(b.cnpjCpf ?? ''),
		dataRegistroJunta: String(b.dataRegistroJunta ?? new Date().toISOString().slice(0, 10)),
		escrituracaoLCDPR: Boolean(b.escrituracaoLCDPR),
		areaPlantadaCAR: Number(b.areaPlantadaCAR) || 0,
		produtividadeZarc: Number(b.produtividadeZarc) || 0,
		volumeComprometidoCPR: Number(b.volumeComprometidoCPR) || 0,
		possuiCPRFisica: Boolean(b.possuiCPRFisica),
		podeConstituirFiducia: Boolean(b.podeConstituirFiducia),
		riscoMoratoria: Boolean(b.riscoMoratoria),
		posicaoPorInstrumento: b.posicaoPorInstrumento ?? {}
	};
}

export async function GET({ params, locals }) {
	exigeAuth(locals);
	const db = getDb();
	const produtorId = Number(params.id);
	const perfil = buscarProdutorCompleto(db, produtorId);
	if (!perfil) return json({ error: 'Produtor não encontrado' }, { status: 404 });
	const avaliacoes = listarAvaliacoes(db, produtorId, 20);
	return json({ perfil, avaliacoes });
}

export async function PUT({ params, request, locals }) {
	exigeAuth(locals);
	const db = getDb();
	const produtorId = Number(params.id);
	const body = await request.json();
	if (!buscarProdutorCompleto(db, produtorId)) {
		return json({ error: 'Produtor não encontrado' }, { status: 404 });
	}
	const dados = preparar(body);
	atualizarProdutor(db, produtorId, dados);
	const perfil = buscarProdutorCompleto(db, produtorId);
	return json({ ok: true, id: produtorId, perfil });
}

export async function POST({ request, locals }) {
	exigeAuth(locals);
	const db = getDb();
	const body = await request.json();
	const dados = preparar(body);
	if (!dados.nome || !dados.cnpjCpf) {
		return json({ error: 'nome e cnpjCpf são obrigatórios' }, { status: 400 });
	}
	const id = inserirProdutor(db, dados);
	return json({ ok: true, id });
}

export async function DELETE({ params, locals }) {
	exigeAuth(locals);
	const db = getDb();
	const produtorId = Number(params.id);
	const r = db.prepare('DELETE FROM produtores WHERE id = ?').run(produtorId);
	if (r.changes === 0) return json({ error: 'Produtor não encontrado' }, { status: 404 });
	return json({ ok: true });
}