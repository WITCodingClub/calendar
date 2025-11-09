<script lang="ts">
    import { goto } from '$app/navigation';
    import { processedData as storedProcessedData, icsUrl as storedIcsUrl } from '$lib/store';
    import type { Course, MeetingTime, ResponseData, TermResponse, DayItem, GetPreferencesResponse, EventPreferences, Preview, TemplateVariables } from '$lib/types';
    import { Button, LoadingIndicator, SelectOutlined, VariableTabs, TextFieldOutlined, ConnectedButtons, TextFieldOutlinedMultiline, Chip } from 'm3-svelte';
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { API } from '$lib/api';
    import Settings from '$lib/components/Settings.svelte';
    import Help from '$lib/components/Help.svelte';
    import { userSettings as storedUserSettings } from '$lib/store';
    import { browser } from '$app/environment';
    import { snackbar } from 'm3-svelte';

	let selected: string | undefined = $state(undefined);
	let responseData: ResponseData | undefined = $derived($storedProcessedData.find((d) => String(d.termId) === selected)?.responseData);
    let jwt_token: string | undefined = $state(undefined);
	let processedData: Course[] | undefined = $derived(responseData?.classes);
    let activeCourse: Course | undefined = $state(undefined);
    let activeMeeting: MeetingTime | undefined = $state(undefined);
    let activeDay: DayItem | undefined = $state(undefined);
    let loading = $state(false);
    let terms = $state<TermResponse | undefined>(undefined);
	let attemptedTerms = $state(new Set<string>());
    let militaryTime = $derived($storedUserSettings?.military_time ?? true);
    let lectureColor = $derived($storedUserSettings?.default_color_lecture ?? "#5484ed");
    let labColor = $derived($storedUserSettings?.default_color_lab ?? "#ffb878");
    let otherCalUser = $state(false);
    let currentEventPrefs = $state<GetPreferencesResponse | undefined>(undefined);
    let eventPreferences: EventPreferences | undefined = $derived(currentEventPrefs?.individual_preference);
    let preview: Preview | undefined = $derived(currentEventPrefs?.preview);
    let templates: TemplateVariables[] | undefined = $derived(currentEventPrefs?.templates);
    let editMode = $state(false);

    async function checkBetaAccess() {
        const beta_access = await chrome.storage.local.get('beta_access');
        if (beta_access && (beta_access.beta_access === 'false' || beta_access.beta_access === false)) {
            goto('/beta-access-denied/');
            return Promise.reject(new Error('Beta access denied')) as never;
        }
    }

	function convertTo12Hour(time24: string): string {
		if (militaryTime) return time24;
		const [hours, minutes] = time24.split(':').map(Number);
		const period = hours >= 12 ? 'PM' : 'AM';
		const hours12 = hours % 12 || 12;
		return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
	}

	function formatHourLabel(hour: number): string {
		if (militaryTime) return `${hour.toString().padStart(2, '0')}:00`;
		const period = hour >= 12 ? 'PM' : 'AM';
		const h12 = (hour % 12) || 12;
		return `${h12}:00 ${period}`;
	}

    const dayOrder: DayItem[] = [
        { key: 'monday', label: 'Monday', abbr: 'M', order: 0 },
        { key: 'tuesday', label: 'Tuesday', abbr: 'T', order: 1 },
        { key: 'wednesday', label: 'Wednesday', abbr: 'W', order: 2 },
        { key: 'thursday', label: 'Thursday', abbr: 'Th', order: 3 },
        { key: 'friday', label: 'Friday', abbr: 'F', order: 4 },
        { key: 'saturday', label: 'Saturday', abbr: 'Sa', order: 5 },
        { key: 'sunday', label: 'Sunday', abbr: 'Su', order: 6 }
    ];

    function getLatestEndHour(courses: Course[]): number {
        let latestHour = 8;

        for (const course of courses) {
            for (const meeting of course.meeting_times) {
                const endHour = parseInt(meeting.end_time.split(':')[0]);
                const endMin = parseInt(meeting.end_time.split(':')[1]);
                const roundedHour = endMin > 0 ? endHour + 1 : endHour;

                if (roundedHour > latestHour) {
                    latestHour = roundedHour;
                }
            }
        }

        return latestHour;
    }

    async function copyIcsToClipboard() {
        const icsUrlToCopy = responseData?.ics_url || $storedIcsUrl;
        if (!icsUrlToCopy) {
            console.error('No ICS URL available');
            return;
        }

        try {
            await navigator.clipboard.writeText(icsUrlToCopy);
            snackbar('ICS URL copied to clipboard!', undefined, true);
        } catch (error) {
            console.error('Failed to copy ICS URL to clipboard:', error);
            snackbar('Failed to copy ICS URL to clipboard: ' + error, undefined, true);
        }
    }

    async function fetchFromCurrentPage(term: string | undefined): Promise<{ ics_url: string } | undefined> {
        if (!term) return;
        let tabToUse: any;
        let shouldCloseTab = false;
        try {
            const targetUrl = 'https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/registrationHistory';

            const [currentTab] = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });

            const isOnTargetPage = currentTab.url === targetUrl;
            tabToUse = currentTab;
            if (!isOnTargetPage) {
                tabToUse = await chrome.tabs.create({ url: targetUrl });
                shouldCloseTab = true;

                await new Promise<void>((resolve) => {
                    const listener = (tabId: number, changeInfo: any) => {
                        if (tabId === tabToUse.id && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabToUse.id! },
                        func: () => {
                            return document.readyState === 'complete' &&
                                   typeof fetch !== 'undefined' &&
                                   document.body !== null;
                        }
                    });
                } catch (e) {
                    console.error('Page readiness check failed:', e);
                }
            }

            if (!tabToUse?.id) return;

            const results = await chrome.scripting.executeScript({
                target: { tabId: tabToUse.id },
                world: 'MAIN',
                func: async (termId: string) => {
                    try {
                        const r0 = await fetch(`https://selfservice.wit.edu/StudentRegistrationSsb/ssb/registrationHistory/reset?term=${termId}`, {
                            credentials: 'include'
                        });
                        await r0.json();
    					const r1 = await fetch('https://selfservice.wit.edu/StudentRegistrationSsb/ssb/classRegistration/getRegistrationEvents?termFilter=', {
    						credentials: 'include'
    					});
    					return await r1.json();
    				} catch (e) {
    					return ({ error: (e as Error).message });
    				}
                },
                args: [term]
            });

            const registrationData = results[0]?.result ?? [];
            const newData = await fetch(`${API.baseUrl}/process_courses`, {
                method: 'POST',
                body: JSON.stringify(registrationData),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt_token}`
                }
            });

            if (!newData.ok) {
                throw new Error(`Failed to process courses: ${newData.status} ${newData.statusText}`);
            }

            const response = await newData.json();
            if (typeof response === 'string') {
                return { ics_url: response };
            }
            return response;
        } catch (e) {
            console.error('Failed to fetch from current page:', e);
            return undefined;
        } finally {
            if (shouldCloseTab && tabToUse?.id) {
                await chrome.tabs.remove(tabToUse.id);
            }
        }
    }

    async function ensureProcessedForTerm(termId: string | undefined) {
        if (!termId || loading) return;
        try {
            loading = true;
            const status = await API.userIsProcessed(termId);
            if (status?.processed) {
                const events = await API.getProcessedEvents(termId);
                let ics = $storedIcsUrl;
                if (!ics) {
                    const icsResponse = await API.getIcsUrl();
                    ics = icsResponse.ics_url;
                    if (ics) {
                        storedIcsUrl.set(ics);
                    }
                }
                storedProcessedData.update((list) => {
                    const tid = String(termId);
                    const i = list.findIndex((x) => String(x.termId) === tid);
                    const next = [...list];
                    const response: ResponseData = { ics_url: ics ?? '', classes: events.classes };
                    if (i >= 0) next[i] = { termId: tid, responseData: response };
                    else next.push({ termId: tid, responseData: response });
                    return next;
                });
            } else {
                await runScrapeAndProcess(termId);
            }
        } catch (e) {
            snackbar('Failed to fetch calendar: ' + e, undefined, true);
            console.error('Failed to ensure processed for term:', e);
        } finally {
            loading = false;
        }
    }

    async function getEventPerfs(eventId: number) {
        const res = await fetch(`${API.baseUrl}/meeting_times/${eventId}/preference`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwt_token}`
            }
        });
        const data = await res.json();
        currentEventPrefs = data;
    }

    async function runScrapeAndProcess(termId: string | undefined) {
        if (!termId || loading) return;
        try {
            loading = true;
            const res = await fetchFromCurrentPage(termId);
            if (!res?.ics_url) {
                console.error('No ICS URL in response from fetchFromCurrentPage');
                snackbar('Failed to fetch calendar: No ICS URL in response', undefined, true);
                return;
            }
            storedIcsUrl.set(res.ics_url);
            const events = await API.getProcessedEvents(termId);
            storedProcessedData.update((list) => {
                const tid = String(termId);
                const i = list.findIndex((x) => String(x.termId) === tid);
                const next = [...list];
                const response: ResponseData = { ics_url: res.ics_url, classes: events.classes };
                if (i >= 0) next[i] = { termId: tid, responseData: response };
                else next.push({ termId: tid, responseData: response });
                snackbar('Calendar fetched successfully!', undefined, true);
                return next;
            });
        } catch (e) {
            console.error('Failed to scrape and process:', e);
            snackbar('Failed to fetch calendar: ' + e, undefined, true);
        } finally {
            loading = false;
        }
    }

    function checkIsOtherCalendar() {
        const stored = browser ? localStorage.getItem('isOtherCalendar') === 'true' : false;
        return stored;
    }

    async function saveEventPerfs() {
        console.log(editTitle, editDescription, editLocation);
    }

    let tab = $state("a");

    let notiTime = $state("30");
    let notiTimeType = $state("minutes");
    let courseColor = $state("#d50000");
    let editTitle = $state("");
    let editDescription = $state("");
    let editLocation = $state("");

    

    onMount(async () => {
        checkBetaAccess();
        jwt_token = await API.getJwtToken();
        terms = await API.getTerms();
        storedUserSettings.set(await API.userSettings());
        otherCalUser = checkIsOtherCalendar();
    });

    $effect(() => {
        if (terms && !selected) {
            const initial = terms?.current_term?.id ?? terms?.next_term?.id;
            selected = initial != null ? String(initial) : undefined;
        }
    });

    $effect(() => {
        if (selected && !$storedProcessedData.some((d) => String(d.termId) === selected) && !loading && !attemptedTerms.has(selected)) {
            const next = new Set(attemptedTerms);
            next.add(selected);
            attemptedTerms = next;
            ensureProcessedForTerm(selected);
        }
    });

    $effect(() => {
        if (currentEventPrefs && activeCourse) {
            editTitle = preview?.title ?? activeCourse.title;
            editDescription = preview?.description ?? '';
            editLocation = preview?.location ?? '';
        }
    });
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-4 w-full px-3">
    {#if !processedData}
        <div class="w-full flex flex-col items-center gap-6 p-6 bg-surface-container-lowest rounded-md shadow-md border border-outline-variant max-w-lg mx-auto">
            <div class="flex flex-col gap-1 items-center">
                <h1 class="text-xl font-bold text-primary text-center mb-1">Get Your Calendar</h1>
                <p class="text-md text-secondary text-center">
                    Click the button below to fetch your classes and generate your calendar.
                    If you've linked your Google Calendar, your events will be added there as well!
                </p>
            </div>
            <div class="flex flex-col items-center peak gap-2">
                {#if loading}
                    <LoadingIndicator size={44} />
                {:else}
                    <Button
                        variant="filled"
                        square
                        onclick={() => runScrapeAndProcess(selected)}
                    >
                    <span class="flex flex-row gap-2 items-center">
                        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" fill="#FFF3"/><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" stroke-linecap="round"/><circle cx="7.5" cy="15.5" r="1.25" fill="currentColor"/><circle cx="12" cy="15.5" r="1.25" fill="currentColor"/><circle cx="16.5" cy="15.5" r="1.25" fill="currentColor"/></svg>
                        Get Calendar
                    </span>
                </Button>
                {/if}
            </div>
        </div>
    {:else}
        <div>
            <div class="flex flex-col gap-1 items-center">
                <h1 class="text-xl font-bold text-primary text-center mb-1">Your Calendar</h1>
                <p class="text-md text-secondary text-center">
                    Copy the link below and add it to your calendar app.
                </p>
                {#if otherCalUser}
                    <div class="flex flex-row gap-2 items-center">
                        <Button variant="outlined" square onclick={copyIcsToClipboard}>Copy Calendar Link</Button>
                    </div>
                {/if}
            </div>
        </div>
        <div class="not-peak">
            <VariableTabs secondary={true}
                items={[
                    { name: "Calendar", value: "a" },
                    { name: "Settings", value: "settings" }, 
                    { name: "Help", value: "help" },
                ]}
                bind:tab
            />
        </div>
        <hr class="w-full border-outline-variant" />
        {#if tab == "a"}
            <ConnectedButtons>
                <input type="radio" name="seg" id="seg-a" bind:group={selected} value={terms?.current_term.id?.toString()} onchange={async () => { const tid = terms?.current_term.id?.toString(); if (tid && !$storedProcessedData.some((d) => String(d.termId) === tid) && !attemptedTerms.has(tid) && !loading) { const next = new Set(attemptedTerms); next.add(tid); attemptedTerms = next; await ensureProcessedForTerm(tid); } }} />
                <Button for="seg-a" variant="filled">{terms?.current_term.name}</Button>
                <input type="radio" name="seg" id="seg-b" bind:group={selected} value={terms?.next_term.id?.toString()} onchange={async () => { const tid = terms?.next_term.id?.toString(); if (tid && !$storedProcessedData.some((d) => String(d.termId) === tid) && !attemptedTerms.has(tid) && !loading) { const next = new Set(attemptedTerms); next.add(tid); attemptedTerms = next; await ensureProcessedForTerm(tid); } }} />
                <Button for="seg-b" variant="filled">{terms?.next_term.name}</Button>
            </ConnectedButtons>
        {/if}
    {/if}

    {#if tab === "a"}
        {#if processedData}
            {@const latestHour = getLatestEndHour(processedData)}
            {@const numHours = latestHour - 8 + 1}
            <div class="flex flex-col w-full h-full overflow-hidden">
                <div class="flex-1 overflow-x-auto overflow-y-hidden">
                    <div class="inline-flex flex-col min-w-full h-full">
                        <div class="flex flex-row border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-10">
                            <div class="w-24 border-r border-outline-variant"></div>
                            {#each Array(numHours) as _, i}
                                {@const hour = i + 8}
                                <div class="w-32 border-r border-outline-variant flex items-center justify-center py-2">
									<span class="text-xs text-on-surface-variant">{formatHourLabel(hour)}</span>
                                </div>
                            {/each}
                        </div>

                        {#each dayOrder.slice(0, 5) as day}
                            <div class="flex flex-row flex-1 min-h-[120px] border-b border-outline-variant relative">
                                <div class="w-24 border-r border-outline-variant flex items-center justify-center bg-surface-container-low left-0 z-5">
                                    <span class="font-medium text-sm">{day.label}</span>
                                </div>

                                <div class="relative flex-1 flex">
                                    {#each Array(numHours) as _}
                                        <div class="w-32 border-r border-outline-variant"></div>
                                    {/each}

                                    {#each processedData as course}
                                        {#each course.meeting_times as meeting}
                                            {#if meeting[day.key as keyof MeetingTime]}
                                                {@const startHour = parseInt(meeting.begin_time.split(':')[0])}
                                                {@const startMin = parseInt(meeting.begin_time.split(':')[1])}
                                                {@const endHour = parseInt(meeting.end_time.split(':')[0])}
                                                {@const endMin = parseInt(meeting.end_time.split(':')[1])}
                                                {@const startOffset = ((startHour - 8) * 60 + startMin) / 60 * 8}
                                                {@const width = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60 * 8}
                                                {@const isLab = course.schedule_type.toLowerCase() === 'laboratory'}


                                                <button
                                                    class="absolute top-1 bottom-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-t-2"
                                                    style="background-color: {isLab ? labColor : lectureColor}; left: {startOffset}rem; width: {width}rem; border-color: {isLab ? labColor : lectureColor};"
                                                    onclick={() => {activeCourse = course; activeMeeting = meeting; activeDay = day; getEventPerfs(meeting.id)}}
                                                >
                                                    <div class="font-medium truncate">{course.title}</div>
													<div class="{isLab ? 'text-on-tertiary-container' : 'text-on-primary-container'} opacity-80">{convertTo12Hour(meeting.begin_time)} - {convertTo12Hour(meeting.end_time)}</div>
                                                    <div class="{isLab ? 'text-on-tertiary-container' : 'text-on-primary-container'} opacity-70 text-[10px]">{meeting.location.building.abbreviation} {meeting.location.room}</div>
                                                </button>
                                            {/if}
                                        {/each}
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
        {:else if tab === "settings"}
            <Settings />
        {:else if tab === "help"}
            <Help />
    {/if}
</div>

{#if activeCourse && tab === "a"}
    {#if currentEventPrefs}
        <div
            transition:fade={{ duration: 200 }}
            class="fixed inset-0 bg-scrim/60 z-50 flex items-center justify-center p-4"
            role="button"
            tabindex="-1"
            onclick={() => {activeCourse = undefined; activeMeeting = undefined; activeDay = undefined; notiTime = "30"; notiTimeType = "minutes"; courseColor = "#d50000"; currentEventPrefs = undefined; editTitle = ""; editDescription = ""; editLocation = "";}}
            onkeydown={(e) => e.key === 'Escape' && ((activeCourse = undefined), (activeMeeting = undefined), (activeDay = undefined), (notiTime = "30"), (notiTimeType = "minutes"), (courseColor = "#d50000"), (currentEventPrefs = undefined), (editTitle = ""), (editDescription = ""), (editLocation = ""))}
        >
            <div
                transition:scale={{ duration: 200, start: 0.95 }}
                class="bg-surface-container-low rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                tabindex="-1"
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => e.stopPropagation()}
            >
                <div class="flex flex-col gap-4 p-6">
                    <div class="mb-2 flex flex-row gap-2 items-center">
                        <h1 class="text-2xl font-bold">Edit Calendar Event</h1>
                        <Chip selected={editMode} variant="input" onclick={() => {editMode = !editMode}}>Edit Mode</Chip>
                    </div>
                    <TextFieldOutlined label="Course Title" bind:value={editTitle} />
                    <TextFieldOutlinedMultiline label="Course Description" bind:value={editDescription} rows={1} />
                    <TextFieldOutlined label="Course Location" bind:value={editLocation} />
                    <div class="flex flex-col gap-3">
                        <h2 class="text-md">Remind me before class</h2>
                        <div class="flex flex-row gap-2 items-center stuff-moment">
                            <TextFieldOutlined type="number" label="" bind:value={notiTime} />
                            <SelectOutlined label=""
                                options={[
                                { text: "minutes", value: "minutes" },
                                { text: "hours", value: "hours" },
                                { text: "days", value: "days" },
                                ]}
                                bind:value={notiTimeType}
                            />
                        </div>
                        <h2 class="text-md">Color</h2>
                        <div class="flex flex-row gap-2 items-center">
                            <div class="w-6 h-6 rounded-full border-2 border-outline other-stuff" style="background-color: {courseColor};"></div>
                            <SelectOutlined label=""
                                options={[
                                    { text: "Tomato", value: "#d50000" },
                                    { text: "Flamingo", value: "#e67c73" },
                                    { text: "Tangerine", value: "#f4511e" },
                                    { text: "Banana", value: "#f6bf26" },
                                    { text: "Sage", value: "#33b679" },
                                    { text: "Basil", value: "#0b8043" },
                                    { text: "Peacock", value: "#039be5" },
                                    { text: "Blueberry", value: "#3f51b5" },
                                    { text: "Lavender", value: "#7986cb" },
                                    { text: "Grape", value: "#8e24aa" },
                                    { text: "Graphite", value: "#616161" },
                                ]}
                                bind:value={courseColor}
                            />
                        </div>
                        <Button variant="outlined" square onclick={saveEventPerfs}>Save</Button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
{/if}

<style>
    :global(.stuff-moment div.m3-container) {
        min-width: 7rem !important;
    }

    :global(.peak button) {
        height: 2.5rem !important;
    }

</style>