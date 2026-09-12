import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { criarUsuario, iniciarSessao } from '$lib/server/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request, cookies }) {
	const body = await request.json().catch(() => ({}));
	const nome = String(body?.nome ?? '').trim();
	const email = String(body?.email ?? '').trim().toLowerCase();
	const senha = String(body?.senha ?? '');

	if (!nome || !EMAIL_RE.test(email)) {
		return json({ error: 'Informe um nome e um e-mail válido.' }, { status: 400 });
	}
	if (senha.length < 6) {
		return json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
	}

	const db = getDb();
	const id = criarUsuario(db, nome, email, senha);
	iniciarSessao(db, cookies, id);

	return json({ ok: true, user: { id, nome, email } }, { status: 201 });
}