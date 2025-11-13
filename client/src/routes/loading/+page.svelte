<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { LoadingIndicator, Button } from 'm3-svelte';
    import { API } from '$lib/api';
    import { EnvironmentManager } from '$lib/environment';
    import { snackbar } from 'm3-svelte';

    let schoolEmail = $state('');
    let error = $state<string | null>(null);

    onMount(async () => {
        // Migrate old JWT token format if needed
        await EnvironmentManager.migrateOldJwtToken();
        fetchSchoolEmail();
    });

    async function fetchSchoolEmail() {
        try {
            error = null;
            const targetUrl = 'https://selfservice.wit.edu/BannerGeneralSsb/ssb/PersonalInformationDetails/getEmails';
            
            const [currentTab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
            
            const isOnTargetPage = currentTab.url === targetUrl;
            let tabToUse = currentTab;
            let shouldCloseTab = true;
            
            if (!isOnTargetPage) {
                tabToUse = await chrome.tabs.create({ url: targetUrl });
                shouldCloseTab = true;
                
                await new Promise<void>((resolve) => {
                    const listener = (tabId: number, changeInfo: any) => {
                        if (tabId === tabToUse.id && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    }
                    chrome.tabs.onUpdated.addListener(listener);
                });
            }
            
            if (!tabToUse.id) {
                throw new Error('Failed to get tab ID');
            }
            
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
                await chrome.tabs.remove(tabToUse.id);
            }

            signIn();
        } catch (err) {
            error = 'Failed to fetch data! Make';
            snackbar('Failed to fetch data: ' + err, undefined, true);
        }
    }

    async function signIn() {
        try {
            const baseUrl = await API.baseUrl;
            const response = await fetch(`${baseUrl}/user/onboard`, {
                method: 'POST',
                body: JSON.stringify({email: schoolEmail}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json() as { jwt?: string; message?: string; error?: string; beta_access?: boolean };

            if (data && data.beta_access === false) {
                await chrome.storage.local.set({ beta_access: false });
                goto('/beta-access-denied/');
                return Promise.reject(new Error('Beta access denied')) as never;
            }

            if (response.ok) {
                if (data.jwt) {
                    await EnvironmentManager.setJwtToken(data.jwt);
                }
            } else {
                throw new Error(data.message || 'Server is (probably) down! Please email mayonej@wit.edu!');
            }

            await new Promise(resolve => setTimeout(resolve, 1500));
            goto('/onboard');
        } catch (err) {
            error = 'Server is (probably) down! Please email mayonej@wit.edu! Also, make';
            snackbar('Failed to sign in: ' + err, undefined, true);
        }
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen w-full px-4">
    <div class=" rounded-lg shadow-md p-8 flex flex-col items-center peak {error ? 'bg-error' : 'bg-surface-container-high'}">
        {#if error}
            <h1 class="text-3xl font-extrabold text-center text-on-error mb-4">Failed to sign in!</h1>
            <p class="text-center text-error-container mb-4 break">{error} sure you're logged in to <a class="text-on-error underline" href="https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory" target="_blank">WIT Self Service</a>.</p>
            <Button variant="elevated" square onclick={fetchSchoolEmail}>Try Again</Button>
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