<script lang="ts">
    import type { Course, MeetingTime, ResponseData } from '$lib/types';
    import { Button, SelectOutlined, Tabs, TextFieldOutlined } from 'm3-svelte';
    import { fade, scale, slide } from 'svelte/transition';
    import { handleApiResponse } from '$lib/api';

    let data: ResponseData | undefined = $state(undefined);
    let jwt_token: string | undefined = $state(undefined);
    let processedData: Course[] | undefined = $state(undefined);
    let expandedCourses = $state(new Set<number>());
    let activeCourse: Course | undefined = $state(undefined);

    function toggleCourse(index: number) {
        const newSet = new Set(expandedCourses);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        expandedCourses = newSet;
    }

    function capitalizeFirstLetter(val: string) {
        return val.charAt(0).toUpperCase() + val.slice(1);
    }

    const dayOrder = [
        { key: 'monday', label: 'Monday', abbr: 'M', order: 0 },
        { key: 'tuesday', label: 'Tuesday', abbr: 'T', order: 1 },
        { key: 'wednesday', label: 'Wednesday', abbr: 'W', order: 2 },
        { key: 'thursday', label: 'Thursday', abbr: 'Th', order: 3 },
        { key: 'friday', label: 'Friday', abbr: 'F', order: 4 },
        { key: 'saturday', label: 'Saturday', abbr: 'Sa', order: 5 },
        { key: 'sunday', label: 'Sunday', abbr: 'Su', order: 6 }
    ];

    function splitMeetingByDays(meeting: MeetingTime) {
        const activeDays = dayOrder.filter(day => meeting[day.key as keyof MeetingTime]);

        if (activeDays.length <= 1) {
            return [{ meeting, day: activeDays[0] || null }];
        }

        return activeDays.map(day => ({ meeting, day }));
    }

    function getEarliestDayAndTime(course: Course): { dayOrder: number, time: string } {
        if (!course.meeting_times || course.meeting_times.length === 0) {
            return { dayOrder: 999, time: "99:99" };
        }

        let earliestDay = 999;
        let earliestTime = "99:99";

        for (const meeting of course.meeting_times) {
            for (const day of dayOrder) {
                if (meeting[day.key as keyof typeof meeting]) {
                    if (day.order < earliestDay || (day.order === earliestDay && meeting.begin_time < earliestTime)) {
                        earliestDay = day.order;
                        earliestTime = meeting.begin_time;
                    }
                }
            }
        }

        return { dayOrder: earliestDay, time: earliestTime };
    }

    function sortCoursesBySchedule(courses: Course[]): Course[] {
        return [...courses].sort((a, b) => {
            const aSchedule = getEarliestDayAndTime(a);
            const bSchedule = getEarliestDayAndTime(b);

            if (aSchedule.dayOrder !== bSchedule.dayOrder) {
                return aSchedule.dayOrder - bSchedule.dayOrder;
            }

            return aSchedule.time.localeCompare(bSchedule.time);
        });
    }

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
                const listener = (tabId: number, changeInfo: any) => {
                    if (tabId === tabToUse.id && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

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

        if (!tabToUse.id) return;

        const results = await chrome.scripting.executeScript({
            target: { tabId: tabToUse.id },
            world: 'MAIN',
            func: async () => {
                try {
					const r = await fetch('https://selfservice.wit.edu/StudentRegistrationSsb/ssb/classRegistration/getRegistrationEvents?termFilter=', {
						credentials: 'include'
					});
					return await r.json();
				} catch (e) {
					return ({ error: (e as Error).message });
				}
            }
        });

        const result = await chrome.storage.local.get('jwt_token');
        jwt_token = result.jwt_token;
        if (!jwt_token) {
            console.error('No JWT token found');
            return;
        }

        data = results[0]?.result ?? [];

        const newData = await fetch("https://heron-selected-literally.ngrok-free.app/api/process_courses", {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt_token}`
            }
        });

        const response = await handleApiResponse<{ classes: Course[] }>(newData);
        processedData = response.classes;

        if (shouldCloseTab && tabToUse.id) {
            await chrome.tabs.remove(tabToUse.id);
        }
    }

    let tab = $state("b");

    let notiTime = $state("30");
    let notiTimeType = $state("minutes");
    let courseColor = $state("#d50000");
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full px-3">
    {#if !processedData}
        <Button variant="filled" square onclick={fetchFromCurrentPage}>Fetch Data</Button>
    {:else}
        <Tabs secondary={true}
            items={[
                { name: "Calendar View", value: "b" },
                { name: "List View", value: "a" },
            ]}
            bind:tab
    />
    {/if}

    {#if tab === "a"}
        {#if processedData}
            {#each sortCoursesBySchedule(processedData) as course, index}
                <div class="flex flex-col w-full rounded-md bg-surface-container-low overflow-hidden">
                    <div class="flex flex-row justify-between items-center w-full p-4 gap-4">
                        <h1 class="text-md font-bold flex-1 min-w-0">
                            {course.title}
                        </h1>
                        <div class="shrink-0">
                            <Button
                                variant="tonal"
                                square
                                onclick={() => toggleCourse(index)}
                            >
                                <span style="display: inline-block; transition: transform 0.3s ease; transform: rotate({expandedCourses.has(index) ? '180deg' : '0deg'})">
                                    ↓
                                </span>
                            </Button>
                        </div>
                    </div>

                    {#if expandedCourses.has(index)}
                        <div transition:slide={{ duration: 300 }} class="px-4 pb-4">
                            <div class="flex flex-col gap-3 pt-2 border-t border-outline-variant">
                                <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium text-on-surface-variant">Course Number</span>
                                    <span class="text-sm">{course.course_number}</span>
                                </div>

                                <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium text-on-surface-variant">Schedule Type</span>
                                    <span class="text-sm">{capitalizeFirstLetter(course.schedule_type)}</span>
                                </div>

                                <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium text-on-surface-variant">Professor</span>
                                    <span class="text-sm">{capitalizeFirstLetter(course.professor.first_name)} {capitalizeFirstLetter(course.professor.last_name)}</span>
                                <span class="text-sm text-on-surface-variant"><a href={`mailto:${course.professor.email}`} class="text-primary">{course.professor.email}</a></span>
                                </div>

                                <div class="flex flex-col gap-1">
                                    <span class="text-sm font-medium text-on-surface-variant">Term</span>
                                    <span class="text-sm">{capitalizeFirstLetter(course.term.season)} {course.term.year}</span>
                                </div>

                                {#if course.meeting_times && course.meeting_times.length > 0}
                                    <div class="flex flex-col gap-2">
                                        <span class="text-sm font-medium text-on-surface-variant">Meeting Times</span>
                                        {#each course.meeting_times as meetingTime}
                                            {#each splitMeetingByDays(meetingTime) as { meeting, day }}
                                                <div class="flex flex-col gap-1 pl-2 border-l-2 border-primary">
                                                    <span class="text-sm">
                                                        {meeting.location.building.name} {meeting.location.room}
                                                    </span>
                                                    <span class="text-sm text-on-surface-variant">
                                                        {day ? day.label : ''}
                                                        • {meeting.begin_time} - {meeting.end_time}
                                                    </span>
                                                </div>
                                            {/each}
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    {:else if tab === "b"}
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
                                    <span class="text-xs text-on-surface-variant">{hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}</span>
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
                                                    class="absolute top-1 bottom-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-t-2 {isLab ? 'bg-tertiary-container border-tertiary' : 'bg-primary-container border-primary'}"
                                                    style="left: {startOffset}rem; width: {width}rem;"
                                                    onclick={() => {activeCourse = course}}
                                                >
                                                    <div class="font-medium truncate">{course.title}</div>
                                                    <div class="{isLab ? 'text-on-tertiary-container' : 'text-on-primary-container'} opacity-80">{meeting.begin_time} - {meeting.end_time}</div>
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
    {/if}
</div>

{#if activeCourse && tab === "b"}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-scrim/60 z-50 flex items-center justify-center p-4"
        role="button"
        tabindex="-1"
        onclick={() => activeCourse = undefined}
        onkeydown={(e) => e.key === 'Escape' && (activeCourse = undefined)}
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
                <h1 class="text-2xl font-bold mb-2">Edit Calendar Event</h1>
                <TextFieldOutlined label="Course Title" value={activeCourse.title} />
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

                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(.stuff-moment div.m3-container) {
        min-width: 7rem !important;
    }
</style>