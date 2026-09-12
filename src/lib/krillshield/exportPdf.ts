import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarBRL, ESTADOS_CARTAZ, type EstadoCartaz } from './types';

export interface DadosRelatorioAdmin {
	kpis: {
		totalEmpresas: number;
		totalGeral: number;
		totalSobrevivem: number;
		totalMorrem: number;
		taxaBlindagemGlobal: number;
		perdaPrevistaDesagio: number;
		recuperacaoProvavel: number;
	};
	instrumentos: Array<{
		instrumento?: string;
		garantia?: string;
		rotulo: string;
		categoria: string;
		destinoBase: string;
		quantidadeOcorrencias: number;
		totalValor: number;
		percentualCarteira: number;
	}>;
	topRiscoStay: Array<{
		id: number;
		nome: string;
		cnpjCpf: string;
		morrem: number;
		estado: string;
	}>;
	historico: Array<{
		createdAt: string;
		nome: string;
		cnpjCpf: string;
		estadoCartaz: string;
		totalMorrem: number;
		totalSobrevivem: number;
	}>;
}

export function exportarRelatorioAdminPDF(dados: DadosRelatorioAdmin): void {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const dataEmissao = new Date().toLocaleString('pt-BR');

	// --- CABEÇALHO CORPORATIVO ---
	doc.setFillColor(15, 23, 42); // slate-900
	doc.rect(14, 12, 182, 22, 'F');

	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	doc.text('KRILL SHIELD · DOSSIÊ EXECUTIVO DE RISCO AGRO', 20, 21);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(203, 213, 225); // slate-300
	doc.text('CONSOLIDAÇÃO FINANCEIRA GLOBAL & EXPOSIÇÃO AO STAY PERIOD (LREF 11.101/05 & CNJ 216/26)', 20, 28);

	// Metadados do Relatório
	doc.setTextColor(71, 85, 105); // slate-600
	doc.setFontSize(8);
	doc.setFont('helvetica', 'normal');
	doc.text(`Emitido em: ${dataEmissao} | Destinatário: Comitê de Crédito e CFO | Base: ${dados.kpis.totalEmpresas} Empresas Auditadas`, 14, 40);

	// --- SEÇÃO 1: RESUMO EXECUTIVO (KPIS) ---
	autoTable(doc, {
		startY: 44,
		theme: 'plain',
		styles: {
			font: 'helvetica',
			fontSize: 8.5,
			cellPadding: 3,
			lineColor: [226, 232, 240],
			lineWidth: 0.2
		},
		head: [
			[
				'CARTEIRA TOTAL',
				'CRÉDITOS BLINDADOS',
				'PRESOS NO STAY',
				'HAIRCUT 30% (PERDA)',
				'RECUPERAÇÃO PROVÁVEL'
			]
		],
		body: [
			[
				formatarBRL(dados.kpis.totalGeral),
				`${formatarBRL(dados.kpis.totalSobrevivem)}\n(${dados.kpis.taxaBlindagemGlobal.toFixed(1)}% Extraconcursal)`,
				`${formatarBRL(dados.kpis.totalMorrem)}\n(${(100 - dados.kpis.taxaBlindagemGlobal).toFixed(1)}% Concursal)`,
				formatarBRL(dados.kpis.perdaPrevistaDesagio),
				formatarBRL(dados.kpis.recuperacaoProvavel)
			]
		],
		headStyles: {
			fillColor: [241, 245, 249],
			textColor: [15, 23, 42],
			fontStyle: 'bold',
			halign: 'center'
		},
		columnStyles: {
			0: { halign: 'center', fontStyle: 'bold' },
			1: { halign: 'center', textColor: [4, 120, 87], fontStyle: 'bold' }, // emerald-700
			2: { halign: 'center', textColor: [190, 18, 60], fontStyle: 'bold' }, // rose-700
			3: { halign: 'center', textColor: [100, 116, 139] },
			4: { halign: 'center', textColor: [15, 23, 42], fontStyle: 'bold' }
		}
	});

	// --- SEÇÃO 2: BALANÇO POR INSTRUMENTO JURÍDICO ---
	let yAtual = (doc as any).lastAutoTable.finalY + 8;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.setTextColor(15, 23, 42);
	doc.text('1. BALANÇO CONSOLIDADO POR INSTRUMENTO JURÍDICO', 14, yAtual);

	const linhasInstrumentos = dados.instrumentos.map((i) => [
		i.rotulo,
		i.categoria,
		i.destinoBase === 'sobrevive' ? 'Sobrevive (Extraconcursal)' : 'Suspenso no Stay (Concursal)',
		String(i.quantidadeOcorrencias),
		formatarBRL(i.totalValor),
		`${i.percentualCarteira.toFixed(1)}%`
	]);

	autoTable(doc, {
		startY: yAtual + 3,
		head: [['Instrumento', 'Categoria', 'Eficácia no Stay', 'Contratos', 'Volume Total (R$)', '% Carteira']],
		body: linhasInstrumentos,
		theme: 'striped',
		styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
		headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
		columnStyles: {
			0: { fontStyle: 'bold' },
			2: { fontStyle: 'bold' },
			3: { halign: 'right' },
			4: { halign: 'right', fontStyle: 'bold' },
			5: { halign: 'right' }
		}
	});

	// --- SEÇÃO 3: TOP CONCENTRAÇÕES DE RISCO NO STAY ---
	yAtual = (doc as any).lastAutoTable.finalY + 8;
	if (yAtual > 230) {
		doc.addPage();
		yAtual = 18;
	}

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.setTextColor(15, 23, 42);
	doc.text('2. TOP 10 CONCENTRAÇÃO DE RISCO NO STAY PERIOD (Créditos Quirografários)', 14, yAtual);

	const linhasTopRisco = dados.topRiscoStay.map((r, idx) => [
		`${idx + 1}º`,
		r.nome,
		r.cnpjCpf,
		ESTADOS_CARTAZ[r.estado as EstadoCartaz]?.rotulo ?? r.estado,
		formatarBRL(r.morrem)
	]);

	autoTable(doc, {
		startY: yAtual + 3,
		head: [['#', 'Empresa / Produtor', 'CNPJ / CPF', 'Cartaz Regulatório', 'Retido no Stay (R$)']],
		body: linhasTopRisco.length > 0 ? linhasTopRisco : [['-', 'Nenhum risco concursal identificado', '-', '-', 'R$ 0,00']],
		theme: 'striped',
		styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
		headStyles: { fillColor: [159, 18, 57], textColor: [255, 255, 255], fontStyle: 'bold' }, // rose-800
		columnStyles: {
			0: { halign: 'center', fontStyle: 'bold', cellWidth: 10 },
			1: { fontStyle: 'bold' },
			3: { halign: 'center' },
			4: { halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] }
		}
	});

	// --- SEÇÃO 4: HISTÓRICO CRONOLÓGICO DE AUDITORIAS (LIVRO-RAZÃO) ---
	yAtual = (doc as any).lastAutoTable.finalY + 8;
	if (yAtual > 230) {
		doc.addPage();
		yAtual = 18;
	}

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10);
	doc.setTextColor(15, 23, 42);
	doc.text('3. LIVRO-RAZÃO & HISTÓRICO DE AUDITORIAS (Últimos Registros)', 14, yAtual);

	const linhasHistorico = dados.historico.slice(0, 50).map((h) => [
		h.createdAt,
		h.nome,
		h.cnpjCpf,
		ESTADOS_CARTAZ[h.estadoCartaz as EstadoCartaz]?.rotulo ?? h.estadoCartaz,
		formatarBRL(h.totalMorrem),
		formatarBRL(h.totalSobrevivem)
	]);

	autoTable(doc, {
		startY: yAtual + 3,
		head: [['Data / Hora', 'Empresa Auditada', 'CNPJ', 'Cartaz', 'R$ no Stay', 'R$ Blindado']],
		body:
			linhasHistorico.length > 0
				? linhasHistorico
				: [['—', 'Nenhuma auditoria gravada na base', '—', '—', '—', '—']],
		theme: 'striped',
		styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
		headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
		columnStyles: {
			0: { cellWidth: 32 },
			1: { fontStyle: 'bold' },
			3: { halign: 'center' },
			4: { halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] },
			5: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] }
		}
	});

	// --- RODAPÉ EM TODAS AS PÁGINAS ---
	const totalPaginas = (doc as any).internal.getNumberOfPages();
	for (let p = 1; p <= totalPaginas; p++) {
		doc.setPage(p);
		doc.setDrawColor(203, 213, 225);
		doc.line(14, 285, 196, 285);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(7.5);
		doc.setTextColor(100, 116, 139);
		doc.text('KrillShield · Terminal de Risco de Crédito Agro — Documento Confidencial e Auditável', 14, 290);
		doc.text(`Página ${p} de ${totalPaginas}`, 196, 290, { align: 'right' });
	}

	const dataFormatadaArquivo = new Date().toISOString().slice(0, 10);
	doc.save(`KrillShield_Relatorio_Executivo_Financeiro_${dataFormatadaArquivo}.pdf`);
}

