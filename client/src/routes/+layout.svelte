<script lang="ts">
	import '../main.css';
	import '../app.css';

	let { children } = $props();
	import { NewSnackbar } from 'm3-svelte';
	import { HDRRouter } from '@cattn/hdr';

</script>
<HDRRouter />

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="overflow-x-hidden">
	{@render children?.()}
</div>
<NewSnackbar />