import type {
	PerfilProdutor,
	AnaliseKrillShield,
	CalculoStay,
	DecisaoPoster,
	ItemStay,
	Garantia,
	DestinoStay,
	ResultadoRelogio216,
	Degrau
} from './types';
import { GARANTIAS } from './types';
import { relogio216, safraVsCpr, montarDegraus, verificarFaltasDocumentais } from './rules';

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

		if (g === 'cpr_fisica') {
			// CPR física só sobrevive se a área/produtividade ZARC cobrir o volume prometido (Prov. CNJ 216/2026)
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
					? g === 'cpr_fisica' && !safraCoberturaOk
						? 'Déficit de lavoura ZARC — perda de extraconcursalidade e rebaixamento a quirografário (Prov. 216)'
						: meta.nota
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
	safraCoberturaOk: boolean,
	faltasDocAtivas: Degrau[]
): DecisaoPoster {
	const fiduciaPossivel = p.podeConstituirFiducia;
	const cprFisicaViavel = p.possuiCPRFisica && safraCoberturaOk;
	const temExtraconcursal = fiduciaPossivel || cprFisicaViavel;

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

	// Ausência de prova não é boa conduta: pendência documental bloqueia FIADO até entregar.
	// Cliente novo não abre FIADO "de graça" — abre SÓ EXTRACONCURSAL enquanto a prova não chega.
	if (faltasDocAtivas.length > 0) {
		const codigos = faltasDocAtivas.map((d) => d.codigo).join(', ');
		const razoes = [
			`Pendências documentais em aberto: ${codigos}`,
			'Cadastro sem prova documental completa — FIADO exige lastro comprovado'
		];

		if (!temExtraconcursal) {
			return {
				estado: 'À_VISTA',
				instrumentoNomeado: null,
				instrumentoRotulo: null,
				razoes: [
					...razoes,
					'Sem instrumento extraconcursal disponível enquanto a documentação não é entregue'
				],
				passo: 2,
				sempreSim: true
			};
		}

		const instrumento: Garantia = fiduciaPossivel ? 'alienacao_fiduciaria' : 'cpr_fisica';
		return {
			estado: 'SÓ_EXTRACONCURSAL',
			instrumentoNomeado: instrumento,
			instrumentoRotulo: GARANTIAS[instrumento].rotulo,
			razoes: [...razoes, `Crédito liberado apenas com ${GARANTIAS[instrumento].rotulo} até a prova ser entregue`],
			passo: 2,
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
	const faltasDocAtivas = verificarFaltasDocumentais(p, rel.grau).filter((d) => d.ativo);
	const sinalAtivo =
		rel.sinalRisco || saf.sinalRisco || faltasDocAtivas.length > 0 || p.riscoMoratoria;
	const stay = calcularStay(p, sinalAtivo, saf.coberturaOk);
	const degraus = montarDegraus(p, rel, saf, stay);
	const decisao = decidirPoster(p, rel.grau, sinalAtivo, saf.coberturaOk, faltasDocAtivas);

	return { perfil: p, relogio: rel, safra: saf, stay, decisao, degraus };
}
