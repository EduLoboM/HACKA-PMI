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

<div class="min-h-screen bg-[#f6f9f8] flex items-center justify-center p-4 selection:bg-emerald-500/20 selection:text-emerald-950 font-sans">
	<div class="w-full max-w-sm">
		<!-- Brand Header -->
		<div class="text-center mb-6">
			<div class="inline-flex items-center justify-center w-10 h-10 bg-slate-900 text-white font-bold text-sm font-mono mb-3 shadow-sm">
				KF
			</div>
			<h1 class="text-xl font-bold tracking-tight text-slate-900 leading-none">
				KRILL<span class="text-emerald-700">SHIELD</span>
				<span class="text-xs font-mono font-normal text-slate-500 ml-1.5">v2.0</span>
			</h1>
			<p class="text-xs text-slate-500 mt-1.5 font-sans">Terminal de Decisão & Risco de Crédito Agro</p>
		</div>

		<!-- Login Card -->
		<div class="bg-white border border-slate-200 shadow-sm overflow-hidden">
			<div class="h-10 px-3 flex items-center gap-2 border-b border-slate-200 bg-slate-50/80">
				<div class="flex items-center gap-1.5 shrink-0">
					<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
				</div>
				<div class="w-px h-3 bg-slate-200 shrink-0"></div>
				<h2 class="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">Acesso ao Balcão</h2>
				<span class="ml-auto text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 border border-slate-200 shrink-0">Seguro</span>
			</div>

			<div class="p-5 space-y-4">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					entrar();
				}}
				class="space-y-3.5"
			>
				<div>
					<label for="email" class="block text-xs font-semibold text-slate-700 mb-1">E-mail corporativo</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						placeholder="seu.email@empresa.com"
						class="w-full px-3 py-2 text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
					/>
				</div>
				<div>
					<label for="senha" class="block text-xs font-semibold text-slate-700 mb-1">Senha de acesso</label>
					<input
						id="senha"
						type="password"
						required
						minlength={6}
						bind:value={senha}
						placeholder="••••••••"
						class="w-full px-3 py-2 text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
					/>
				</div>

				{#if erro}
					<div class="p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
						{erro}
					</div>
				{/if}

				<button
					type="button"
					onclick={entrarDemo}
					disabled={carregando}
					class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50"
				>
					{carregando ? 'Validando credenciais...' : 'Entrar no Sistema'}
				</button>
			</form>

			<div class="relative my-4">
				<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
				<div class="relative flex justify-center text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-white px-2"><span>ou</span></div>
			</div>

			<button
				type="button"
				onclick={entrarDemo}
				disabled={carregando}
				class="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
			>
				<span class="i-lucide-play text-xs text-emerald-700"></span>
				<span>Acessar com Conta Demo</span>
			</button>
			</div>
		</div>

		<p class="text-center text-xs text-slate-500 mt-4">
			Não possui acesso?
			<a href="/registro" class="text-emerald-700 hover:text-emerald-900 font-bold ml-1">Criar conta</a>
		</p>
	</div>
</div>