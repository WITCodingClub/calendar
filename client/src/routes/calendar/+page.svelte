<script lang="ts">
    import { Button, TextField } from 'm3-svelte';

    interface Course {
        id: number;
        title: string;
        start: string;
        end: string;
        editable: boolean;
        allDay: boolean;
        className: string;
        term: number;
        crn: number;
        subject: string;
        courseNumber: number;
    }
    
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

        const rawData = results[0]?.result ?? [];
        if (!Array.isArray(rawData)) {
            data = [];
        } else {
            const seenCrns = new Set<string|number>();
            data = rawData.filter((course: any) => {
                if (!course?.crn) return false;
                if (seenCrns.has(course.crn)) return false;
                seenCrns.add(course.crn);
                return true;
            });
        }

        
        if (shouldCloseTab && tabToUse.id) {
            //@ts-expect-error
            await chrome.tabs.remove(tabToUse.id);
        }
    }
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full px-3">
    <Button variant="filled" square onclick={fetchFromCurrentPage}>Fetch Data</Button>
    
    {#if data}
        {#each data as course}
            <div class="flex flex-row justify-between items-center w-full p-4 rounded-md bg-surface-container-low gap-4">
                <h1 class="text-md font-bold flex-1 min-w-0">
                    {course.title}
                </h1>
                <div class="shrink-0">
                    <Button 
                        variant="filled" 
                        square 
                    >
                        Add to Calendar
                    </Button>
                </div>
            </div>
        {/each}
    {/if}
</div>