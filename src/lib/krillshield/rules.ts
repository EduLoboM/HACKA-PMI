import type {
	PerfilProdutor,
	ResultadoRelogio216,
	ResultadoSafraVsCpr,
	CalculoStay,
	Degrau
} from './types';

function mesesEntre(isoAntiga: string, isoAgora: string): number {
	const a = new Date(isoAntiga);
	const b = new Date(isoAgora);
	if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
	const ms = b.getTime() - a.getTime();
	return Math.round(ms / (1000 * 60 * 60 * 24 * 30.4375));
}

export function relogio216(p: PerfilProdutor, agora?: string): ResultadoRelogio216 {
	const ref = agora || new Date().toISOString();
	const meses = mesesEntre(p.dataRegistroJunta, ref);
	const anos = Math.round((meses / 12) * 10) / 10;
	const lcdpr = p.escrituracaoLCDPR;

	let grau: ResultadoRelogio216['grau'];
	let sinalRisco: boolean;

	if (meses < 24) {
		grau = 'FORMALIZANDO';
		sinalRisco = true;
	} else if (lcdpr) {
		grau = 'ELEGIVEL_RJ';
		sinalRisco = false;
	} else {
		grau = 'ESTAVEL';
		sinalRisco = false;
	}

	const motivos: string[] = [];
	if (grau === 'FORMALIZANDO') {
		motivos.push(`Inscrição na Junta há ${anos} anos (< 2 anos)`);
		motivos.push('Registro recente arma pedido futuro de RJ (art. 48, Lei 11.101/2005)');
	} else if (grau === 'ELEGIVEL_RJ') {
		motivos.push(`Inscrição há ${anos} anos + LCDPR escriturado`);
		motivos.push('Pré-requisitos formais atendidos — apto a requerer RJ (Tema 1.145 do STJ)');
		motivos.push('Sem movimento recente de formalização — sem sinal de preparação de insolvência');
	} else {
		motivos.push(`Inscrição há ${anos} anos, sem escrituração LCDPR ativa`);
		motivos.push('Pré-requisitos formais para RJ não plenamente verificados');
	}

	return { sinalRisco, grau, tempoFormalizacaoMeses: meses, lcdprOk: lcdpr, motivo: motivos.join('. ') };
}

export function safraVsCpr(p: PerfilProdutor): ResultadoSafraVsCpr {
	const capacidade = p.areaPlantadaCAR * p.produtividadeZarc;
	const coberturaOk = capacidade >= p.volumeComprometidoCPR;
	const diferenca = capacidade - p.volumeComprometidoCPR;

	const motivos: string[] = [];
	motivos.push(
		`Área CAR: ${p.areaPlantadaCAR} ha × ${p.produtividadeZarc} sc/ha = ${capacidade} sc`
	);
	motivos.push(`Volume comprometido em CPR: ${p.volumeComprometidoCPR} sc`);
	if (coberturaOk) {
		motivos.push(`Superávit de ${diferenca} sc — cobertura integral para entrega física`);
	} else {
		motivos.push(`Déficit de ${Math.abs(diferenca)} sc — área insuficiente para volume prometido`);
		motivos.push('CPR física perde proteção extraconcursal (Prov. CNJ nº 216/2026)');
	}

	return {
		capacidadePeso: capacidade,
		coberturaOk,
		sinalRisco: !coberturaOk,
		diferencaPeso: diferenca,
		motivo: motivos.join('. ')
	};
}

const PENDENCIA_DOC_NAO_MENSURAVEL =
	'Ausência de prova — sem exposição mensurável em R$ até o instrumento ser lançado no sistema';

/**
 * Penalidades de informação ausente (DOC-01..DOC-05).
 * Aplicadas no ato do cadastro — zeradas por prova documental datada
 * com responsável nomeado. Nunca verificação automática.
 */
export function verificarFaltasDocumentais(
	p: PerfilProdutor,
	grauRelogio: ResultadoRelogio216['grau']
): Degrau[] {
	const carteiraVazia = Object.values(p.posicaoPorInstrumento).every((v) => !v || v <= 0);

	const faltas: Degrau[] = [
		{
			codigo: 'DOC-01',
			texto: 'Escrituração LCDPR do exercício não apresentada',
			classe: 'Reversível',
			valor: 0,
			origemValor: PENDENCIA_DOC_NAO_MENSURAVEL,
			provaExigida: 'Escrituração do exercício entregue ao Balconista',
			responsavel: null,
			dataProva: null,
			ativo: !p.escrituracaoLCDPR
		},
		{
			codigo: 'DOC-02',
			texto: 'Inscrição na Junta Comercial não comprovada pela carteira',
			classe: 'Reversível',
			valor: 0,
			origemValor: PENDENCIA_DOC_NAO_MENSURAVEL,
			provaExigida: 'Certidão da Junta Comercial arquivada na carteira',
			responsavel: null,
			dataProva: null,
			ativo: grauRelogio === 'FORMALIZANDO'
		},
		{
			codigo: 'DOC-03',
			texto: 'CAR não informado ou sem área consolidada',
			classe: 'Reversível',
			valor: 0,
			origemValor: PENDENCIA_DOC_NAO_MENSURAVEL,
			provaExigida: 'Recibo do CAR com área consolidada confirmada',
			responsavel: null,
			dataProva: null,
			ativo: p.areaPlantadaCAR <= 0
		},
		{
			codigo: 'DOC-04',
			texto: 'Cultura, volume e data de plantio não declarados',
			classe: 'Reversível',
			valor: 0,
			origemValor: PENDENCIA_DOC_NAO_MENSURAVEL,
			provaExigida: 'Declaração do RTV em visita (cultura, volume, data de plantio)',
			responsavel: null,
			dataProva: null,
			ativo: p.volumeComprometidoCPR <= 0
		},
		{
			codigo: 'DOC-05',
			texto: 'Instrumento contratual atual não registrado na carteira',
			classe: 'Reversível',
			valor: 0,
			origemValor: PENDENCIA_DOC_NAO_MENSURAVEL,
			provaExigida: 'Contrato lançado no sistema (Carteira Krill)',
			responsavel: null,
			dataProva: null,
			ativo: carteiraVazia
		}
	];

	return faltas;
}

