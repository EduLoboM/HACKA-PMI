<script lang="ts">
	import '@unocss/reset/tailwind.css';
	import 'virtual:uno.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>KrillShield · Balcão de Decisão Agro</title>
</svelte:head>

<!-- Clean Enterprise Layout Base -->
<div class="fixed inset-0 pointer-events-none -z-10 bg-slate-50"></div>

<div class="relative min-h-screen text-slate-800 flex flex-col antialiased w-full max-w-full overflow-x-hidden min-w-0">
	{@render children()}
</div>