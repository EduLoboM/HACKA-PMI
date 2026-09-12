import { json, error } from '@sveltejs/kit';
import { exigeAuth } from '$lib/server/auth';

export async function POST({ request, locals }) {
	exigeAuth(locals);
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		throw error(400, 'Corpo inválido');
	}

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		return json({
			provedor: 'atendente-modelo',
			texto: 'Atendente de balcão em modo determinístico (API configurável via GEMINI_API_KEY).',
			payload
		});
	}

	const { laudoAtual, contexto } = payload as {
		laudoAtual?: string;
		contexto?: unknown;
	};

	try {
		const res = await fetch(
			'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `Você é a Atendente de Balcão do KrillShield. Reescreva o laudo executivo abaixo em texto fluente e cordial para o tomador de decisão do balcão (RTV), sem alterar nenhum dado financeiro, legal ou classificatório. Cada reestruturação deve respeitar integralmente as regras determinísticas já calculadas.
LAUDO ATUAL:
${laudoAtual ?? ''}`
								}
							]
						}
					]
				})
			}
		);

		if (!res.ok) {
			throw new Error(`Gemini HTTP ${res.status}`);
		}

		const data = await res.json();
		const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!texto) {
			return json({ provedor: 'atendente-modelo', texto: laudoAtual, payload });
		}

		return json({ provedor: 'gemini-free', texto });
	} catch (e) {
		console.error('[atendente] fallback para modelo determinístico:', e);
		return json({ provedor: 'atendente-modelo', texto: laudoAtual, payload });
	}
}