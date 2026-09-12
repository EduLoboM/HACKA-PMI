import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/environment';
import { error, type Cookies } from '@sveltejs/kit';
import type Database from 'better-sqlite3';
import { getDb } from './db';

const COOKIE_NOME = 'krillshield_session';
const DURACAO_SESSAO_S = 60 * 60 * 24 * 7;

export type UsuarioAuth = { id: number; nome: string; email: string };

export function hashSenha(senha: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(senha, salt, 64).toString('hex');
	return `scrypt$${salt}$${hash}`;
}

export function verificarSenha(senha: string, armazenada: string): boolean {
	const [algo, salt, hash] = armazenada.split('$');
	if (algo !== 'scrypt' || !salt || !hash) return false;
	const teste = scryptSync(senha, salt, 64);
	const original = Buffer.from(hash, 'hex');
	return teste.length === original.length && timingSafeEqual(teste, original);
}

export function criarUsuario(db: Database.Database, nome: string, email: string, senha: string): number {
	const hash = hashSenha(senha);
	try {
		const r = db
			.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)')
			.run(nome, email, hash);
		return Number(r.lastInsertRowid);
	} catch (e) {
		if (e instanceof Error && (e as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
			throw error(409, 'E-mail já cadastrado. Faça login.');
		}
		throw e;
	}
}

export function autenticarUsuario(db: Database.Database, email: string, senha: string): UsuarioAuth | null {
	const u = db
		.prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?')
		.get(email) as { id: number; nome: string; email: string; senha_hash: string } | undefined;
	if (!u) return null;
	if (!verificarSenha(senha, u.senha_hash)) return null;
	return { id: u.id, nome: u.nome, email: u.email };
}

export function iniciarSessao(db: Database.Database, cookies: Cookies, usuarioId: number): void {
	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + DURACAO_SESSAO_S * 1000).toISOString();
	db.prepare('INSERT INTO sessoes (usuario_id, token, expires_at) VALUES (?, ?, ?)').run(
		usuarioId,
		token,
		expiresAt
	);
	cookies.set(COOKIE_NOME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: DURACAO_SESSAO_S
	});
}

export function obterUsuarioDaSessao(cookies: Cookies): UsuarioAuth | null {
	const token = cookies.get(COOKIE_NOME);
	if (!token) return null;
	const db = getDb();
	const r = db
		.prepare(
			`SELECT u.id, u.nome, u.email
			 FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
			 WHERE s.token = ? AND s.expires_at > datetime('now')`
		)
		.get(token) as UsuarioAuth | undefined;
	return r ?? null;
}

export function encerrarSessao(cookies: Cookies): void {
	const db = getDb();
	const token = cookies.get(COOKIE_NOME);
	if (token) db.prepare('DELETE FROM sessoes WHERE token = ?').run(token);
	cookies.delete(COOKIE_NOME, { path: '/' });
}

export function exigeAuth(locals: App.Locals): UsuarioAuth {
	if (!locals.user) throw error(401, 'Não autenticado');
	return locals.user;
}