/**
 * Monta a lista completa de degraus: DOC (reversíveis) + estruturais + reversíveis
 * de risco. Cada degrau carrega código, texto, classe, valor (origem do valor em R$ Stay),
 * prova exigida, responsável e data (declarados na tela — nunca verificação automática).
 */
export function montarDegraus(
	perfil: PerfilProdutor,
	relogio: ResultadoRelogio216,
	safra: ResultadoSafraVsCpr,
	stay: CalculoStay
): Degrau[] {
	const doc = verificarFaltasDocumentais(perfil, relogio.grau);

	const temFiducia = perfil.podeConstituirFiducia;
	const temCprFisica = perfil.possuiCPRFisica;
	const coberturaOk = safra.coberturaOk;
	const cprFisicaCoberta = temCprFisica && coberturaOk;
	const valorCprFisica = perfil.posicaoPorInstrumento.cpr_fisica ?? 0;
	const temExtraconcursal = temFiducia || cprFisicaCoberta;
	const totalMorrem = stay.totalMorrem;
	const totalExposicao = stay.totalExposicao;

	/**
	 * Reversíveis — instrumento / cobertura
	 * ==============================
	 */
	const reversiveis: Degrau[] = [
		// SAF-01: Déficit de cobertura CPR × Safra
		{
			codigo: 'SAF-01',
			texto: 'Déficit de cobertura entre volume CPR e capacidade da safra (área × produtividade ZARC)',
			classe: 'Reversível',
			valor: safra.sinalRisco ? valorCprFisica : 0,
			origemValor: safra.sinalRisco
				? `Posição cpr_fisica (${valorCprFisica.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) rebaixada a quirografário pelo déficit — resolve com área auditada que cubra o volume`
				: 'Sem exposição em CPR física pendente',
			provaExigida: 'CPR física com área auditada que cubra o volume, OU plantio na janela ZARC certificada na safra seguinte',
			responsavel: null,
			dataProva: null,
			ativo: safra.sinalRisco
		},
		// MAU-INSTR: Aditivo de alienação fiduciária (degrau mais pesado)
		{
			codigo: 'MAU-INSTR',
			texto: 'Troca de instrumento — aditivo de alienação fiduciária ou CPR física com área auditada',
			classe: 'Reversível',
			valor: totalMorrem,
			origemValor: totalMorrem > 0
				? `Coluna que morre hoje (${totalMorrem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}): o aditivo move exatamente este valor para a coluna que sobrevive (regra do degrau: retorna sem arbitrar)`
				: 'Sem exposição quirografária — degrau sem efeito',
			provaExigida: 'Aditivo de alienação fiduciária registrado, OU CPR física com área auditada (quando a cobertura permitir)',
			responsavel: null,
			dataProva: null,
			ativo: totalMorrem > 0 && temFiducia && !perfil.riscoMoratoria
		}
	];

	/**
	 * Estruturais — não sobem por comportamento, fato consumado ou tempo
	 * ==============================
	 */
	const estruturais: Degrau[] = [
		{
			codigo: 'REL-216-F',
			texto: 'Formalização recente — tempo de inscrição na Junta Comercial inferior a 2 anos',
			classe: 'Estrutural',
			valor: totalExposicao,
			origemValor: `Exposição total da carteira (${totalExposicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) mantida sob o cartaz enquanto o tempo não passa — não se negocia no balcão`,
			provaExigida: 'Não se aplica — tempo não é ato verificável',
			responsavel: null,
			dataProva: null,
			ativo: relogio.grau === 'FORMALIZANDO'
		},
		{
			codigo: 'REL-216-L',
			texto: 'Pré-requisitos formais da RJ rural não atendidos (2 exercícios de LCDPR + mais de 2 anos de Junta)',
			classe: 'Estrutural',
			valor: totalExposicao,
			origemValor: `Exposição total da carteira (${totalExposicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) mantida sob o cartaz — fato consumado de formalização incompleta`,
			provaExigida: 'Não se aplica — cumprimento de tempo não é ato verificável no balcão',
			responsavel: null,
			dataProva: null,
			ativo: relogio.grau === 'ESTAVEL'
		},
		{
			codigo: 'MORAT-RISK',
			texto: 'Moratória judicial iminente — situação cadastral ou distribuição de RJ/falência que já contamina o cartaz',
			classe: 'Estrutural',
			valor: totalExposicao,
			origemValor: `Exposição total da carteira (${totalExposicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) afetada pelo risco estrutural — não se resolve no balcão`,
			provaExigida: 'Não se aplica — fato consumado de risco estrutural',
			responsavel: null,
			dataProva: null,
			ativo: perfil.riscoMoratoria
		}
	];

	return [...estruturais, ...reversiveis, ...doc];
}