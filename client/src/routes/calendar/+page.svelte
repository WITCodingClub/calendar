<script lang="ts">
    import { Button, Tabs } from 'm3-svelte';
    import { slide } from 'svelte/transition';
    import sampleData from './message.json';

    interface Building {
        name: string;
        abbreviation: string;
    }

    interface Location {
        building: Building;
        room: number;
    }

    interface MeetingTime {
        begin_time: number;
        end_time: number;
        start_date: string;
        end_date: string;
        location: Location;
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    }

    interface Term {
        uid: number;
        season: string;
        year: number;
    }

    interface Course {
        title: string;
        course_number: number;
        schedule_type: string;
        term: Term;
        meeting_times: MeetingTime[];
    }
    
    let data: any = $state(null);
    let jwt_token: string | null = $state(null);
    let processedData: Course[] | null = $state(null);
    let expandedCourses = $state(new Set<number>());

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

    function getEarliestDayAndTime(course: Course): { dayOrder: number, time: number } {
        if (!course.meeting_times || course.meeting_times.length === 0) {
            return { dayOrder: 999, time: 999999 };
        }

        let earliestDay = 999;
        let earliestTime = 999999;

        for (const meeting of course.meeting_times) {
            for (const day of dayOrder) {
                if (meeting[day.key as keyof MeetingTime]) {
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

            return aSchedule.time - bSchedule.time;
        });
    }

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

        //@ts-expect-error
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

        const response = await newData.json();
        processedData = response.classes;

        if (shouldCloseTab && tabToUse.id) {
            //@ts-expect-error
            await chrome.tabs.remove(tabToUse.id);
        }
    }

    let tab = $state("a");
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-10 w-full px-3">
    {#if !processedData}
        <Button variant="filled" square onclick={fetchFromCurrentPage}>Fetch Data</Button>
    {:else}
        <Tabs secondary={true}
            items={[
                { name: "List View", value: "a" },
                { name: "Calendar View", value: "b" },
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
                                                        • {new Date(meeting.begin_time * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(meeting.end_time * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
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
    {/if}
</div>