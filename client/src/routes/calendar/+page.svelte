<script lang="ts">
    import { Button, TextField } from 'm3-svelte';
    
    let data: any = $state(null);

    async function fetchFromCurrentPage() {
        const targetUrl = 'https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory';
        
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
        
        if (!tabToUse.id) return;
        
        //@ts-expect-error
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
            //@ts-expect-error
            await chrome.tabs.remove(tabToUse.id);
        }
    }
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full">
    <Button variant="filled" square onclick={fetchFromCurrentPage}>Fetch Data</Button>
    
    {#if data}
        <pre class="text-xs bg-surface-container p-4 rounded max-w-4xl overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
    {/if}
</div>