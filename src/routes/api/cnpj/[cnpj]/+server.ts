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

function calcularInferenciaAgro(
	cnpjLimpo: string,
	uf: string,
	capitalSocial: number,
	porte: string,
	dataInicio: string
) {
	const zarc = PRODUTIVIDADE_UF[uf.toUpperCase()] ?? 58;

	// Micro-variação determinística baseada na soma ponderada dos dígitos do CNPJ
	const seed = cnpjLimpo.split('').reduce((acc, c, idx) => acc + parseInt(c, 10) * (idx * 3 + 7), 0);

	// Área estimada do CAR baseada no porte e capital social
	let areaBase = 600;
	if (capitalSocial >= 50_000_000) {
		areaBase = 3800;
	} else if (capitalSocial >= 10_000_000) {
		areaBase = 2200;
	} else if (capitalSocial >= 2_000_000) {
		areaBase = 1200;
	} else if (capitalSocial >= 500_000) {
		areaBase = 700;
	} else if (porte === 'DEMAIS') {
		areaBase = 1100;
	} else if (porte === 'EPP') {
		areaBase = 450;
	} else if (porte === 'ME') {
		areaBase = 200;
	}

	const fatorArea = 0.85 + (seed % 31) * 0.01; // 0.85 a 1.15
	const area = Math.round((areaBase * fatorArea) / 10) * 10;

	const capacidadeSafra = area * zarc;
	const fatorComprometimento = 0.38 + (seed % 6) * 0.03; // 38% a 53%
	const volumeCPR = Math.round(capacidadeSafra * fatorComprometimento);

	let anosAtividade = 4;
	if (dataInicio) {
		const ano = new Date(dataInicio).getFullYear();
		if (!isNaN(ano)) {
			anosAtividade = Math.max(0, new Date().getFullYear() - ano);
		}
	}

	const escrituracaoLCDPR = anosAtividade >= 1;
	const podeConstituirFiducia = capitalSocial >= 150_000 || porte === 'DEMAIS';
	const possuiCPRFisica = true;

	// Valor total da exposição de crédito estimado para a safra do produtor
	const exposicaoTotal = Math.max(
		250000,
		Math.round((area * (500 + (seed % 7) * 40)) / 10000) * 10000
	);

	// Alocação realista e contínua de taxa de blindagem (entre 35% e 85%)
	// Produtores maiores / corporativos contam com garantias reais mais estruturadas
	let taxaPretendida = 0.52;
	if (capitalSocial >= 20_000_000) {
		taxaPretendida = 0.72 + (seed % 14) * 0.01; // 72% a 85%
	} else if (capitalSocial >= 2_000_000) {
		taxaPretendida = 0.58 + (seed % 15) * 0.01; // 58% a 72%
	} else if (capitalSocial >= 500_000) {
		taxaPretendida = 0.45 + (seed % 15) * 0.01; // 45% a 59%
	} else {
		taxaPretendida = 0.34 + (seed % 14) * 0.01; // 34% a 47%
	}

	const valorSobrevive = Math.max(
		100000,
		Math.round((exposicaoTotal * taxaPretendida) / 10000) * 10000
	);
	const valorMorre = Math.max(
		80000,
		exposicaoTotal - valorSobrevive
	);

	const sugestaoPosicoes: { instrumento: string; valor: number }[] = [
		{ instrumento: 'duplicata_mercantil', valor: valorMorre }
	];

	// Divide a garantia extraconcursal entre Alienação Fiduciária e CPR Física se a empresa for grande
	if (area >= 1200 && (seed % 2 === 0)) {
		const parteCpr = Math.round((valorSobrevive * 0.4) / 10000) * 10000;
		const parteFiducia = valorSobrevive - parteCpr;
		sugestaoPosicoes.push({ instrumento: 'alienacao_fiduciaria', valor: parteFiducia });
		sugestaoPosicoes.push({ instrumento: 'cpr_fisica', valor: parteCpr });
	} else {
		sugestaoPosicoes.push({ instrumento: 'alienacao_fiduciaria', valor: valorSobrevive });
	}

	return {
		produtividadeZarc: zarc,
		areaPlantadaCAR: area,
		volumeComprometidoCPR: volumeCPR,
		escrituracaoLCDPR,
		podeConstituirFiducia,
		possuiCPRFisica,
		riscoMoratoria: false,
		sugestaoPosicoes
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

	const inferencia = calcularInferenciaAgro(cnpjLimpo, uf, capitalSocial, porte, dataInicioAtividade);

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
