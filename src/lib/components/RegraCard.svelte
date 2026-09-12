<script lang="ts">
	type Status = 'ok' | 'alerta' | 'risco' | 'neutro';

	let { titulo, icone, status, resumo, detalhe } = $props<{
		titulo: string;
		icone: string;
		status: Status;
		resumo: string;
		detalhe: string;
	}>();

	function estiloStatus(s: Status) {
		switch (s) {
			case 'ok':
				return {
					dot: 'bg-emerald-600',
					tag: 'bg-emerald-50 text-emerald-800 border-emerald-200',
					iconColor: 'text-emerald-700',
					rotulo: 'Conforme'
				};
			case 'alerta':
				return {
					dot: 'bg-amber-500',
					tag: 'bg-amber-50 text-amber-800 border-amber-200',
					iconColor: 'text-amber-700',
					rotulo: 'Atenção'
				};
			case 'risco':
				return {
					dot: 'bg-rose-600',
					tag: 'bg-rose-50 text-rose-800 border-rose-200',
					iconColor: 'text-rose-700',
					rotulo: 'Risco Ativo'
				};
			default:
				return {
					dot: 'bg-slate-400',
					tag: 'bg-slate-50 text-slate-700 border-slate-200',
					iconColor: 'text-slate-500',
					rotulo: 'Neutro'
				};
		}
	}

	let c = $derived(estiloStatus(status));
</script>

<div class="bg-white border border-slate-200 p-4 flex flex-col justify-between h-full">
	<div>
		<div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
			<div class="flex items-center gap-2 min-w-0">
				<span class="{icone} text-base {c.iconColor} shrink-0"></span>
				<h4 class="text-xs font-bold text-slate-900 tracking-tight uppercase">
					{titulo}
				</h4>
			</div>
			<span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold border {c.tag}">
				<span class="w-1.5 h-1.5 rounded-full {c.dot}"></span>
				{c.rotulo}
			</span>
		</div>

		<p class="text-xs font-semibold text-slate-900 leading-snug mb-1">
			{resumo}
		</p>
	</div>

	<p class="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100 mt-2">
		{detalhe}
	</p>
</div>