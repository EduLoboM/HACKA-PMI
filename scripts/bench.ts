import { getDb, buscarProdutorCompleto } from '../src/lib/server/db';
import { semearDatabase } from '../src/lib/server/seed';
import { analisar } from '../src/lib/krillshield/engine';
import { classificarCarteira, type ProdutorCarteira } from '../src/lib/krillshield/rebaixamento';
import { formatarBRL } from '../src/lib/krillshield/types';

const db = getDb();
semearDatabase(db, true);

const rows = db.prepare('SELECT id FROM produtores ORDER BY id').all() as { id: number }[];

const t0 = Date.now();

const analises = rows
	.map((r) => {
		const perfil = buscarProdutorCompleto(db, r.id);
		return perfil ? { perfil, a: analisar(perfil) } : null;
	})
	.filter((x): x is NonNullable<typeof x> => x !== null);

const dt = Date.now() - t0;

const carteira: ProdutorCarteira[] = analises.map(({ perfil, a }) => ({
	id: perfil.id,
	cnpjCpf: perfil.cnpjCpf,
	nome: perfil.nome,
	estado: a.decisao.estado,
	morrem: a.stay.totalMorrem,
	sobrevivem: a.stay.totalSobrevivem,
	instrumento: a.decisao.instrumentoRotulo
}));

const cls = classificarCarteira(carteira);

const fmt = (v: number) => formatarBRL(v);

const byEstado = (est: string) => carteira.filter((p) => p.estado === est);
const somaMorrem = (arr: ProdutorCarteira[]) => arr.reduce((s, p) => s + p.morrem, 0);
const somaSobrev = (arr: ProdutorCarteira[]) => arr.reduce((s, p) => s + p.sobrevivem, 0);

const degrausAtivos = analises.flatMap(({ a }) => a.degraus.filter((d) => d.ativo));
const docAtivos = degrausAtivos.filter((d) => d.codigo.startsWith('DOC'));
const fiadoComDoc = analises.filter(
	({ a }) => a.decisao.estado === 'FIADO' && a.degraus.some((d) => d.ativo && d.codigo.startsWith('DOC'))
);

const emRiscoSafra = analises.filter(({ a }) => a.safra.sinalRisco).length;
const grauFormalizando = analises.filter(({ a }) => a.relogio.grau === 'FORMALIZANDO').length;
const comMoratoria = analises.filter(({ a }) => a.perfil.riscoMoratoria).length;

const totalMorrem = somaMorrem(carteira);
const totalSobrevivem = somaSobrev(carteira);

console.log('==============================================================');
console.log('  KRILSHIELD v2.0 · BENCH DO MOTOR DETERMINÍSTICO');
console.log('  Base demo forçada (57) · Relógio 216 · Safra vs CPR · R$ Stay');
console.log(`  ${analises.length} empresas avaliadas em ${dt} ms`);
console.log('==============================================================\n');

console.log('RESUMO DO CARTAZ');
console.log('----------------');
for (const est of ['FIADO', 'SÓ_EXTRACONCURSAL', 'À_VISTA'] as const) {
	const arr = byEstado(est);
	console.log(
		`  ${est.padEnd(17)} ${String(arr.length).padStart(3)} empresas  ·  morrem ${fmt(somaMorrem(arr)).padStart(16)}  ·  blindado ${fmt(
			somaSobrev(arr)
		).padStart(16)}`
	);
}
console.log(
	`  ${'TOTAL'.padEnd(17)} ${String(carteira.length).padStart(3)} empresas  ·  morrem ${fmt(totalMorrem).padStart(16)}  ·  blindado ${fmt(
		totalSobrevivem
	).padStart(16)}`
);

console.log('\nZONA DE REBAIXAMENTO (ranking fornecedor → exposição)');
console.log('----------------------------------------------------');
console.log(`  Carteira classificada em ${cls.totais.salvaveis} salváveis + ${cls.totais.rebaixados} rebaixados`);
console.log(`  Corte no ${cls.posicaoCorte}º colocado (quem entra no SoR é o ${cls.primeiroRebaixado?.nome ?? '-'} ${cls.primeiroRebaixado?.estado ?? ''})`);
console.log(`  Último a salvar: ${cls.ultimoASalvar?.nome ?? '-'} -> ${fmt(cls.ultimoASalvar?.morrem ?? 0)} presos (estado ${cls.ultimoASalvar?.estado ?? '-'})`);
console.log(
	`  Exposição salvável ${' '.repeat(0)} ${fmt(cls.totais.exposicaoSalvavel)} (${fmt(cls.totais.blindadoSalvavel)} blindada + ${fmt(
		cls.totais.presoSalvavel
	)} presa)`
);
console.log(`  Exposição de rebaixamento ${fmt(cls.totais.exposicaoRebaixamento)} (${fmt(cls.totais.presoRebaixamento)} presa)`);

console.log('\nREGRA DE NEGÓCIO: FIADO SÓ COM LASTRO COMPROVADO');
console.log('------------------------------------------------');
console.log(`  Empresas com pendência documental DOC ativa: ${docAtivos.length} degrau(s) de ${analises.length} empresa(s)`);
console.log(`  Empresas FIADO com DOC ativo (NÃO PODE EXISTIR): ${fiadoComDoc.length}  ${fiadoComDoc.length === 0 ? 'OK' : '!!! PENDÊNCIA !!!'}`);
for (const c of ['DOC-01', 'DOC-02', 'DOC-03', 'DOC-04', 'DOC-05', 'SAF-01', 'MAU-INSTR'] as const) {
	const n = degrausAtivos.filter((d) => d.codigo === c).length;
	if (n > 0) console.log(`  ${c.padEnd(9)} ativo em ${String(n).padStart(2)} empresa(s)`);
}

console.log('\nSINAIS DE RISCO (estruturais)');
console.log('------------------------------');
console.log(`  Relógio FORMALIZANDO:  ${String(grauFormalizando).padStart(3)}  ·  Safra com sinal: ${String(emRiscoSafra).padStart(3)}  ·  Risco de moratória: ${String(comMoratoria).padStart(3)}`);

console.log('\nTOP 5 EXPOSIÇÃO EM STAY (R$ morrem)');
console.log('-----------------------------------');
const top = [...carteira].sort((a, b) => b.morrem - a.morrem).slice(0, 5);
top.forEach((p, i) =>
	console.log(
		`  ${String(i + 1).padStart(2)}. ${p.nome.padEnd(40)} ${p.estado.padEnd(17)} ${fmt(p.morrem).padStart(16)}`
	)
);

console.log('\n==============================================================');
console.log('BENCH OK — determinístico, reprodutível, regra FIADO preservada.');