<script lang="ts">
    import { Button, TextField } from 'm3-svelte';

    let data: any = $state(null);

    async function fetchFromCurrentPage() {
        const targetUrl = 'https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory';
        
        const [currentTab] = await chrome.tabs.query({ 
            active: true, 
            currentWindow: true 
        });
        
        const isOnTargetPage = currentTab.url === targetUrl;
        let tabToUse = currentTab;
        let shouldCloseTab = false;
        
        if (!isOnTargetPage) {
            tabToUse = await chrome.tabs.create({ url: targetUrl });
            shouldCloseTab = true;
            
            await new Promise<void>((resolve) => {
                const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
                    if (tabId === tabToUse.id && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);
            });
        }
        
        if (!tabToUse.id) return;
        
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabToUse.id },
            world: 'MAIN',
            func: () => {
                return fetch('https://selfservice.wit.edu/StudentRegistrationSsb/ssb/classRegistration/getRegistrationEvents?termFilter=', {
                credentials: 'include'
                }).then(r => r.json()).catch(e => ({ error: e.message }));
            }
        });

        data = results[0]?.result;
        
        if (shouldCloseTab && tabToUse.id) {
            await chrome.tabs.remove(tabToUse.id);
        }
    }
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full">
    <div class="flex flex-row gap-2 mb-2">
        <h1 class="text-2xl font-bold roboto-flex-wit-main">WIT-Calendar</h1>
    </div>
    <p class="text-sm text-secondary">Verify your email to get started</p>
    <form class="flex gap-4 justify-center items-center">
        <TextField label="Email" />
        <Button variant="filled" square>Sign in</Button>
    </form>

    <Button variant="filled" square onclick={fetchFromCurrentPage}>Fetch Data</Button>
    
    {#if data}
        <pre class="text-xs bg-surface-container p-4 rounded max-w-4xl overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
    {/if}
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

    .roboto-flex-wit-other {
        font-size: 32px;
        font-family: "Roboto Flex", sans-serif;
        color: var(--color-primary);
        font-optical-sizing: 128;
        font-weight: 267;
        line-height: 0;
        font-style: normal;
        font-variation-settings:
            "slnt" 0,
            "wdth" 143,
            "GRAD" 0,
            "XOPQ" 175,
            "XTRA" 468,
            "YOPQ" 79,
            "YTAS" 750,
            "YTDE" -203,
            "YTFI" 738,
            "YTLC" 514,
            "YTUC" 712;
    }
</style>