<script lang="ts">
	import { goto } from '$app/navigation';

	let nome = $state('');
	let email = $state('');
	let senha = $state('');
	let senha2 = $state('');
	let erro = $state('');
	let carregando = $state(false);

	async function registrar() {
		erro = '';
		if (senha !== senha2) {
			erro = 'As senhas não coincidem.';
			return;
		}
		if (senha.length < 6) {
			erro = 'A senha deve ter pelo menos 6 caracteres.';
			return;
		}
		carregando = true;
		try {
			const res = await fetch('/api/auth/registro', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nome, email, senha })
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
</script>

<div class="min-h-screen bg-slate-100/80 flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<div class="bg-white border border-slate-200 shadow-sm overflow-hidden">
			<!-- Window title bar -->
			<div class="h-10 px-3 flex items-center gap-2 border-b border-slate-200 bg-slate-50/80">
				<div class="flex items-center gap-1.5 shrink-0">
					<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
					<span class="w-2.5 h-2.5 rounded-full bg-slate-300/80"></span>
				</div>
				<div class="w-px h-3 bg-slate-200 shrink-0"></div>
				<span class="i-lucide-shield text-slate-600 shrink-0"></span>
				<span class="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
					KrillShield <span class="text-slate-400">v2.0</span>
				</span>
				<span class="ml-auto text-[10px] text-slate-500 hidden sm:block truncate">Crie sua conta de acesso ao balcão</span>
			</div>

			<div class="p-5">
				<h2 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Criar conta</h2>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						registrar();
					}}
					class="space-y-3"
				>
					<div>
						<label for="nome" class="block text-xs font-semibold text-slate-700 mb-1">Nome completo</label>
						<input
							id="nome"
							type="text"
							required
							bind:value={nome}
							placeholder="João da Silva"
							class="w-full px-3 py-2 rounded-md bg-white border border-slate-200 shadow-sm text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150"
						/>
					</div>
					<div>
						<label for="email" class="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
						<input
							id="email"
							type="email"
							required
							bind:value={email}
							placeholder="seu@email.com"
							class="w-full px-3 py-2 rounded-md bg-white border border-slate-200 shadow-sm text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150"
						/>
					</div>
					<div>
						<label for="senha" class="block text-xs font-semibold text-slate-700 mb-1">Senha (mín. 6 caracteres)</label>
						<input
							id="senha"
							type="password"
							required
							minlength={6}
							bind:value={senha}
							placeholder="••••••"
							class="w-full px-3 py-2 rounded-md bg-white border border-slate-200 shadow-sm text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150"
						/>
					</div>
					<div>
						<label for="senha2" class="block text-xs font-semibold text-slate-700 mb-1">Confirmar senha</label>
						<input
							id="senha2"
							type="password"
							required
							minlength={6}
							bind:value={senha2}
							placeholder="••••••"
							class="w-full px-3 py-2 rounded-md bg-white border border-slate-200 shadow-sm text-sm text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 focus:outline-none transition-[border-color,box-shadow] duration-150"
						/>
					</div>

					{#if erro}
						<div class="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 font-medium">{erro}</div>
					{/if}

					<button
						type="submit"
						disabled={carregando}
						class="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold border border-slate-900 transition-colors duration-150 cursor-pointer disabled:opacity-50"
					>
						{carregando ? 'Criando conta...' : 'Criar conta'}
					</button>
				</form>
			</div>
		</div>

		<p class="text-center text-xs text-slate-600 mt-4">
			Já tem uma conta?
			<a href="/login" class="text-slate-900 font-semibold ml-1 hover:text-slate-700">Fazer login</a>
		</p>
	</div>
</div>