import { redirect } from '@sveltejs/kit';
import { getDb, buscarProdutorCompleto } from '$lib/server/db';
import { ensureSeeded } from '$lib/server/seed';
import { analisar } from '$lib/krillshield/engine';

export async function load({ locals }) {
	if (!locals.user) throw redirect(303, '/login');

	const db = getDb();
	ensureSeeded(db);

	const rows = db
		.prepare('SELECT id FROM produtores ORDER BY id')
		.all() as { id: number }[];

	const linhas = rows
		.map((r) => {
			const perfil = buscarProdutorCompleto(db, r.id);
			if (!perfil) return null;
			const a = analisar(perfil);
			return {
				id: r.id,
				cnpjCpf: perfil.cnpjCpf,
				nome: perfil.nome,
				estado: a.decisao.estado,
				morrem: a.stay.totalMorrem,
				sobrevivem: a.stay.totalSobrevivem,
				instrumento: a.decisao.instrumentoRotulo
			};
		})
		.filter((x): x is NonNullable<typeof x> => x !== null);

	const produtores = linhas;

	const resumo = {
		FIADO: produtores.filter((p) => p.estado === 'FIADO').length,
		'SÓ_EXTRACONCURSAL': produtores.filter((p) => p.estado === 'SÓ_EXTRACONCURSAL').length,
		'À_VISTA': produtores.filter((p) => p.estado === 'À_VISTA').length
	};

	return { produtores, resumo, user: locals.user };
}