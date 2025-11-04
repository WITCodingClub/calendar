<script lang="ts">
    import { TextFieldOutlined, Button } from 'm3-svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { handleApiResponse } from '$lib/api';
    
    let emailToSignInWith: string | null = $state(null);
    let emailToSubmit = $state('');

    async function tryForEmail() {
        //@ts-expect-error
        const info = await chrome.identity.getProfileUserInfo();
        if (info && info.email) {
            emailToSignInWith = info.email;
        }
    }

    async function setupListener() {
        //@ts-expect-error
        chrome.storage.onChanged.addListener((changes: any) => {
            //@ts-expect-error
            Object.entries(changes).forEach(async ([key, { newValue }]) => {
                if (key === 'oauth_status' && newValue === 'success') {
                    //@ts-expect-error
                    await chrome.storage.local.set({
                        oauth_email: emailToSignInWith || emailToSubmit,
                    });
                    goto('/calendar');
                }
            });
        });
    }

    async function useDifferentEmail() {
        emailToSignInWith = null;
    }

    async function submitEmail() {
        try {
            const emailToUse = emailToSignInWith || emailToSubmit;

            //@ts-expect-error
            const jwt_token = await chrome.storage.local.get('jwt_token');
            const response = await fetch('https://heron-selected-literally.ngrok-free.app/api/user/gcal', {
                method: 'POST',
                body: JSON.stringify({email: emailToUse}),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt_token.jwt_token}`
                }
            });

            const data = await handleApiResponse<{ oauth_url: string }>(response);

            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;

            //@ts-expect-error
            const win = await chrome.windows.create({
                url: data.oauth_url,
                width: 650,
                height: 800,
                left: Math.floor((screenWidth - 650) / 2),
                top: Math.floor((screenHeight - 800) / 2),
                type: 'popup'
            });

            if (win) {
                win.focus();
            }
        } catch (err) {
            // Beta access error will redirect automatically
            if (err instanceof Error && err.message !== 'Beta access required') {
                console.error('Error submitting email:', err);
            }
        }
    }

    onMount(() => {
        tryForEmail();
        setupListener();
    });
</script>

<div class="flex flex-col items-center justify-center h-screen">

    <h1 class="text-2xl font-bold text-center text-primary mb-5">Enter your Google email</h1>
    {#if !emailToSignInWith}
        <TextFieldOutlined label="" placeholder="example@gmail.com" bind:value={emailToSubmit} />
    {/if}

    <div class="flex justify-center mt-3 peak flex-col gap-2">
        {#if emailToSignInWith}
            <Button variant="filled" square onclick={submitEmail}>Continue with {emailToSignInWith}</Button>
            <Button variant="outlined" square onclick={useDifferentEmail}>Use a different email</Button>
        {:else}
            <Button variant="filled" square onclick={submitEmail}>Continue</Button>
        {/if}
    </div>
</div>

<style>
    :global(.peak button) {
        height: 2.5rem !important;
    }
</style>