import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { semearDatabase } from '$lib/server/seed';

export async function POST({ request }) {
	const db = getDb();
	let force = false;
	try {
		const body = await request.json().catch(() => ({}));
		force = body?.force === true;
	} catch {
		force = false;
	}

	semearDatabase(db, force);

	const produtores = db.prepare('SELECT id, cnpj_cpf, nome FROM produtores ORDER BY id').all();
	return json({ ok: true, total: produtores.length, produtores });
}