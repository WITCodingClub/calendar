<script lang="ts">
	import '../main.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div>
	{@render children?.()}
</div>

