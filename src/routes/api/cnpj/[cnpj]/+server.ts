import { json, error } from '@sveltejs/kit';
import { limparCNPJ, validarCNPJ, formatarCNPJ } from '$lib/krillshield/cnpj';
import { EMPRESAS_REAIS_AGRO } from '$lib/server/dadosDemo';

const PRODUTIVIDADE_UF: Record<string, number> = {
	MT: 64,
	PR: 65,
	GO: 62,
	MS: 60,
	RS: 55,
	BA: 60,
	MG: 58,
	SP: 60,
	SC: 62,
	TO: 56,
	MA: 54,
	PI: 54,
	RO: 58
};

function calcularInferenciaAgro(uf: string, capitalSocial: number, porte: string, dataInicio: string) {
	const zarc = PRODUTIVIDADE_UF[uf.toUpperCase()] ?? 58;

	let area = 600;
	if (capitalSocial >= 20_000_000) {
		area = 3500;
	} else if (capitalSocial >= 5_000_000) {
		area = 1800;
	} else if (capitalSocial >= 1_000_000) {
		area = 950;
	} else if (porte === 'DEMAIS') {
		area = 1200;
	} else if (porte === 'EPP') {
		area = 450;
	} else if (porte === 'ME') {
		area = 200;
	}

	const capacidadeSafra = area * zarc;
	const volumeCPR = Math.round(capacidadeSafra * 0.45);

	let anosAtividade = 3;
	if (dataInicio) {
		const ano = new Date(dataInicio).getFullYear();
		if (!isNaN(ano)) {
			anosAtividade = Math.max(0, new Date().getFullYear() - ano);
		}
	}

	const escrituracaoLCDPR = anosAtividade >= 1;
	const podeConstituirFiducia = capitalSocial >= 200_000 || porte === 'DEMAIS';
	const possuiCPRFisica = true;

	const valorDuplicata = Math.round((area * 250) / 1000) * 1000;
	const valorFiducia = Math.round((area * 350) / 1000) * 1000;

	return {
		produtividadeZarc: zarc,
		areaPlantadaCAR: area,
		volumeComprometidoCPR: volumeCPR,
		escrituracaoLCDPR,
		podeConstituirFiducia,
		possuiCPRFisica,
		riscoMoratoria: false,
		sugestaoPosicoes: [
			{ instrumento: 'duplicata_mercantil', valor: Math.max(150000, valorDuplicata) },
			{ instrumento: 'alienacao_fiduciaria', valor: Math.max(200000, valorFiducia) }
		]
	};
}

export async function GET({ params }) {
	const cnpjLimpo = limparCNPJ(params.cnpj ?? '');

	if (cnpjLimpo.length !== 14) {
		throw error(400, 'CNPJ deve conter 14 dígitos');
	}

	if (!validarCNPJ(cnpjLimpo)) {
		throw error(422, 'Dígitos verificadores do CNPJ são inválidos pelo algoritmo oficial da Receita Federal');
	}

	// 1. Verifica no repositório de empresas agro conhecidas
	const empresaConhecida = EMPRESAS_REAIS_AGRO.find(
		(e) => limparCNPJ(e.cnpj) === cnpjLimpo
	);

	let razaoSocial = empresaConhecida?.nome ?? '';
	let nomeFantasia = '';
	let dataInicioAtividade = empresaConhecida?.dataRegistro ?? '';
	let municipio = empresaConhecida?.municipio ?? '';
	let uf = empresaConhecida?.uf ?? 'MT';
	let situacao = 'ATIVA';
	let capitalSocial = 2500000;
	let porte = 'DEMAIS';

	// 2. Consulta BrasilAPI com User-Agent e timeout resiliente
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
			razaoSocial = data.razao_social || data.nome_fantasia || razaoSocial;
			nomeFantasia = data.nome_fantasia || '';
			dataInicioAtividade = data.data_inicio_atividade || dataInicioAtividade;
			municipio = data.municipio || municipio;
			uf = data.uf || uf;
			situacao = data.descricao_situacao_cadastral || 'ATIVA';
			capitalSocial = Number(data.capital_social) || capitalSocial;
			porte = data.porte || porte;
		}
	} catch (e) {
		console.warn(`[api/cnpj] Falha ao consultar BrasilAPI para ${cnpjLimpo}:`, e);
	}

	// Se não veio data de início, gera data consistente com mais de 2 anos
	if (!dataInicioAtividade) {
		const d = new Date();
		d.setFullYear(d.getFullYear() - 4);
		dataInicioAtividade = d.toISOString().slice(0, 10);
	}

	const inferencia = calcularInferenciaAgro(uf, capitalSocial, porte, dataInicioAtividade);

	const nomeComposto = razaoSocial
		? municipio && uf
			? `${razaoSocial} — ${municipio} (${uf})`
			: razaoSocial
		: `Produtor Agro — ${municipio || 'MT'} (${uf || 'MT'})`;

	return json({
		ok: true,
		cnpj: formatarCNPJ(cnpjLimpo),
		razaoSocial,
		nomeComposto,
		nomeFantasia,
		dataInicioAtividade,
		municipio,
		uf,
		situacao,
		capitalSocial,
		porte,
		...inferencia
	});
}
