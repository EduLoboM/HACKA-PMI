import type { AnaliseKrillShield, Garantia, RespostaIA } from './types';
import { GARANTIAS, ESTADOS_CARTAZ, formatarBRL, formatarNumero } from './types';

function mapaInstrumento(g: Garantia): string {
	return GARANTIAS[g]?.rotulo ?? g;
}

export function gerarRespostaPadrao(a: AnaliseKrillShield): RespostaIA {
	const p = a.perfil;
	const est = ESTADOS_CARTAZ[a.decisao.estado];
	const anosFormalizacao = (a.relogio.tempoFormalizacaoMeses / 12).toFixed(1);

	let resumoExecutivo = '';
	const recomendacoes: string[] = [];
	const restricoes: string[] = [];
	let orientacaoBalcao = '';

	if (a.decisao.estado === 'FIADO') {
		resumoExecutivo = `Produtor em estado de NORMALIDADE com ${anosFormalizacao} anos de inscrição formal e escrituração LCDPR ativa. A capacidade produtiva no CAR (${formatarNumero(a.safra.capacidadePeso)} sc) cobre integralmente o volume comprometido em CPRs (${formatarNumero(p.volumeComprometidoCPR)} sc), demonstrando equilíbrio financeiro sem indicativos de moratória.`;
		recomendacoes.push('Aprovar limite rotativo padrão via Duplicata Mercantil limpa.');
		recomendacoes.push('Manter condições comerciais padrão de balcão e prazos habituais de safra.');
		recomendacoes.push('Oferecer pacote integral de bioinsumos Krill Tech com entrega programada.');
		restricoes.push('Alinhar o vencimento dos títulos estritamente com o calendário da safra colhida.');
		orientacaoBalcao = 'Crédito liberado com segurança. Apresente ao produtor a solução completa da Krill Tech com foco em produtividade e relacionamento de longo prazo.';
	} else if (a.decisao.estado === 'SÓ_EXTRACONCURSAL') {
		const inst = a.decisao.instrumentoRotulo ?? 'Alienação Fiduciária';
		resumoExecutivo = `Produtor qualificado para crédito sob regime CONDICIONADO A GARANTIA EXTRACONCURSAL (${inst}). Identificado ponto de atenção no cruzamento entre formalização e compromissos de safra, exigindo blindagem expressa contra os efeitos de suspensão do Stay Period da LREF.`;
		recomendacoes.push(`Formalizar aditivo contratual com cláusula de ${inst}.`);
		recomendacoes.push('Vincular a entrega física à área georreferenciada averbada no CAR.');
		recomendacoes.push('Registrar o instrumento tempestivamente em cartório de títulos ou registradora autorizada (B3/Cerc).');
		restricoes.push('Condicionar a liberação do faturamento à emissão de instrumento fiduciário resolúvel.');
		restricoes.push('Evitar liberação de produtos antes do registro formal da garantia.');
		if (!a.safra.coberturaOk) {
			restricoes.push(`Área física CAR com capacidade justa frente a ${formatarNumero(p.volumeComprometidoCPR)} sc de CPR: priorizar penhor ou alienação fiduciária de maquinário livre.`);
		}
		orientacaoBalcao = `A Krill Tech NÃO fecha a porta para este produtor. Explique de forma transparente que a venda está autorizada mediante a constituição de ${inst}, garantindo a segurança de ambas as partes.`;
	} else {
		resumoExecutivo = `Produtor com indicativo de moratória/RJ iminente ou inconsistência severa de lastro no Provimento 216. A exposição da carteira aponta alto deságio em eventual suspensão judicial.`;
		recomendacoes.push('Operar exclusivamente sob liquidação financeira imediata (D+0 / À VISTA).');
		recomendacoes.push('Priorizar compensação bancária integral antes da entrega do produto.');
		restricoes.push('Não conceder prorrogações ou prazos desprovidos de liquidação imediata.');
		restricoes.push('Não aceitar títulos de crédito sem liquidez imediata comprovada.');
		orientacaoBalcao = 'Conduza a negociação com máxima cordialidade e transparência: a operação está autorizada mediante pagamento à vista. Ofereça condições promocionais para liquidação imediata.';
	}

	const fontesAuditadas = [
		{
			fonte: 'Junta Comercial & LCDPR',
			origem: 'Junta Comercial do Estado / Receita Federal',
			dado: `${anosFormalizacao} anos (${a.relogio.tempoFormalizacaoMeses} meses) · LCDPR ${a.relogio.lcdprOk ? 'Ativo' : 'Inativo'}`,
			status: a.relogio.sinalRisco ? ('alerta' as const) : ('ok' as const),
			descricao: a.relogio.motivo
		},
		{
			fonte: 'SICAR (CAR)',
			origem: 'Cadastro Ambiental Rural / Min. Meio Ambiente',
			dado: `${formatarNumero(p.areaPlantadaCAR)} hectares declarados`,
			status: 'ok' as const,
			descricao: 'Base territorial de cultivo auditada para cálculo de capacidade agronômica.'
		},
		{
			fonte: 'ZARC (Embrapa/MAPA)',
			origem: 'Zoneamento Agrícola de Risco Climático',
			dado: `${formatarNumero(p.produtividadeZarc)} sc/ha parametrizados`,
			status: 'ok' as const,
			descricao: 'Produtividade de referência oficial para a cultura e município.'
		},
		{
			fonte: 'Registros de CPR / B3',
			origem: 'Cartórios de Títulos e Documentos / Registradoras',
			dado: `${formatarNumero(p.volumeComprometidoCPR)} sc comprometidas em CPR`,
			status: a.safra.coberturaOk ? ('ok' as const) : ('risco' as const),
			descricao: a.safra.motivo
		},
		{
			fonte: 'LREF & STJ (Arts. 6º e 49)',
			origem: 'Lei 11.101/2005 e Tema 1.145 do STJ',
			dado: `R$ ${formatarBRL(a.stay.totalMorrem)} presos no Stay · R$ ${formatarBRL(a.stay.totalSobrevivem)} blindados`,
			status: a.stay.totalMorrem > 0 ? ('alerta' as const) : ('ok' as const),
			descricao: `Deságio médio de ${(a.stay.desagio * 100).toFixed(0)}% em eventual recuperação judicial.`
		}
	];

	return {
		resumoExecutivo,
		recomendacoes,
		restricoes,
		orientacaoBalcao,
		fontesAuditadas,
		laudoFormatado: redigirEspelho(a)
	};
}

