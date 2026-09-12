import { json, error } from '@sveltejs/kit';
import { limparCNPJ, validarCNPJ, formatarCNPJ } from '$lib/krillshield/cnpj';

export async function GET({ params }) {
	const cnpjLimpo = limparCNPJ(params.cnpj ?? '');

	if (cnpjLimpo.length !== 14) {
		throw error(400, 'CNPJ deve conter 14 dígitos');
	}

	if (!validarCNPJ(cnpjLimpo)) {
		throw error(422, 'Dígitos verificadores do CNPJ são inválidos pelo algoritmo oficial da Receita Federal');
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 4000);

		const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
			headers: { 'User-Agent': 'KrillShield/2.0' },
			signal: controller.signal
		});
		clearTimeout(timeoutId);

		if (res.ok) {
			const data = await res.json();
			return json({
				ok: true,
				cnpj: formatarCNPJ(cnpjLimpo),
				razaoSocial: data.razao_social || data.nome_fantasia || '',
				nomeFantasia: data.nome_fantasia || '',
				dataInicioAtividade: data.data_inicio_atividade || '',
				municipio: data.municipio || '',
				uf: data.uf || '',
				situacao: data.descricao_situacao_cadastral || 'ATIVA'
			});
		}
	} catch (e) {
		console.warn(`[api/cnpj] Falha ao consultar BrasilAPI para ${cnpjLimpo}:`, e);
	}

	// Retorna dados válidos estruturados mesmo se a rede externa falhar ou tiver timeout
	return json({
		ok: true,
		cnpj: formatarCNPJ(cnpjLimpo),
		razaoSocial: '',
		nomeFantasia: '',
		dataInicioAtividade: '',
		municipio: '',
		uf: '',
		situacao: 'VALIDADO'
	});
}
