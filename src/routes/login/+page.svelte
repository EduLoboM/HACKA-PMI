<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('');
	let senha = $state('');
	let erro = $state('');
	let carregando = $state(false);

	async function entrar() {
		erro = '';
		carregando = true;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, senha })
			});
			const r = await res.json();
			if (!res.ok) throw new Error(r.error ?? `HTTP ${res.status}`);
			goto('/', { replaceState: true });
		} catch (e) {
			erro = e instanceof Error ? e.message : String(e);
		} finally {
			carregando = false;
		}
	}

	async function entrarDemo() {
		erro = '';
		carregando = true;
		try {
			const res = await fetch('/api/auth/demo', { method: 'POST' });
			const r = await res.json();
			if (!res.ok) throw new Error(r.error ?? `HTTP ${res.status}`);
			goto('/', { replaceState: true });
		} catch (e) {
			erro = e instanceof Error ? e.message : String(e);
		} finally {
			carregando = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-rose-500/30 selection:text-white">
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-600 shadow-lg shadow-orange-500/20 mb-4">
				<span class="i-lucide-shield text-white text-3xl"></span>
			</div>
			<h1 class="text-2xl font-black text-white tracking-tight">KrillShield <span class="text-rose-400">v2.0</span></h1>
			<p class="text-sm text-slate-500 mt-1">Balcão de Decisão do Crédito no Agro</p>
		</div>

		<div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
			<h2 class="text-sm font-bold text-slate-200 mb-4">Entrar na conta</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					entrar();
				}}
				class="space-y-3"
			>
				<div>
					<label for="email" class="block text-xs font-semibold text-slate-400 mb-1">E-mail</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="seu@email.com"
						class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
					/>
				</div>
				<div>
					<label for="senha" class="block text-xs font-semibold text-slate-400 mb-1">Senha</label>
					<input
						id="senha"
						type="password"
						required
						minlength={6}
						bind:value={senha}
						placeholder="••••••"
						class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
					/>
				</div>

				{#if erro}
					<div class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{erro}</div>
				{/if}

				<button
					type="submit"
					disabled={carregando}
					class="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
				>
					{carregando ? 'Entrando...' : 'Entrar'}
				</button>
			</form>

			<div class="relative my-5">
				<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
				<div class="relative flex justify-center text-xs text-slate-600 bg-slate-900/60 px-3"><span>ou</span></div>
			</div>

			<button
				type="button"
				onclick={entrarDemo}
				disabled={carregando}
				class="w-full px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-sm font-bold text-emerald-300 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
			>
				Entrar com conta demo
			</button>
		</div>

		<p class="text-center text-xs text-slate-500 mt-5">
			Não tem conta?
			<a href="/registro" class="text-rose-400 hover:text-rose-300 font-semibold ml-1">Criar conta</a>
		</p>
	</div>
</div>