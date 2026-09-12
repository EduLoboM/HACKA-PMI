import type { PerfilProdutor } from '$lib/krillshield/types';

const PREFIXOS = [
	'Fazenda',
	'Agropecuária',
	'Agro',
	'Grãos do',
	'Sementes',
	'Agrícola',
	'Comércio Agro',
	'Fazendas',
	'Cereais',
	'Agroindustrial'
];

const CIDADES = [
	'Sinop (MT)',
	'Sorriso (MT)',
	'Primavera do Leste (MT)',
	'Rondonópolis (MT)',
	'Campo Verde (MT)',
	'Rio Verde (GO)',
	'Jataí (GO)',
	'Cristalina (GO)',
	'Balsas (MA)',
	'Barreiras (BA)',
	'Luís Eduardo Magalhães (BA)',
	'Chapadão do Sul (MS)',
	'Sidrolândia (MS)',
	'Dourados (MS)',
	'Castro (PR)',
	'Carambeí (PR)',
	'Guarapuava (PR)',
	'Erechim (RS)',
	'Cruz Alta (RS)',
	'Tupanciretã (RS)'
];

function cnpj(i: number): string {
	const n = 10000000000000 + ((i * 9876543) % 9999999999999);
	const s = String(n).padStart(14, '0');
	return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12, 14)}`;
}

function dataAtras(anos: number, meses: number): string {
	const d = new Date();
	d.setFullYear(d.getFullYear() - anos);
	d.setMonth(d.getMonth() - meses);
	return d.toISOString().slice(0, 10);
}

function nome(i: number): string {
	const prefixo = PREFIXOS[(i * 3 + 1) % PREFIXOS.length];
	const cidade = CIDADES[(i * 7 + 3) % CIDADES.length];
	return `${prefixo} ${cidade} ${String(i).padStart(2, '0')}`;
}

function valor(i: number, base: number, passo = 50000): number {
	return base + (i % 8) * passo;
}

function verde(i: number): Omit<PerfilProdutor, 'id'> {
	const area = 800 + (i % 5) * 90;
	const zarc = 62 + (i % 3);
	const cap = area * zarc;
	return {
		cnpjCpf: cnpj(i),
		nome: nome(i),
		dataRegistroJunta: dataAtras(7 + (i % 4), 3),
		escrituracaoLCDPR: true,
		areaPlantadaCAR: area,
		produtividadeZarc: zarc,
		volumeComprometidoCPR: Math.round(cap * 0.55),
		possuiCPRFisica: true,
		podeConstituirFiducia: true,
		riscoMoratoria: false,
		posicaoPorInstrumento: {
			duplicata_mercantil: valor(i, 250000),
			cpr_fisica: valor(i, 80000, 20000)
		}
	};
}

function amareloFiducia(i: number): Omit<PerfilProdutor, 'id'> {
	const area = 600 + (i % 4) * 60;
	const zarc = 60;
	return {
		cnpjCpf: cnpj(i),
		nome: nome(i),
		dataRegistroJunta: dataAtras(0, 10 + (i % 7)),
		escrituracaoLCDPR: true,
		areaPlantadaCAR: area,
		produtividadeZarc: zarc,
		volumeComprometidoCPR: Math.round(area * zarc * 0.5),
		possuiCPRFisica: false,
		podeConstituirFiducia: true,
		riscoMoratoria: false,
		posicaoPorInstrumento: {
			duplicata_mercantil: valor(i, 280000),
			alienacao_fiduciaria: valor(i, 120000, 25000)
		}
	};
}

function amareloCpr(i: number): Omit<PerfilProdutor, 'id'> {
	const area = 800;
	const zarc = 60;
	return {
		cnpjCpf: cnpj(i),
		nome: nome(i),
		dataRegistroJunta: dataAtras(1, 2 + (i % 5)),
		escrituracaoLCDPR: true,
		areaPlantadaCAR: area,
		produtividadeZarc: zarc,
		volumeComprometidoCPR: Math.round(area * zarc * 0.5),
		possuiCPRFisica: true,
		podeConstituirFiducia: false,
		riscoMoratoria: false,
		posicaoPorInstrumento: {
			duplicata_mercantil: valor(i, 200000),
			cpr_fisica: valor(i, 150000, 30000)
		}
	};
}

function vermelhoMoratoria(i: number): Omit<PerfilProdutor, 'id'> {
	return {
		cnpjCpf: cnpj(i),
		nome: nome(i),
		dataRegistroJunta: dataAtras(0, 4 + (i % 3)),
		escrituracaoLCDPR: true,
		areaPlantadaCAR: 700,
		produtividadeZarc: 60,
		volumeComprometidoCPR: 40000,
		possuiCPRFisica: false,
		podeConstituirFiducia: false,
		riscoMoratoria: true,
		posicaoPorInstrumento: {
			duplicata_mercantil: valor(i, 300000),
			penhor_agricola: valor(i, 120000, 20000)
		}
	};
}

function vermelhoSemGarantia(i: number): Omit<PerfilProdutor, 'id'> {
	const area = 300 + (i % 2) * 50;
	return {
		cnpjCpf: cnpj(i),
		nome: nome(i),
		dataRegistroJunta: dataAtras(0, 5 + (i % 4)),
		escrituracaoLCDPR: false,
		areaPlantadaCAR: area,
		produtividadeZarc: 60,
		volumeComprometidoCPR: 40000,
		possuiCPRFisica: false,
		podeConstituirFiducia: false,
		riscoMoratoria: false,
		posicaoPorInstrumento: {
			nota_promissoria: valor(i, 180000),
			penhor_agricola: valor(i, 90000, 15000),
			duplicata_mercantil: valor(i, 100000, 10000)
		}
	};
}

export function gerarDemoProdutores(): Omit<PerfilProdutor, 'id'>[] {
	const lista: Omit<PerfilProdutor, 'id'>[] = [];
	let idx = 4;

	for (let i = 0; i < 54; i++) {
		const tipo = i % 3;
		let p: Omit<PerfilProdutor, 'id'>;
		if (tipo === 0) {
			p = verde(i);
		} else if (tipo === 1) {
			p = i % 2 === 0 ? amareloFiducia(i) : amareloCpr(i);
		} else {
			p = i % 2 === 0 ? vermelhoMoratoria(i) : vermelhoSemGarantia(i);
		}
		p.cnpjCpf = cnpj(idx);
		p.nome = nome(idx);
		idx++;
		lista.push(p);
	}

	return lista;
}