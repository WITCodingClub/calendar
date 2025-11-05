<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { LoadingIndicator, Button } from 'm3-svelte';

    let schoolEmail = $state('');
    let error = $state<string | null>(null);

    onMount(() => {
        fetchSchoolEmail();
    });

    async function fetchSchoolEmail() {
        try {
            error = null;
            const targetUrl = 'https://selfservice.wit.edu/BannerGeneralSsb/ssb/PersonalInformationDetails/getEmails';
            
            //@ts-expect-error
            const [currentTab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
            
            const isOnTargetPage = currentTab.url === targetUrl;
            let tabToUse = currentTab;
            let shouldCloseTab = false;
            
            if (!isOnTargetPage) {
                //@ts-expect-error
                tabToUse = await chrome.tabs.create({ url: targetUrl });
                shouldCloseTab = true;
                
                await new Promise<void>((resolve) => {
                    //@ts-expect-error
                    const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
                        if (tabId === tabToUse.id && changeInfo.status === 'complete') {
                            //@ts-expect-error
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    };
                    //@ts-expect-error
                    chrome.tabs.onUpdated.addListener(listener);
                });
            }
            
            if (!tabToUse.id) {
                throw new Error('Failed to get tab ID');
            }
            
            //@ts-expect-error
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabToUse.id },
                world: 'MAIN',
                func: () => {
                    return fetch('https://selfservice.wit.edu/BannerGeneralSsb/ssb/PersonalInformationDetails/getEmails', {
                        credentials: 'include'
                    }).then(r => r.json()).catch(e => ({ error: e.message }));
                }
            });

            const data = results[0]?.result ?? { emails: [] };

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.emails) {
                data.emails.forEach((email: any) => {
                    if (email.emailType?.code === 'W') {
                        schoolEmail = email.emailAddress;
                    }
                });
            }

            if (shouldCloseTab && tabToUse.id) {
                //@ts-expect-error
                await chrome.tabs.remove(tabToUse.id);
            }

            signIn();
        } catch (err) {
            error = 'Failed to fetch data! Make';
        }
    }

    async function signIn() {
        try {
            const response = await fetch('https://heron-selected-literally.ngrok-free.app/api/user/onboard', {
                method: 'POST',
                body: JSON.stringify({email: schoolEmail}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                if (data.jwt) {
                    //@ts-expect-error
                    await chrome.storage.local.set({
                        jwt_token: data.jwt,
                    });
                }
            } else {
                throw new Error(data.message || 'Server is (probably) down! Please email mayonej@wit.edu!');
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
            goto('/onboard');
        } catch (err) {
            error = 'Server is (probably) down! Please email mayonej@wit.edu! Also, make';
        }
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen w-full px-4">
    <div class=" rounded-lg shadow-md p-8 flex flex-col items-center peak bg-surface-container-high">
        {#if error}
            <h1 class="text-3xl font-extrabold text-center text-error mb-4">Failed to sign in!</h1>
            <p class="text-center text-error-container mb-4 break">{error} sure you're logged in to <a class="text-primary underline" href="https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory" target="_blank">WIT Self Service</a>.</p>
            <Button variant="outlined" onclick={fetchSchoolEmail}>Try Again</Button>
        {:else}
            <h1 class="text-3xl font-extrabold text-center text-primary mb-6">Signing in!</h1>
            <LoadingIndicator size={64} />
        {/if}
    </div>
</div>

<style>
:global(.peak button) {
        height: 3rem !important;
    }

</style>