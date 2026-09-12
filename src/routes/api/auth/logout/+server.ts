import { json } from '@sveltejs/kit';
import { encerrarSessao } from '$lib/server/auth';

export async function POST({ cookies }) {
	encerrarSessao(cookies);
	return json({ ok: true });
}