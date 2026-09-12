import { json } from '@sveltejs/kit';
import type { PerfilProdutor } from '$lib/krillshield/types';
import { getDb, buscarProdutorCompleto } from '$lib/server/db';
import { analisar } from '$lib/krillshield/engine';
import { redigirEspelho } from '$lib/krillshield/atendente';
import { salvarAvaliacao } from '$lib/server/db';

export async function POST({ request }) {
	const db = getDb();
	const body = await request.json();
	const produtorId = Number(body.produtorId);

	if (!produtorId || Number.isNaN(produtorId)) {
		return json({ error: 'produtorId inválido' }, { status: 400 });
	}

	const perfil: PerfilProdutor | null =
		body.perfil && typeof body.perfil === 'object'
			? { ...(body.perfil as PerfilProdutor), id: produtorId }
			: buscarProdutorCompleto(db, produtorId);

	if (!perfil) {
		return json({ error: 'Produtor não encontrado' }, { status: 404 });
	}

	const analise = analisar(perfil);
	analise.textoEspelho = redigirEspelho(analise);

	const avaliacaoId = salvarAvaliacao(db, produtorId, {
		estadoCartaz: analise.decisao.estado,
		instrumentoNomeado: analise.decisao.instrumentoNomeado,
		totalMorrem: analise.stay.totalMorrem,
		totalSobrevivem: analise.stay.totalSobrevivem,
		relogioSinal: analise.relogio.sinalRisco,
		relogioGrau: analise.relogio.grau,
		safraSinal: analise.safra.sinalRisco,
		safraCoberturaOk: analise.safra.coberturaOk,
		textoEspelho: analise.textoEspelho
	});

	return json({ avaliacaoId, ...analise });
}