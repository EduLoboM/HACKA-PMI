import type { PerfilProdutor, ResultadoRelogio216, ResultadoSafraVsCpr } from './types';

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
