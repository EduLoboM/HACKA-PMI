import type { AnaliseKrillShield, Garantia } from './types';
import { GARANTIAS, ESTADOS_CARTAZ, formatarBRL, formatarNumero } from './types';

function mapaInstrumento(g: Garantia): string {
	return GARANTIAS[g]?.rotulo ?? g;
}

export function redigirEspelho(a: AnaliseKrillShield): string {
	const p = a.perfil;
	const est = ESTADOS_CARTAZ[a.decisao.estado];
	const dataRef = new Date().toLocaleDateString('pt-BR');

	const linhas: string[] = [];

	linhas.push('═══════════════════════════════════════════════════════════════');
	linhas.push('ESPELHO 216 — LAUDO DE TELA ÚNICA');
	linhas.push('KrillShield v2.0 · Relatório Operacional de Balcão');
	linhas.push(`Data de emissão: ${dataRef}`);
	linhas.push('═══════════════════════════════════════════════════════════════');
	linhas.push('');

	linhas.push('■ IDENTIFICAÇÃO DO PRODUTOR');
	linhas.push(`  Razão social / nome fantasia: ${p.nome}`);
	linhas.push(`  CNPJ / CPF: ${p.cnpjCpf}`);
	linhas.push('');

	linhas.push('■ ESTADO ATUAL DO CARTAZ');
	linhas.push(`  >>> ${est.rotulo} <<<`);
	if (a.decisao.instrumentoNomeado) {
		linhas.push(`  Instrumento prescrito: ${a.decisao.instrumentoRotulo}`);
	}
	linhas.push(`  Passo decisório: ${a.decisao.passo}`);
	linhas.push('');

	linhas.push('■ REGRAS DETERMINÍSTICAS DE NEGÓCIO');
	linhas.push('');
	linhas.push('  [1] RELÓGIO 216 — Formalização Produtor Rural');
	linhas.push(`      Grau: ${a.relogio.grau}`);
	linhas.push(`      Inscrição Junta Comercial: ${a.relogio.tempoFormalizacaoMeses} meses`);
	linhas.push(`      Escrituração LCDPR: ${a.relogio.lcdprOk ? 'Ativa' : 'Inativa'}`);
	linhas.push(`      Sinal: ${a.relogio.sinalRisco ? 'ATIVO — risco formal detectado' : 'Inativo'}`);
	linhas.push(`      Motivo: ${a.relogio.motivo}`);
	linhas.push('');
	linhas.push('  [2] SAFRA vs CPR — Cobertura de Entrega Física');
	linhas.push(`      Capacidade produtiva: ${formatarNumero(a.safra.capacidadePeso)} sc`);
	linhas.push(`      Volume comprometido (CPR): ${formatarNumero(p.volumeComprometidoCPR)} sc`);
	linhas.push(
		`      Resultado: ${a.safra.coberturaOk ? 'Cobertura OK (superávit)' : 'Déficit — área insuficiente'}`
	);
	linhas.push(`      Diferença: ${formatarNumero(a.safra.diferencaPeso)} sc`);
	linhas.push(`      Motivo: ${a.safra.motivo}`);
	linhas.push('');
	linhas.push('  [3] CARTEIRA KRILL — Posição Contratual Atual');
	linhas.push('      Posições por instrumento:');
	for (const [g, v] of Object.entries(p.posicaoPorInstrumento)) {
		if (v && v > 0) {
			linhas.push(`        ${mapaInstrumento(g as Garantia)}: ${formatarBRL(v)}`);
		}
	}
	linhas.push('');

	linhas.push('■ CÁLCULO R$ STAY');
	linhas.push(`  Montante exposto total: ${formatarBRL(a.stay.totalExposicao)}`);
	linhas.push('');
	linhas.push('  → Reais que MORREM no stay:');
	if (a.stay.morrem.length === 0) {
		linhas.push('    Nenhum — sem exposição em instrumentos quirografários sob stay');
	} else {
		for (const item of a.stay.morrem) {
			linhas.push(`    ${item.rotulo}: ${formatarBRL(item.valor)} — ${item.motivo}`);
		}
	}
	linhas.push(`  Total que morre: ${formatarBRL(a.stay.totalMorrem)}`);
	linhas.push(`  Deságio estimado na recuperação judicial: ${(a.stay.desagio * 100).toFixed(0)}%`);
	linhas.push('');
	linhas.push('  → Reais que SOBREVIVEM ao stay:');
	if (a.stay.sobrevivem.length === 0) {
		linhas.push('    Nenhum — sem instrumento extraconcursal ativo');
	} else {
		for (const item of a.stay.sobrevivem) {
			linhas.push(`    ${item.rotulo}: ${formatarBRL(item.valor)} — ${item.motivo}`);
		}
	}
	linhas.push(`  Total que sobrevive: ${formatarBRL(a.stay.totalSobrevivem)}`);
	linhas.push('');

	linhas.push('■ RAZÕES DE FATO E DE DIREITO');
	for (const r of a.decisao.razoes) {
		linhas.push(`  · ${r}`);
	}
	linhas.push('');

	linhas.push('■ PENALIDADES APLICADAS (REASON CODES)');
	const pendentes = a.degraus.filter((d) => d.ativo);
	const superadas = a.degraus.filter((d) => !d.ativo);
	linhas.push(`  Total de sinais calculados: ${a.degraus.length} · Ativos: ${pendentes.length}`);
	linhas.push('');
	for (const d of pendentes) {
		linhas.push(`  [ATIVO] ${d.codigo} — ${d.texto}`);
		linhas.push(`          Classe: ${d.classe}`);
		linhas.push(`          Origem do valor: ${d.origemValor}`);
		linhas.push(`          Prova exigida: ${d.provaExigida}`);
	}
	if (pendentes.length === 0) {
		linhas.push('  Nenhuma penalidade ativa — cadastro sem pendência documental ou de risco.');
	}
	if (superadas.length > 0) {
		linhas.push('');
		linhas.push('  → Superadas (efetivadas pelo cadastro):');
		for (const d of superadas) {
			linhas.push(`  [OK] ${d.codigo} — ${d.texto}`);
		}
	}
	linhas.push('');
	linhas.push('  Trilha de subida = reason codes invertidos: cada degrau retorna exatamente');
	linhas.push('  a penalidade que o gerou (zero calibração, zero arbitragem). Estrutural nunca');
	linhas.push('  sobe por comportamento — sequência longa não compra imunidade.');
	linhas.push('  Prova é DECLARADA com responsável nomeado e data. Não simular verificação automática.');
	linhas.push('');

	linhas.push('■ BASE LEGAL');
	linhas.push('  · Lei nº 11.101/2005, art. 6º (Stay Period de 180 dias prorrogáveis)');
	linhas.push('  · Lei nº 14.112/2020, Tema 1.145 do STJ');
	linhas.push('  · Provimento CNJ nº 216/2026 (verificação prévia RJ rural)');
	linhas.push('  · Lei nº 8.929/1994 e Lei nº 13.986/2020 (CPR e extraconcursalidade)');
	linhas.push('  · Art. 49, §3º da Lei 11.101/2005 (titularidade resolúvel fiduciária)');
	linhas.push('');
	linhas.push('■ LISTA DE COMPRAS');
	linhas.push('  SEMPRE um SIM para Arbolina.');
	linhas.push('  A Krill não fecha a prateleira, troca a garantia, e o número');
	linhas.push('  na porta é o real que entra no stay se a RJ cair amanhã.');
	linhas.push('');
	linhas.push('═══════════════════════════════════════════════════════════════');
	linhas.push('Atendente de Balcão: Gemini Free API (protótipo) / watsonx Orchestrate (produção)');
	linhas.push('Regras determinísticas: KrillShield v2.0 · Krill Tech');
	linhas.push('═══════════════════════════════════════════════════════════════');

	return linhas.join('\n');
}
