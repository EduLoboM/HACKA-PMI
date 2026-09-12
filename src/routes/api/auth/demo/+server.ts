import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { criarUsuario, iniciarSessao, type UsuarioAuth } from '$lib/server/auth';

const EMAIL_DEMO = 'demo@krillshield.com.br';

export async function POST({ cookies }) {
	const db = getDb();
	let u = db.prepare('SELECT id, nome, email FROM usuarios WHERE email = ?').get(EMAIL_DEMO) as
		| UsuarioAuth
		| undefined;

	if (!u) {
		const id = criarUsuario(db, 'Krill Demo', EMAIL_DEMO, 'krill123456');
		u = { id, nome: 'Krill Demo', email: EMAIL_DEMO };
	}

	iniciarSessao(db, cookies, u.id);
	return json({ ok: true, user: u });
}