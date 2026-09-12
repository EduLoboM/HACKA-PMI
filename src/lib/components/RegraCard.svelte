<script lang="ts">
	type Status = 'ok' | 'alerta' | 'risco' | 'neutro';

	let { titulo, icone, status, resumo, detalhe } = $props<{
		titulo: string;
		icone: string;
		status: Status;
		resumo: string;
		detalhe: string;
	}>();

	function cor(s: Status) {
		switch (s) {
			case 'ok':
				return {
					badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
					dot: 'bg-emerald-400',
					rotulo: 'Sinal OK'
				};
			case 'alerta':
				return {
					badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
					dot: 'bg-amber-400',
					rotulo: 'Atenção'
				};
			case 'risco':
				return {
					badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
					dot: 'bg-rose-400',
					rotulo: 'Risco'
				};
			default:
				return {
					badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
					dot: 'bg-slate-400',
					rotulo: 'Neutro'
				};
		}
	}

	let c = $derived(cor(status));
</script>

<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition h-full">
	<div class="flex items-start justify-between gap-2 mb-3">
		<div class="flex items-center gap-3">
			<span class="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
				<span class="{icone} text-lg"></span>
			</span>
			<div>
				<h3 class="text-sm font-bold text-slate-200 leading-tight">{titulo}</h3>
				<span class="text-[10px] uppercase tracking-wider text-slate-500">Regra determinística</span>
			</div>
		</div>
		<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border {c?.badge}">
			<span class="w-1.5 h-1.5 rounded-full {c?.dot}"></span>
			{c?.rotulo}
		</span>
	</div>

	<p class="text-xs text-slate-300 font-medium mb-1.5">{resumo}</p>
	<p class="text-[11px] text-slate-500 leading-relaxed">{detalhe}</p>
</div>