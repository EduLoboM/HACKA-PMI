import type {
	PerfilProdutor,
	AnaliseKrillShield,
	CalculoStay,
	DecisaoPoster,
	ItemStay,
	Garantia,
	DestinoStay,
	ResultadoRelogio216
} from './types';
import { GARANTIAS } from './types';
import { relogio216, safraVsCpr } from './rules';

function calcularStay(
	p: PerfilProdutor,
	sinalAtivo: boolean,
	safraCoberturaOk: boolean
): CalculoStay {
	const morrem: ItemStay[] = [];
	const sobrevivem: ItemStay[] = [];

	for (const [gStr, valor] of Object.entries(p.posicaoPorInstrumento)) {
		const g = gStr as Garantia;
		if (!valor || valor <= 0) continue;
		const meta = GARANTIAS[g];
		if (!meta) continue;

		let destino: DestinoStay;

		if (!sinalAtivo) {
			destino = 'sobrevive';
		} else if (g === 'cpr_fisica') {
			destino = safraCoberturaOk ? 'sobrevive' : 'morre';
		} else {
			destino = meta.destinoBase;
		}

		const item: ItemStay = {
			instrumento: g,
			rotulo: meta.rotulo,
			valor,
			destinoFinal: destino,
			motivo:
				destino === 'morre'
					? sinalAtivo
						? meta.nota
						: 'Último recurso — com lastro pleno não seria afetado'
					: destino === 'sobrevive' && g === 'cpr_fisica' && !safraCoberturaOk
						? 'Entrega inviável — risco de rebaixamento a quirografário'
						: meta.nota
		};

		if (destino === 'morre') {
			morrem.push(item);
		} else {
			sobrevivem.push(item);
		}
	}

	const totalMorrem = morrem.reduce((s, i) => s + i.valor, 0);
	const totalSobrevivem = sobrevivem.reduce((s, i) => s + i.valor, 0);
	const desagio = 0.30;

	return {
		morrem,
		sobrevivem,
		totalMorrem,
		totalSobrevivem,
		totalExposicao: totalMorrem + totalSobrevivem,
		desagio
	};
}

function decidirPoster(
	p: PerfilProdutor,
	relogio: ResultadoRelogio216['grau'],
	sinalRisco: boolean,
	safraCoberturaOk: boolean
): DecisaoPoster {
	if (p.riscoMoratoria) {
		return {
			estado: 'À_VISTA',
			instrumentoNomeado: null,
			instrumentoRotulo: null,
			razoes: ['Moratória judicial iminente detectada', 'Aguarda-se ajuizamento a qualquer momento'],
			passo: 3,
			sempreSim: true
		};
	}

	if (!sinalRisco) {
		return {
			estado: 'FIADO',
			instrumentoNomeado: 'duplicata_mercantil',
			instrumentoRotulo: 'Duplicata mercantil limpa',
			razoes: ['Sem sinais de preparação de insolvência', 'Lastro pleno demonstrado'],
			passo: 1,
			sempreSim: true
		};
	}

	const fiduciaPossivel = p.podeConstituirFiducia;
	const cprFisicaViavel = p.possuiCPRFisica && safraCoberturaOk;
	const temExtraconcursal = fiduciaPossivel || cprFisicaViavel;

	if (!temExtraconcursal) {
		return {
			estado: 'À_VISTA',
			instrumentoNomeado: null,
			instrumentoRotulo: null,
			razoes: [
				'Sem instrumento extraconcursal disponível',
				fiduciaPossivel ? '' : 'Alienação fiduciária não viável (sem máquinas/equipamentos para onerar)',
				cprFisicaViavel ? '' : 'CPR física com área insuficiente para volume'
			].filter(Boolean),
			passo: 3,
			sempreSim: true
		};
	}

	const instrumento: Garantia = fiduciaPossivel ? 'alienacao_fiduciaria' : 'cpr_fisica';
	const rotulo = GARANTIAS[instrumento].rotulo;

	const razoes = [
		`Sinais de risco detectados: Relógio 216 (${relogio})${safraCoberturaOk ? '' : ' + Safra vs CPR insuficiente'}`,
		`Instrumento prescrito: ${rotulo}`,
		'Lista de Compras: SEMPRE um SIM para Arbolina — venda não é bloqueada'
	];

	return {
		estado: 'SÓ_EXTRACONCURSAL',
		instrumentoNomeado: instrumento,
		instrumentoRotulo: rotulo,
		razoes,
		passo: 2,
		sempreSim: true
	};
}

export function analisar(p: PerfilProdutor): AnaliseKrillShield {
	const rel = relogio216(p);
	const saf = safraVsCpr(p);
	const sinalAtivo = rel.sinalRisco || saf.sinalRisco;
	const stay = calcularStay(p, sinalAtivo, saf.coberturaOk);
	const decisao = decidirPoster(p, rel.grau, sinalAtivo, saf.coberturaOk);

	return { perfil: p, relogio: rel, safra: saf, stay, decisao };
}