export function redigirEspelho(a: AnaliseKrillShield): string {
	const p = a.perfil;
	const est = ESTADOS_CARTAZ[a.decisao.estado];
	const dataRef = new Date().toLocaleDateString('pt-BR');

	const linhas: string[] = [];

	linhas.push('———————————————————————————————————————————————————————————————');
	linhas.push('ESPELHO — LAUDO DE TELA ÚNICA');
	linhas.push('KrillShield · Relatório Operacional de Balcão');
	linhas.push(`Data de emissão: ${dataRef}`);
	linhas.push('———————————————————————————————————————————————————————————————');
	linhas.push('');

	linhas.push('1. IDENTIFICAÇÃO DO PRODUTOR');
	linhas.push(`   Razão social / nome fantasia: ${p.nome}`);
	linhas.push(`   CNPJ / CPF: ${p.cnpjCpf}`);
	linhas.push('');

	linhas.push('2. ESTADO DO CARTAZ');
	linhas.push(`   Classificação: ${est.rotulo}`);
	if (a.decisao.instrumentoNomeado) {
		linhas.push(`   Instrumento prescrito: ${a.decisao.instrumentoRotulo}`);
	}
	linhas.push(`   Passo decisório: ${a.decisao.passo} de 3`);
	linhas.push('');

	linhas.push('3. AUDITORIA DE REGRAS DETERMINÍSTICAS');
	linhas.push('');
	linhas.push('   [A] RELÓGIO 216 — Formalização Produtor Rural');
	linhas.push(`       Grau: ${a.relogio.grau}`);
	linhas.push(`       Inscrição Junta Comercial: ${a.relogio.tempoFormalizacaoMeses} meses`);
	linhas.push(`       Escrituração LCDPR: ${a.relogio.lcdprOk ? 'Ativa' : 'Inativa'}`);
	linhas.push(`       Sinal de Risco: ${a.relogio.sinalRisco ? 'ATIVO' : 'Normalidade'}`);
	linhas.push(`       Parecer: ${a.relogio.motivo}`);
	linhas.push('');
	linhas.push('   [B] SAFRA vs CPR — Cobertura de Entrega Física');
	linhas.push(`       Capacidade produtiva estimada: ${formatarNumero(a.safra.capacidadePeso)} sc`);
	linhas.push(`       Volume comprometido em CPR: ${formatarNumero(p.volumeComprometidoCPR)} sc`);
	linhas.push(
		`       Status da Safra: ${a.safra.coberturaOk ? 'Superávit Físico' : 'Déficit de Área'}`
	);
	linhas.push(`       Diferença líquida: ${formatarNumero(a.safra.diferencaPeso)} sc`);
	linhas.push(`       Parecer: ${a.safra.motivo}`);
	linhas.push('');
	linhas.push('   [C] CARTEIRA KRILL — Posição Contratual Vigente');
	linhas.push('       Instrumentos registrados:');
	for (const [g, v] of Object.entries(p.posicaoPorInstrumento)) {
		if (v && v > 0) {
			linhas.push(`         · ${mapaInstrumento(g as Garantia)}: ${formatarBRL(v)}`);
		}
	}
	linhas.push('');

	linhas.push('4. SIMULAÇÃO DE INSOLVÊNCIA — CÁLCULO R$ STAY (180 DIAS)');
	linhas.push(`   Montante total da carteira: ${formatarBRL(a.stay.totalExposicao)}`);
	linhas.push(`   Créditos sob suspensão concursal (Morrem): ${formatarBRL(a.stay.totalMorrem)}`);
	if (a.stay.morrem.length > 0) {
		for (const item of a.stay.morrem) {
			linhas.push(`     - ${item.rotulo}: ${formatarBRL(item.valor)} (${item.motivo})`);
		}
	}
	linhas.push(`   Créditos com garantia extraconcursal (Sobrevivem): ${formatarBRL(a.stay.totalSobrevivem)}`);
	if (a.stay.sobrevivem.length > 0) {
		for (const item of a.stay.sobrevivem) {
			linhas.push(`     + ${item.rotulo}: ${formatarBRL(item.valor)} (${item.motivo})`);
		}
	}
	linhas.push(`   Deságio médio estimado em RJ: ${(a.stay.desagio * 100).toFixed(0)}%`);
	linhas.push('');

	linhas.push('5. FUNDAMENTAÇÃO LEGAL APLICÁVEL');
	linhas.push('   · Lei nº 11.101/2005, art. 6º (Stay Period de 180 dias prorrogáveis)');
	linhas.push('   · Lei nº 14.112/2020 e Tema 1.145 do Superior Tribunal de Justiça');
	linhas.push('   · Provimento CNJ nº 216/2026 (Verificação prévia para RJ rural)');
	linhas.push('   · Lei nº 8.929/1994 e Lei nº 13.986/2020 (CPR física e extraconcursalidade)');
	linhas.push('   · Art. 49, §3º da Lei 11.101/2005 (Titularidade resolúvel fiduciária)');
	linhas.push('');

	linhas.push('6. DIRETRIZ INSTITUCIONAL KRILL TECH');
	linhas.push('   SEMPRE um SIM para Arbolina.');
	linhas.push('   A Krill Tech não fecha a prateleira: ajusta o instrumento fiduciário,');
	linhas.push('   e o número informado é o montante exato blindado contra o stay.');
	linhas.push('');
	linhas.push('———————————————————————————————————————————————————————————————');
	linhas.push('Atendente Inteligente KrillShield · Regras Determinísticas de Crédito Agro');
	linhas.push('———————————————————————————————————————————————————————————————');

	return linhas.join('\n');
}
