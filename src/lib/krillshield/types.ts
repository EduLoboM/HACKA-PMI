export type Garantia =
	| 'duplicata_mercantil'
	| 'nota_promissoria'
	| 'penhor_agricola'
	| 'alienacao_fiduciaria'
	| 'cpr_fisica'
	| 'cpr_financeira';

export type EstadoCartaz = 'FIADO' | 'SÓ_EXTRACONCURSAL' | 'À_VISTA';
export type DestinoStay = 'morre' | 'sobrevive';
export type GrauRelogio = 'FORMALIZANDO' | 'ELEGIVEL_RJ' | 'ESTAVEL';

export const GARANTIAS: Record<
	Garantia,
	{ rotulo: string; destinoBase: DestinoStay; categoria: string; nota: string }
> = {
	duplicata_mercantil: {
		rotulo: 'Duplicata mercantil',
		destinoBase: 'morre',
		categoria: 'quirografário',
		nota: 'Quirografário sem garantia real — suspenso pelo stay (art. 6º, LREF)'
	},
	nota_promissoria: {
		rotulo: 'Nota promissória',
		destinoBase: 'morre',
		categoria: 'quirografário',
		nota: 'Quirografário — entra no stay'
	},
	penhor_agricola: {
		rotulo: 'Penhor agrícola',
		destinoBase: 'morre',
		categoria: 'penhor comum',
		nota: 'Garantia sem titularidade resolúvel — suspenso no stay'
	},
	alienacao_fiduciaria: {
		rotulo: 'Alienação fiduciária',
		destinoBase: 'sobrevive',
		categoria: 'extraconcursal',
		nota: 'Extraconcursal (art. 49, §3º, LREF) — titularidade resolúvel'
	},
	cpr_fisica: {
		rotulo: 'CPR física',
		destinoBase: 'sobrevive',
		categoria: 'extraconcursal',
		nota: 'Extraconcursal (Lei 8.929/1994) — desde que a área cubra o volume (Prov. 216)'
	},
	cpr_financeira: {
		rotulo: 'CPR financeira',
		destinoBase: 'morre',
		categoria: 'quirografário',
		nota: 'Quirografária — entra no stay'
	}
};

export const ESTADOS_CARTAZ: Record<
	EstadoCartaz,
	{ rotulo: string; cor: string; bg: string; borda: string; texto: string; icone: string }
> = {
	FIADO: {
		rotulo: 'NORMALIDADE',
		cor: 'emerald',
		bg: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/80 shadow-[0_1px_2px_rgba(16,185,129,0.06)]',
		borda: 'border-emerald-300',
		texto: 'text-emerald-800',
		icone: 'i-lucide-shield-check'
	},
	'SÓ_EXTRACONCURSAL': {
		rotulo: 'SÓ EXTRACONCURSAL',
		cor: 'amber',
		bg: 'bg-amber-500/10 text-amber-900 border-amber-300/80 shadow-[0_1px_2px_rgba(245,158,11,0.06)]',
		borda: 'border-amber-300',
		texto: 'text-amber-800',
		icone: 'i-lucide-shield-alert'
	},
	'À_VISTA': {
		rotulo: 'À VISTA',
		cor: 'rose',
		bg: 'bg-rose-500/10 text-rose-900 border-rose-300/80 shadow-[0_1px_2px_rgba(244,63,94,0.06)]',
		borda: 'border-rose-300',
		texto: 'text-rose-800',
		icone: 'i-lucide-shield-x'
	}
};

export interface PerfilProdutor {
	id: number;
	cnpjCpf: string;
	nome: string;
	dataRegistroJunta: string;
	escrituracaoLCDPR: boolean;
	areaPlantadaCAR: number;
	produtividadeZarc: number;
	volumeComprometidoCPR: number;
	possuiCPRFisica: boolean;
	podeConstituirFiducia: boolean;
	riscoMoratoria: boolean;
	posicaoPorInstrumento: Partial<Record<Garantia, number>>;
}

export interface ResultadoRelogio216 {
	sinalRisco: boolean;
	grau: GrauRelogio;
	tempoFormalizacaoMeses: number;
	lcdprOk: boolean;
	motivo: string;
}

export interface ResultadoSafraVsCpr {
	capacidadePeso: number;
	coberturaOk: boolean;
	sinalRisco: boolean;
	diferencaPeso: number;
	motivo: string;
}

export interface ItemStay {
	instrumento: Garantia;
	rotulo: string;
	valor: number;
	destinoFinal: DestinoStay;
	motivo: string;
}

export interface CalculoStay {
	morrem: ItemStay[];
	sobrevivem: ItemStay[];
	totalMorrem: number;
	totalSobrevivem: number;
	totalExposicao: number;
	desagio: number;
}

export interface DecisaoPoster {
	estado: EstadoCartaz;
	instrumentoNomeado: Garantia | null;
	instrumentoRotulo: string | null;
	razoes: string[];
	passo: number;
	sempreSim: boolean;
}

export interface RespostaIA {
	resumoExecutivo: string;
	recomendacoes: string[];
	restricoes: string[];
	orientacaoBalcao: string;
	fontesAuditadas?: {
		fonte: string;
		dado: string;
		status: 'ok' | 'alerta' | 'risco';
		descricao: string;
	}[];
	laudoFormatado?: string;
}

export type ClasseDegrau = 'Estrutural' | 'Reversível';

export interface Degrau {
	codigo: string;
	texto: string;
	classe: ClasseDegrau;
	valor: number;
	origemValor: string;
	provaExigida: string;
	responsavel: string | null;
	dataProva: string | null;
	ativo: boolean;
}

export interface AnaliseKrillShield {
	perfil: PerfilProdutor;
	relogio: ResultadoRelogio216;
	safra: ResultadoSafraVsCpr;
	stay: CalculoStay;
	decisao: DecisaoPoster;
	degraus: Degrau[];
	textoEspelho?: string;
	iaResposta?: RespostaIA;
}

export function formatarBRL(valor: number): string {
	return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function formatarNumero(valor: number): string {
	return new Intl.NumberFormat('pt-BR').format(valor);
}
