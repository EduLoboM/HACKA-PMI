import { json } from '@sveltejs/kit';
import type { PerfilProdutor } from '$lib/krillshield/types';
import { getDb, inserirProdutor, buscarProdutorCompleto } from '$lib/server/db';
import { exigeAuth } from '$lib/server/auth';

export async function GET({ locals }) {
	exigeAuth(locals);
	const db = getDb();
	const produtores = db.prepare('SELECT id, cnpj_cpf, nome FROM produtores ORDER BY id').all();
	return json({ produtores });
}

export async function POST({ request, locals }) {
	exigeAuth(locals);
	const db = getDb();
	const body = await request.json();

	if (!body?.nome || !body?.cnpjCpf) {
		return json({ error: 'nome e cnpjCpf são obrigatórios' }, { status: 400 });
	}

	const perfil = body as Omit<PerfilProdutor, 'id'>;
	try {
		const id = inserirProdutor(db, perfil);
		const criado = buscarProdutorCompleto(db, id);
		return json({ id, perfil: criado }, { status: 201 });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Erro ao criar produtor';
		const conflito = msg.includes('UNIQUE') ? 'CNPJ/CPF já cadastrado' : msg;
		return json({ error: conflito }, { status: 409 });
	}
}