export interface DadosLaudoIndividual {
	nome: string;
	cnpjCpf: string;
	estado: string;
	data: string;
	texto: string;
}

export function exportarLaudoIndividualPDF(laudo: DadosLaudoIndividual): void {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	// Cabeçalho Corporativo
	doc.setFillColor(15, 23, 42); // slate-900
	doc.rect(14, 12, 182, 22, 'F');

	doc.setTextColor(255, 255, 255);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(13);
	doc.text('KRILL SHIELD · LAUDO TÉCNICO DE BALCÃO', 20, 21);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(203, 213, 225);
	doc.text('AUDITORIA DE CRÉDITO E BLINDAGEM REGULATÓRIA (PROVIMENTO CNJ 216/2026)', 20, 28);

	// Dados da Empresa
	doc.setTextColor(15, 23, 42);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.text(`Produtor / Empresa: ${laudo.nome}`, 14, 42);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(71, 85, 105);
	doc.text(`CNPJ / CPF: ${laudo.cnpjCpf} | Data da Avaliação: ${laudo.data}`, 14, 48);
	doc.text(`Enquadramento Regulatório: ${ESTADOS_CARTAZ[laudo.estado as EstadoCartaz]?.rotulo ?? laudo.estado}`, 14, 53);

	doc.setDrawColor(226, 232, 240);
	doc.line(14, 56, 196, 56);

	// Corpo do Laudo Técnico
	doc.setFont('courier', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(30, 41, 59);

	const linhasTexto = doc.splitTextToSize(laudo.texto, 182);
	let cursorY = 63;
	const margemInferior = 275;

	for (let i = 0; i < linhasTexto.length; i++) {
		if (cursorY > margemInferior) {
			doc.addPage();
			cursorY = 20;
		}
		doc.text(linhasTexto[i], 14, cursorY);
		cursorY += 4.2;
	}

	// Rodapé em todas as páginas
	const totalPaginas = (doc as any).internal.getNumberOfPages();
	for (let p = 1; p <= totalPaginas; p++) {
		doc.setPage(p);
		doc.setDrawColor(203, 213, 225);
		doc.line(14, 285, 196, 285);
		doc.setFont('helvetica', 'normal');
		doc.setFontSize(7.5);
		doc.setTextColor(100, 116, 139);
		doc.text('KrillShield · Parecer Técnico Emitido sob Provimento CNJ 216/2026 e Lei 11.101/2005', 14, 290);
		doc.text(`Página ${p} de ${totalPaginas}`, 196, 290, { align: 'right' });
	}

	const nomeSanitizado = laudo.nome.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
	doc.save(`KrillShield_Laudo_${nomeSanitizado}.pdf`);
}
