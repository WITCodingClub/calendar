<script lang="ts">
    import { Button, TextField } from 'm3-svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let email = $state('');

    async function checkIfLoggedIn() {
        //@ts-expect-error
        const jwt_token = await chrome.storage.local.get('jwt_token');
        if (jwt_token && jwt_token.jwt_token) {
            goto('/calendar');
        }
    }

    onMount(() => {
        checkIfLoggedIn();
    });

    async function setupListener() {
        //@ts-expect-error
        chrome.storage.onChanged.addListener((changes: any) => {
            //@ts-expect-error
            Object.entries(changes).forEach(([key, { newValue }]) => {
                if (key === 'jwt_token' && newValue) {
                    goto('/calendar');
                }
            });
        });
    }

    async function signIn() {
        const API_BASE_URL = 'https://heron-selected-literally.ngrok-free.app';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/request_magic_link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('Magic link sent!', data.message);
                await setupListener();
            } else {
                console.error('Failed to send magic link:', data.error);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    }
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full">
    <div class="flex flex-row gap-2 mb-2">
        <h1 class="text-2xl font-bold roboto-flex-wit-main">WIT-Calendar</h1>
    </div>
    <p class="text-sm text-secondary">Verify your email to get started</p>
    <div class="flex flex-row gap-4 justify-center items-center">
        <TextField bind:value={email} label="Email" />
        <Button onclick={signIn} variant="filled" square>Sign in</Button>
    </div>
</div>

<style>
   .roboto-flex-wit-main {
        font-size: 32px;
        font-family: "Roboto Flex", sans-serif;
        color: var(--color-primary);
        font-optical-sizing: 144;
        font-weight: 900;
        line-height: 0;
        font-style: normal;
        font-variation-settings:
            "slnt" 0,
            "wdth" 129,
            "GRAD" 0,
            "XOPQ" 140,
            "XTRA" 468,
            "YOPQ" 51,
            "YTAS" 750,
            "YTDE" -203,
            "YTFI" 738,
            "YTLC" 514,
            "YTUC" 712;
    }
</style>