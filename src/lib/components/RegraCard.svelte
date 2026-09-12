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
					dot: 'bg-emerald-500',
					tag: 'bg-emerald-50 text-emerald-800 border-emerald-200',
					iconColor: 'text-emerald-600',
					cardBg: 'border-emerald-100 hover:border-emerald-300',
					rotulo: 'Conforme'
				};
			case 'alerta':
				return {
					dot: 'bg-amber-500',
					tag: 'bg-amber-50 text-amber-800 border-amber-200',
					iconColor: 'text-amber-600',
					cardBg: 'border-amber-100 hover:border-amber-300',
					rotulo: 'Atenção'
				};
			case 'risco':
				return {
					dot: 'bg-rose-500',
					tag: 'bg-rose-50 text-rose-800 border-rose-200',
					iconColor: 'text-rose-600',
					cardBg: 'border-rose-100 hover:border-rose-300',
					rotulo: 'Risco Ativo'
				};
			default:
				return {
					dot: 'bg-slate-400',
					tag: 'bg-slate-50 text-slate-700 border-slate-200',
					iconColor: 'text-slate-500',
					cardBg: 'border-slate-200 hover:border-slate-300',
					rotulo: 'Neutro'
				};
		}
	}

	let c = $derived(estiloStatus(status));
</script>

<div class="bg-white border rounded-xl p-4 flex flex-col justify-between h-full shadow-xs transition-all duration-150 {c.cardBg}">
	<div>
		<div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
			<div class="flex items-center gap-2 min-w-0">
				<div class="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
					<span class="{icone} text-sm {c.iconColor}"></span>
				</div>
				<h4 class="text-xs font-bold text-slate-900 tracking-tight uppercase truncate">
					{titulo}
				</h4>
			</div>
			<span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md border {c.tag}">
				<span class="w-1.5 h-1.5 rounded-full {c.dot}"></span>
				{c.rotulo}
			</span>
		</div>

		<p class="text-xs font-bold text-slate-800 leading-snug mb-1">
			{resumo}
		</p>
	</div>

	<p class="text-[11px] text-slate-500 leading-relaxed pt-2.5 border-t border-slate-100 mt-2 font-normal">
		{detalhe}
	</p>
</div>