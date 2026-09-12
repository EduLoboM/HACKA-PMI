import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { autenticarUsuario, iniciarSessao } from '$lib/server/auth';

export async function POST({ request, cookies }) {
	const body = await request.json().catch(() => ({}));
	const email = String(body?.email ?? '').trim().toLowerCase();
	const senha = String(body?.senha ?? '');

	if (!email || !senha) {
		return json({ error: 'Informe e-mail e senha.' }, { status: 400 });
	}

	const db = getDb();
	const user = autenticarUsuario(db, email, senha);
	if (!user) {
		return json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
	}

	iniciarSessao(db, cookies, user.id);
	return json({ ok: true, user });
}