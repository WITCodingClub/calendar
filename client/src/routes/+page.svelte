<script lang="ts">
    import { Button } from 'm3-svelte';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(() => {
        checkIfLoggedIn();
    });

    async function checkIfLoggedIn() {
        //@ts-expect-error
        const result = await chrome.storage.local.get('jwt_token');
        if (result.jwt_token) {
            goto('/onboard');
        }
    }

    async function signIn() {
        goto('/loading');
    }
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full">
    <div class="flex flex-row gap-2 mb-2">
        <h1 class="text-2xl font-bold roboto-flex-wit-main">WIT-Calendar</h1>
    </div>
    <div class="bg-surface-container-low p-4 rounded-lg shadow flex flex-col items-start w-full max-w-xl mb-2 mt-4">
        <p class="text-lg font-semibold text-on-surface mb-2">Welcome! A few things to note:</p>
        <ul class="list-disc pl-5 space-y-1 text-base text-on-surface-variant">
            <li>
                Tabs may open and close automatically when using the extension; this is normal and expected.
            </li>
            <li>
                Please make sure you're signed in here: 
                <a 
                    href="https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory" 
                    target="_blank"
                    class="text-primary underline break-all"
                >
                    selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory
                </a>
            </li>
        </ul>
    </div>
    <div class="flex justify-center items-center peak">
        <Button onclick={signIn} variant="filled" square>Let's start!</Button>
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

    :global(.peak button) {
        height: 3rem !important;
    }
</style>