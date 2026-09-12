import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { AnaliseKrillShield, RespostaIA } from '$lib/krillshield/types';
import { gerarRespostaPadrao } from '$lib/krillshield/atendente';

export async function POST({ request }) {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		throw error(400, 'Corpo inválido');
	}

	const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

	const { laudoAtual, contexto } = (payload ?? {}) as {
		laudoAtual?: string;
		contexto?: AnaliseKrillShield;
	};

	if (!apiKey) {
		const padrao = contexto ? gerarRespostaPadrao(contexto) : null;
		return json({
			provedor: 'atendente-modelo',
			respostaIA: padrao,
			texto: laudoAtual ?? padrao?.laudoFormatado ?? 'Modo determinístico ativo (GEMINI_API_KEY não configurada).'
		});
	}

	const promptInstrucao = `Você é a Consultora Executiva de Risco e Crédito Agro do KrillShield.
Sua missão é emitir um parecer de crédito consultivo, sofisticado e juridicamente preciso para o tomador de decisão (RTV / Gerente Comercial).

DIRETRIZES DE ESTILO E REGULATÓRIAS:
1. NUNCA utilize as palavras "FIADO" nem "ORDINÁRIO". Utilize sempre "NORMALIDADE", "Operação Regular", "Fluxo Padrão" ou "Crédito Padrão".
2. O motor determinístico já calculou as regras oficiais da LREF (Lei 11.101/2005) e Provimento 216/CNJ. Não altere valores em R$, área em ha, sacas nem a classificação do cartaz.
3. Adote um tom consultivo e profissional de comitê de crédito bancário:
   - Apresente diretrizes positivas como "Condições Operacionais Recomendadas".
   - Apresente salvaguardas e travas como "Salvaguardas & Pontos de Atenção Contratual" (evitando termos agressivos como 'vetos').
   - Deixe transparente a rastreabilidade das fontes (Junta Comercial, CAR/SICAR, ZARC/Embrapa, Registros de CPR e LREF).
   - Forneça uma orientação prática e cordial para a condução do relacionamento com o produtor rural no balcão.

CONTEXTO TÉCNICO:
${contexto ? JSON.stringify(contexto, null, 2) : laudoAtual ?? ''}

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem caracteres ou crases de markdown envolventes) com a seguinte estrutura:
{
  "resumoExecutivo": "Parecer executivo bem redigido e cordial avaliando a saúde financeira e o enquadramento do produtor.",
  "recomendacoes": [
    "Condição operacional recomendada 1 (o que favorece a operação com segurança)",
    "Condição operacional recomendada 2"
  ],
  "restricoes": [
    "Salvaguarda contratual mandatória 1 (ponto de atenção e exigência jurídica para mitigar risco)",
    "Salvaguarda contratual mandatória 2"
  ],
  "orientacaoBalcao": "Script consultivo e cordial para o RTV conduzir a conversa comercial de balcão.",
  "laudoFormatado": "Versão completa e elegante do laudo pericial técnico para fins de auditoria documental."
}`;

	const modelsToTry = [
		env.DEFAULT_MODEL || process.env.DEFAULT_MODEL,
		'gemini-3.6-flash',
		'gemini-3.5-flash-lite',
		'gemini-2.5-flash'
	].filter(Boolean) as string[];

	const uniqueModels = [...new Set(modelsToTry)];

	for (const model of uniqueModels) {
		try {
			const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': apiKey
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [{ text: promptInstrucao }]
						}
					],
					generationConfig: {
						responseMimeType: 'application/json',
						temperature: 0.2
					}
				})
			});

			if (!res.ok) {
				const errBody = await res.text().catch(() => '');
				console.warn(`[atendente] Modelo ${model} retornou HTTP ${res.status}: ${errBody}`);
				continue;
			}

			const data = await res.json();
			const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

			if (rawText) {
				let parsed: Partial<RespostaIA> | null = null;
				try {
					// Remove any accidental markdown fences if returned
					const cleaned = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
					parsed = JSON.parse(cleaned);
				} catch {
					parsed = null;
				}

				const basePadrao = contexto ? gerarRespostaPadrao(contexto) : null;

				const respostaFinal: RespostaIA = {
					resumoExecutivo: parsed?.resumoExecutivo || basePadrao?.resumoExecutivo || rawText,
					recomendacoes: Array.isArray(parsed?.recomendacoes) && parsed.recomendacoes.length > 0
						? parsed.recomendacoes
						: basePadrao?.recomendacoes || [],
					restricoes: Array.isArray(parsed?.restricoes) && parsed.restricoes.length > 0
						? parsed.restricoes
						: basePadrao?.restricoes || [],
					orientacaoBalcao: parsed?.orientacaoBalcao || basePadrao?.orientacaoBalcao || '',
					fontesAuditadas: basePadrao?.fontesAuditadas,
					laudoFormatado: parsed?.laudoFormatado || basePadrao?.laudoFormatado || rawText
				};

				return json({
					provedor: `gemini (${model})`,
					respostaIA: respostaFinal,
					texto: respostaFinal.laudoFormatado
				});
			}
		} catch (err) {
			console.warn(`[atendente] Erro ao consultar ${model}:`, err);
		}
	}

	const fallbackPadrao = contexto ? gerarRespostaPadrao(contexto) : null;
	return json({
		provedor: 'atendente-modelo',
		respostaIA: fallbackPadrao,
		texto: fallbackPadrao?.laudoFormatado ?? laudoAtual ?? 'Atendente em modo determinístico.'
	});
}