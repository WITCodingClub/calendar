<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from 'm3-svelte';
	import { onMount } from 'svelte';

	let isRetrying = false;
	let returnPath = '/calendar'; // Default to calendar page

	onMount(() => {
		// Get the path to return to after granting access
		const storedPath = sessionStorage.getItem('beta_access_return_path');
		if (storedPath) {
			returnPath = storedPath;
		}
	});

	async function handleRetry() {
		isRetrying = true;
		// Clear the stored path
		sessionStorage.removeItem('beta_access_return_path');
		// Go back to the original page to retry the operation
		await goto(returnPath);
	}

	function contactSupport() {
		window.open('mailto:mayonej@wit.edu?subject=Beta Access Request', '_blank');
	}
</script>

<div class="flex justify-center items-center min-h-screen bg-surface p-6">
	<div class="max-w-md w-full bg-surface-container rounded-2xl p-8 shadow-lg text-center">
		<!-- Icon -->
		<div class="mb-6">
			<svg
				class="w-20 h-20 mx-auto text-error"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
		</div>

		<!-- Title -->
		<h1 class="text-3xl font-bold text-on-surface mb-4">Beta Access Required</h1>

		<!-- Message -->
		<p class="text-lg text-on-surface-variant mb-3">
			This feature is currently in beta testing.
		</p>
		<p class="text-base text-on-surface-variant mb-6">
			Please contact support if you believe you should have access.
		</p>

		<!-- Contact Info -->
		<div class="bg-secondary-container rounded-lg p-4 mb-6">
			<p class="text-sm text-on-secondary-container mb-1 font-semibold">Contact Support</p>
			<p class="text-sm text-on-secondary-container">mayonej@wit.edu</p>
		</div>

		<!-- Actions -->
		<div class="flex flex-col gap-3">
			<Button variant="filled" onclick={handleRetry} disabled={isRetrying}>
				{isRetrying ? 'Retrying...' : 'Retry'}
			</Button>
			<Button variant="outlined" onclick={contactSupport}>Contact Support</Button>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
