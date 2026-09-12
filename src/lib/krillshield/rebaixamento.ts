import type { EstadoCartaz } from './types';

export type ZonaCarteira = 'SALVAVEL' | 'REBAIXAMENTO';

export interface ProdutorCarteira {
	id: number;
	cnpjCpf: string;
	nome: string;
	estado: EstadoCartaz;
	morrem: number;
	sobrevivem: number;
	instrumento: string | null;
}

export interface LinhaClassificacao extends ProdutorCarteira {
	posicao: number;
	zona: ZonaCarteira;
	taxaBlindagem: number;
	ultimoASalvar: boolean;
	primeiroRebaixado: boolean;
}

export interface ClassificacaoCarteira {
	ranking: LinhaClassificacao[];
	indiceCorte: number;
	posicaoCorte: number | null;
	totais: {
		salvaveis: number;
		rebaixados: number;
		alvoSalvamento: number;
		exposicaoSalvavel: number;
		blindadoSalvavel: number;
		presoSalvavel: number;
		exposicaoRebaixamento: number;
		presoRebaixamento: number;
	};
	ultimoASalvar: LinhaClassificacao | null;
	primeiroRebaixado: LinhaClassificacao | null;
}

const ORDEM_ESTADO: Record<EstadoCartaz, number> = {
	FIADO: 0,
	SÓ_EXTRACONCURSAL: 1,
	'À_VISTA': 2
};

export function zonaDe(estado: EstadoCartaz): ZonaCarteira {
	return estado === 'À_VISTA' ? 'REBAIXAMENTO' : 'SALVAVEL';
}

export function taxaBlindagem(morrem: number, sobrevivem: number): number {
	const total = morrem + sobrevivem;
	return total > 0 ? sobrevivem / total : 1;
}

export function classificarCarteira(produtores: ProdutorCarteira[]): ClassificacaoCarteira {
	const ordenados = [...produtores].sort((a, b) => {
		const ea = ORDEM_ESTADO[a.estado];
		const eb = ORDEM_ESTADO[b.estado];
		if (ea !== eb) return ea - eb;

		const ta = taxaBlindagem(a.morrem, a.sobrevivem);
		const tb = taxaBlindagem(b.morrem, b.sobrevivem);
		if (tb !== ta) return tb - ta;

		const expoA = a.morrem + a.sobrevivem;
		const expoB = b.morrem + b.sobrevivem;
		if (a.estado === 'À_VISTA' && a.morrem !== b.morrem) return a.morrem - b.morrem;
		if (expoB !== expoA) return expoB - expoA;
		return a.nome.localeCompare(b.nome, 'pt-BR');
	});

	const indiceCorte = ordenados.findIndex((p) => zonaDe(p.estado) === 'REBAIXAMENTO');
	const posicaoCorte = indiceCorte >= 0 ? indiceCorte + 1 : null;
	const idxUltimoSalvavel = indiceCorte > 0 ? indiceCorte - 1 : -1;

	const ranking: LinhaClassificacao[] = ordenados.map((p, i) => ({
		...p,
		posicao: i + 1,
		zona: zonaDe(p.estado),
		taxaBlindagem: taxaBlindagem(p.morrem, p.sobrevivem),
		ultimoASalvar: i === idxUltimoSalvavel && zonaDe(p.estado) === 'SALVAVEL' && indiceCorte >= 0,
		primeiroRebaixado: i === indiceCorte
	}));

	const salvaveis = ranking.filter((p) => p.zona === 'SALVAVEL');
	const rebaixados = ranking.filter((p) => p.zona === 'REBAIXAMENTO');

	const somar = (lista: LinhaClassificacao[], campo: 'morrem' | 'sobrevivem') =>
		lista.reduce((s, p) => s + p[campo], 0);

	return {
		ranking,
		indiceCorte,
		posicaoCorte,
		totais: {
			salvaveis: salvaveis.length,
			rebaixados: rebaixados.length,
			alvoSalvamento: salvaveis.filter((p) => p.estado === 'SÓ_EXTRACONCURSAL').length,
			exposicaoSalvavel: somar(salvaveis, 'morrem') + somar(salvaveis, 'sobrevivem'),
			blindadoSalvavel: somar(salvaveis, 'sobrevivem'),
			presoSalvavel: somar(salvaveis, 'morrem'),
			exposicaoRebaixamento: somar(rebaixados, 'morrem') + somar(rebaixados, 'sobrevivem'),
			presoRebaixamento: somar(rebaixados, 'morrem')
		},
		ultimoASalvar: ranking.find((p) => p.ultimoASalvar) ?? null,
		primeiroRebaixado: ranking.find((p) => p.primeiroRebaixado) ?? null
	};
}
