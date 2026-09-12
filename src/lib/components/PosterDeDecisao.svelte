<script lang="ts">
	import type { DecisaoPoster, EstadoCartaz } from '$lib/krillshield/types';
	import { ESTADOS_CARTAZ } from '$lib/krillshield/types';

	let { decisao } = $props<{ decisao: DecisaoPoster }>();

	const ordem: EstadoCartaz[] = ['FIADO', 'SÓ_EXTRACONCURSAL', 'À_VISTA'];

	function mostrar(i: EstadoCartaz) {
		const meta = ESTADOS_CARTAZ[i];
		const ativo = decisao.estado === i;
		return {
			meta,
			ativo,
			borda: meta.borda,
			texto: meta.texto,
			shadow: ativo ? 'ring-2 ring-offset-2 ring-offset-slate-950 scale-[1.03]' : '',
			opacity: ativo ? 'opacity-100' : 'opacity-45',
			bg: ativo ? meta.bg : 'bg-slate-900/40'
		};
	}

	let passo = $derived(decisao.passo);
</script>

<div class="w-full">
	<div class="flex items-center justify-between mb-3">
		<span class="text-xs uppercase tracking-widest text-slate-400 font-semibold">
			Poster de Decisão Operacional
		</span>
		<span class="text-xs text-slate-500">Passo decisório {passo ?? '—'} de 3</span>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
		{#each ordem as estado}
			{@const c = mostrar(estado)}
			<button
				type="button"
				class="relative rounded-2xl border px-4 py-4 sm:px-5 sm:py-6 text-left transition-all duration-300 cursor-default {c.shadow} {c.bg} {c.borda}"
			>
				<span class="{c.opacity} block">
					<span class="flex items-center justify-between mb-3">
						<span class="{c.meta.icone} text-2xl {c.texto}"></span>
						<span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
							Opção {estado === 'FIADO' ? '1' : estado === 'SÓ_EXTRACONCURSAL' ? '2' : '3'}
						</span>
					</span>
					<span class="block text-lg font-black tracking-tight {c.texto} mb-2">
						{c.meta.rotulo}
					</span>
					<span class="block text-xs text-slate-400 leading-relaxed min-h-10">
						{estado === 'FIADO'
							? 'Duplicata mercantil limpa, limite rotativo usual, sem sinais de preparação de insolvência.'
							: estado === 'SÓ_EXTRACONCURSAL'
								? 'Venda condicionada a aditivo com instrumento jurídico blindado.'
								: 'Pagamento imediato para liberação de produto.'}
					</span>
				</span>
			</button>
		{/each}
	</div>

	{#if decisao.estado !== 'FIADO'}
		<div class="mt-3 rounded-xl border {decisao.estado === 'SÓ_EXTRACONCURSAL' ? 'border-amber-500/30 bg-amber-500/5' : 'border-rose-500/30 bg-rose-500/5'} px-4 py-3">
			<span class="text-xs font-semibold text-slate-300">
				{decisao.estado === 'SÓ_EXTRACONCURSAL'
					? `Instrumento nomeado: ${decisao.instrumentoRotulo ?? '—'}`
					: 'Venda condicionada a liquidação imediata'}
			</span>
		</div>
	{/if}
</div>