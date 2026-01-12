<script lang="ts">
    import { processedData as storedProcessedData, userSettings as storedUserSettings } from '$lib/store';
    import type { Course, MeetingTime, DayItem } from '$lib/types';
    import { fade, scale } from 'svelte/transition';
    import { Chip, SelectOutlined, TextFieldOutlined, VariableTabs } from 'm3-svelte';
    import friendSample2 from './user2.json';
    import friendSample3 from './user3.json';
    import friendSample4 from './user4.json';

    let selected = $state<string | undefined>(undefined);
    let processedData: Course[] | undefined = $derived(
        $storedProcessedData.find((d) => String(d.termId) === selected)?.responseData.classes
    );
    let militaryTime = $derived($storedUserSettings?.military_time ?? true);
    let lectureColor = $derived($storedUserSettings?.default_color_lecture ?? "#039be5");
    let labColor = $derived($storedUserSettings?.default_color_lab ?? "#f6bf26");
    let primaryUser = $state<string>('you');

    let activeCourse = $state<Course | undefined>(undefined);
    let activeMeeting = $state<MeetingTime | undefined>(undefined);
    let activeDay = $state<DayItem | undefined>(undefined);

    type FriendData = { id: string; name: string; data: typeof friendSample2 };

    const friendSamples: FriendData[] = [
        { id: 'friend-2', name: 'Daniel', data: friendSample2 },
        { id: 'friend-3', name: 'Jasper', data: friendSample3 },
        { id: 'friend-4', name: 'Jojo', data: friendSample4 }
    ];

    function parseTimeToMinutes(timeStr: string): number {
        const trimmed = timeStr.trim();
        const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (ampmMatch) {
            let hours = Number(ampmMatch[1]);
            const minutes = Number(ampmMatch[2]);
            const isPm = ampmMatch[3].toUpperCase() === 'PM';
            if (hours === 12) hours = 0;
            const total = hours + (isPm ? 12 : 0);
            return total * 60 + minutes;
        }
        const parts = trimmed.split(':');
        const h = Number(parts[0]);
        const m = Number(parts[1] ?? 0);
        return h * 60 + m;
    }

    function to24Hour(timeStr: string): string {
        const mins = parseTimeToMinutes(timeStr);
        return minutesToHHMM(mins);
    }

    function minutesToHHMM(total: number): string {
        const h = Math.floor(total / 60);
        const m = total % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    function mapFriendCourses(data: typeof friendSample2, friendId: string): Course[] {
        return data.processed_courses.map((c, ci) => ({
            title: c.title,
            prefix: c.subject,
            course_number: c.course_number,
            schedule_type: c.schedule_type,
            term: { uid: c.term.uid, season: c.term.season, year: c.term.year },
            professor: {
                first_name: c.instructors[0]?.first_name ?? '',
                last_name: c.instructors[0]?.last_name ?? '',
                email: c.instructors[0]?.email ?? ''
            },
            meeting_times: c.meeting_times.map((m, mi) => {
                const begin = to24Hour(m.begin_time);
                const end = to24Hour(m.end_time);
                const dayKey = m.day_of_week as DayItem['key'];
                return {
                    id: `${friendId}-${ci}-${mi}-${dayKey}`,
                    begin_time: begin,
                    end_time: end,
                    start_date: m.start_date,
                    end_date: m.end_date,
                    location: {
                        building: {
                            name: m.location.building.name,
                            abbreviation: m.location.building.abbreviation
                        },
                        room: m.location.room
                    },
                    monday: dayKey === 'monday',
                    tuesday: dayKey === 'tuesday',
                    wednesday: dayKey === 'wednesday',
                    thursday: dayKey === 'thursday',
                    friday: dayKey === 'friday',
                    saturday: dayKey === 'saturday',
                    sunday: dayKey === 'sunday'
                };
            })
        }));
    }

    const friendList: Array<{ id: string; name: string; courses: Course[] }> = friendSamples.map((f) => ({
        id: f.id,
        name: f.name,
        courses: mapFriendCourses(f.data, f.id)
    }));

    let selectedFriends = $state<string[]>(friendList.length ? [friendList[0].id] : []);

    type CalendarBlock = {
        course: Course;
        meeting: MeetingTime;
        startTotal: number;
        endTotal: number;
        ownerId: string;
        ownerPriority: number;
        isPrimary: boolean;
    };

    function convertTo12Hour(time24: string): string {
        if (militaryTime) return time24;
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    function getTextColor(bgColor: string): string {
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
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

    let meetMinDurationMinutesInput = $state<string>('30');
    let meetBufferMinutesInput = $state<string>('10');
    let meetMinDurationMinutes = $derived(Math.max(0, Math.floor(Number(meetMinDurationMinutesInput) || 0)));
    let meetBufferMinutes = $derived(Math.max(0, Math.floor(Number(meetBufferMinutesInput) || 0)));
    let meetBetweenClassesOnly = $state<boolean>(false);
    let meetRangeStartInput = $state<string>('08:00');
    let meetRangeEndInput = $state<string>('20:00');
    let meetRangeStart = $derived(Math.max(8 * 60, Math.min(20 * 60, parseTimeToMinutes(meetRangeStartInput))));
    let meetRangeEnd = $derived(Math.max(8 * 60, Math.min(20 * 60, parseTimeToMinutes(meetRangeEndInput))));
    let meetRangeValid = $derived(meetRangeEnd > meetRangeStart);

    type MeetWindow = { start: number; end: number; duration: number };
    type MeetInterval = { start: number; end: number };

    let tab = $state<'calendar' | 'meeting'>('calendar');

    let bestMeetTimesByDay = $derived.by(() => {
        const dayStart = meetRangeStart;
        const dayEnd = meetRangeEnd;
        if (!meetRangeValid) return {};

        const selectedFriendCourses = friendList
            .filter((f) => selectedFriends.includes(f.id))
            .flatMap((f) => f.courses);

        const weekdays = dayOrder.slice(0, 5).map((d) => d.key);
        const byDay: Record<string, MeetWindow[]> = {};

        if (selectedFriendCourses.length === 0) {
            for (const key of weekdays) byDay[key] = [];
            return byDay;
        }

        const meetingOccursOnDay = (meeting: MeetingTime, dayKey: DayItem['key']): boolean => {
            return Boolean((meeting as unknown as Record<string, boolean>)[dayKey]);
        };

        const collectBusyIntervals = (dayKey: DayItem['key']): MeetInterval[] => {
            const intervals: MeetInterval[] = [];
            for (const course of selectedFriendCourses) {
                for (const meeting of course.meeting_times) {
                    if (!meetingOccursOnDay(meeting, dayKey)) continue;
                    const rawStart = parseTimeToMinutes(meeting.begin_time);
                    const rawEnd = parseTimeToMinutes(meeting.end_time);
                    if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) continue;
                    const start = Math.max(dayStart, rawStart - meetBufferMinutes);
                    const end = Math.min(dayEnd, rawEnd + meetBufferMinutes);
                    if (end <= start) continue;
                    intervals.push({ start, end });
                }
            }
            intervals.sort((a, b) => (a.start - b.start) || (a.end - b.end));
            return intervals;
        };

        const mergeIntervals = (sorted: MeetInterval[]): MeetInterval[] => {
            const merged: MeetInterval[] = [];
            for (const it of sorted) {
                const last = merged[merged.length - 1];
                if (!last || it.start > last.end) {
                    merged.push({ start: it.start, end: it.end });
                    continue;
                }
                last.end = Math.max(last.end, it.end);
            }
            return merged;
        };

        const windowsFromMerged = (merged: MeetInterval[]): MeetWindow[] => {
            const windows: MeetWindow[] = [];
            if (meetBetweenClassesOnly) {
                for (let i = 0; i < merged.length - 1; i++) {
                    const start = merged[i].end;
                    const end = merged[i + 1].start;
                    const dur = end - start;
                    if (dur >= meetMinDurationMinutes) windows.push({ start, end, duration: dur });
                }
                return windows;
            }

            let cursor = dayStart;
            for (const b of merged) {
                if (b.start > cursor) {
                    const dur = b.start - cursor;
                    if (dur >= meetMinDurationMinutes) {
                        windows.push({ start: cursor, end: b.start, duration: dur });
                    }
                }
                cursor = Math.max(cursor, b.end);
            }
            if (cursor < dayEnd) {
                const dur = dayEnd - cursor;
                if (dur >= meetMinDurationMinutes) {
                    windows.push({ start: cursor, end: dayEnd, duration: dur });
                }
            }
            return windows;
        };

        for (const key of weekdays) {
            const merged = mergeIntervals(collectBusyIntervals(key as DayItem['key']));
            if (merged.length === 0) {
                byDay[key] = [];
                continue;
            }
            const windows = windowsFromMerged(merged);
            windows.sort((a, b) => (b.duration - a.duration) || (a.start - b.start));
            byDay[key] = windows.slice(0, 3);
        }

        return byDay;
    });

    type PositionedMeeting = {
        course: Course;
        meeting: MeetingTime;
        startOffset: number;
        width: number;
        startTotal: number;
        endTotal: number;
        bgColor: string;
        textColor: string;
        stackIndex: number;
        overlapCount: number;
        ownerId: string;
        ownerPriority: number;
        isPrimary: boolean;
    };

    const stackGapPct = 2;

    let stackedMeetings = $derived.by(() => {
        const selectedFriendCourses = friendList
            .filter((f) => selectedFriends.includes(f.id))
            .map((f) => ({ id: f.id, courses: f.courses }));

        const ownerEntries: Array<{ id: string; courses: Course[]; isPrimary: boolean }> = [];

        if (primaryUser === 'you') {
            if (processedData) {
                ownerEntries.push({ id: 'you', courses: processedData, isPrimary: true });
            }
        } else {
            const primaryFriend = selectedFriendCourses.find((f) => f.id === primaryUser) ?? friendList.find((f) => f.id === primaryUser);
            if (primaryFriend) {
                ownerEntries.push({ id: primaryFriend.id, courses: primaryFriend.courses, isPrimary: true });
            }
        }

        if (primaryUser !== 'you' && processedData) {
            ownerEntries.push({ id: 'you', courses: processedData, isPrimary: false });
        }

        for (const entry of selectedFriendCourses) {
            if (entry.id === primaryUser) continue;
            ownerEntries.push({ id: entry.id, courses: entry.courses, isPrimary: false });
        }

        if (ownerEntries.length === 0) {
            return { byDay: {}, maxStacksByDay: {} };
        }

        const collectIntervals = (courses: Course[], ownerId: string, ownerPriority: number, isPrimary: boolean): CalendarBlock[] => {
            const blocks: CalendarBlock[] = [];
            for (const course of courses) {
                for (const meeting of course.meeting_times) {
                    const startTotal = parseTimeToMinutes(meeting.begin_time);
                    const endTotal = parseTimeToMinutes(meeting.end_time);
                    for (const { key } of dayOrder) {
                        if (!(meeting as any)[key]) continue;
                        blocks.push({ course, meeting, startTotal, endTotal, ownerId, ownerPriority, isPrimary });
                    }
                }
            }
            return blocks;
        };

        const allBlocks = ownerEntries.flatMap((entry, idx) => collectIntervals(entry.courses, entry.id, idx, entry.isPrimary));

        const byDay: Record<string, PositionedMeeting[]> = {};
        const maxStacksByDay: Record<string, number> = {};

        for (const { key } of dayOrder) {
            const seen = new Set<string>();
            const blocks = allBlocks.filter((b) => {
                if (!(b.meeting as any)[key]) return false;
                const k = `${b.ownerId}-${b.startTotal}-${b.endTotal}-${b.course.title}`;
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            });
            if (blocks.length === 0) {
                byDay[key] = [];
                maxStacksByDay[key] = 1;
                continue;
            }

            blocks.sort((a, b) => {
                if (a.startTotal !== b.startTotal) return a.startTotal - b.startTotal;
                if (a.endTotal !== b.endTotal) return a.endTotal - b.endTotal;
                return a.ownerPriority - b.ownerPriority;
            });

            const arr: PositionedMeeting[] = [];
            const stackEnds: number[] = [];
            const active: PositionedMeeting[] = [];

            for (const block of blocks) {
                for (let i = active.length - 1; i >= 0; i--) {
                    if (block.startTotal >= active[i].endTotal) {
                        active.splice(i, 1);
                    }
                }

                const startHour = Math.floor(block.startTotal / 60);
                const startMin = block.startTotal % 60;
                const startOffset = ((startHour - 8) * 60 + startMin) / 60 * 8;
                const width = (block.endTotal - block.startTotal) / 60 * 8;
                const isLab = block.course.schedule_type.toLowerCase() === 'laboratory';
                const baseColor = block.meeting.color ?? (isLab ? labColor : lectureColor);
                const textColor = getTextColor(baseColor);
                const currentOverlap = active.length + 1;
                const item: PositionedMeeting = {
                    course: block.course,
                    meeting: block.meeting,
                    startOffset,
                    width,
                    startTotal: block.startTotal,
                    endTotal: block.endTotal,
                    bgColor: baseColor,
                    textColor,
                    stackIndex: 0,
                    overlapCount: currentOverlap,
                    ownerId: block.ownerId,
                    ownerPriority: block.ownerPriority,
                    isPrimary: block.isPrimary
                };

                for (const a of active) {
                    a.overlapCount = Math.max(a.overlapCount, currentOverlap);
                }

                let stack = stackEnds.findIndex((end) => item.startTotal >= end);
                if (stack === -1) {
                    stack = stackEnds.length;
                    stackEnds.push(item.endTotal);
                } else {
                    stackEnds[stack] = item.endTotal;
                }
                item.stackIndex = stack;

                active.push(item);
                arr.push(item);
            }

            const componentIds = new Array(arr.length).fill(-1);
            let component = 0;
            for (let i = 0; i < arr.length; i++) {
                if (componentIds[i] !== -1) continue;
                const queue = [i];
                componentIds[i] = component;
                while (queue.length) {
                    const idx = queue.pop()!;
                    for (let j = 0; j < arr.length; j++) {
                        if (componentIds[j] !== -1) continue;
                        if (arr[idx].startTotal < arr[j].endTotal && arr[j].startTotal < arr[idx].endTotal) {
                            componentIds[j] = component;
                            queue.push(j);
                        }
                    }
                }
                component++;
            }

            const componentMax = new Array(component).fill(1);
            for (let c = 0; c < component; c++) {
                const points: Array<{ time: number; delta: number }> = [];
                for (let i = 0; i < arr.length; i++) {
                    if (componentIds[i] !== c) continue;
                    points.push({ time: arr[i].startTotal, delta: 1 });
                    points.push({ time: arr[i].endTotal, delta: -1 });
                }
                points.sort((a, b) => (a.time - b.time) || (a.delta - b.delta));
                let activeCount = 0;
                let peak = 0;
                for (const p of points) {
                    activeCount += p.delta;
                    if (activeCount > peak) peak = activeCount;
                }
                componentMax[c] = Math.max(peak, 1);
            }

            for (let i = 0; i < arr.length; i++) {
                arr[i].overlapCount = componentMax[componentIds[i]];
            }

            const dayMax = Math.max(...componentMax, 1);
            byDay[key] = arr;
            maxStacksByDay[key] = dayMax;
        }

        return { byDay, maxStacksByDay };
    });

    function getLatestEndHourFromBlocks(): number {
        let latest = 8;
        for (const { key } of dayOrder) {
            for (const item of stackedMeetings.byDay?.[key] ?? []) {
                const endHour = Math.floor(item.endTotal / 60);
                const endMin = item.endTotal % 60;
                const rounded = endMin > 0 ? endHour + 1 : endHour;
                if (rounded > latest) latest = rounded;
            }
        }
        return latest;
    }

    $effect(() => {
        if (!selected && $storedProcessedData.length > 0) {
            selected = String($storedProcessedData[0].termId);
        }
    });
</script>

<div class="flex flex-col gap-4 justify-center items-center h-full mt-4 w-full px-3">
    <div class="flex flex-col gap-3 w-full max-w-3xl">
        <div class="flex flex-row gap-3 items-center flex-wrap">
            <div class="text-sm text-on-surface-variant">Friends:</div>
            {#each friendList as friend}
                <Chip
                    variant="input"
                    selected={selectedFriends.includes(friend.id)}
                    onclick={() => {
                        const exists = selectedFriends.includes(friend.id);
                        const next = exists
                            ? selectedFriends.filter((id) => id !== friend.id)
                            : [...selectedFriends, friend.id];
                        selectedFriends = next;
                        if (primaryUser !== 'you' && !next.includes(primaryUser)) {
                            primaryUser = 'you';
                        }
                    }}
                >
                    {friend.name}
                </Chip>
            {/each}
        </div>
        <div class="flex flex-row gap-3 items-center">
            <div class="text-sm text-on-surface-variant">Primary:</div>
            <SelectOutlined
                label=""
                options={[
                    { text: 'You', value: 'you' },
                    ...friendList
                        .filter((f) => selectedFriends.includes(f.id))
                        .map((f) => ({ text: f.name, value: f.id }))
                ]}
                bind:value={primaryUser}
            />
        </div>
    </div>
    <div class="w-full max-w-3xl">
        <VariableTabs
            secondary={true}
            items={[
                { name: 'Calendar', value: 'calendar' },
                { name: 'Meeting Times', value: 'meeting' }
            ]}
            bind:tab
        />
    </div>

    {#if tab === 'calendar'}
        {#if Object.values(stackedMeetings.byDay ?? {}).some((arr) => arr.length > 0)}
            {@const latestHour = getLatestEndHourFromBlocks()}
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
                            {@const dayEvents = stackedMeetings.byDay?.[day.key] ?? []}
                            {@const dayStacks = Math.max(stackedMeetings.maxStacksByDay?.[day.key] ?? 1, 1)}
                            {@const dayHeight = Math.min(Math.max(120, dayStacks * 52), 190)}
                            <div class="flex flex-row flex-1 border-b border-outline-variant relative" style={`height:${dayHeight}px; min-height:${dayHeight}px;`}>
                                <div class="w-24 border-r border-outline-variant flex items-center justify-center bg-surface-container-low left-0 z-5">
                                    <span class="font-medium text-sm">{day.label}</span>
                                </div>

                                <div class="relative flex-1 flex">
                                    {#each Array(numHours) as _}
                                        <div class="w-32 border-r border-outline-variant"></div>
                                    {/each}

                                    {#each dayEvents as item (`${item.ownerId}-${item.meeting.id}`)}
                                        {@const overlapCount = Math.max(item.overlapCount ?? 1, 1)}
                                        {@const heightPct = Math.max((100 - (overlapCount + 1) * stackGapPct) / overlapCount, 0)}
                                        {@const topPct = stackGapPct + item.stackIndex * (heightPct + stackGapPct)}
                                        <button
                                            class="absolute rounded px-2 py-1 text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-t-2"
                                            style={`background-color:${item.bgColor}; color:${item.textColor}; left:${item.startOffset}rem; width:${item.width}rem; top:${topPct}%; height:${heightPct}%; border-color:${item.bgColor}; opacity:${item.isPrimary ? 1 : 0.5};`}
                                            onclick={() => {activeCourse = item.course; activeMeeting = item.meeting; activeDay = day;}}
                                        >
                                            <div class="font-medium truncate">{item.meeting.title_overrides?.[day.key] ?? item.course.title}</div>
                                            <div class="opacity-80">{convertTo12Hour(item.meeting.begin_time)} - {convertTo12Hour(item.meeting.end_time)}</div>
                                            <div class="opacity-70 text-[10px]">{item.meeting.location.building.abbreviation} {item.meeting.location.room}</div>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {:else}
            <div class="text-sm text-secondary">No calendar data available.</div>
        {/if}
    {:else}
        <div class="flex flex-col gap-3 w-full max-w-3xl mt-2">
            <div class="flex flex-row gap-3 items-center justify-between flex-wrap">
                <div class="flex flex-col">
                    <div class="text-sm text-on-surface-variant">Best times to meet</div>
                    <div class="text-xs text-on-surface-variant">Common free time for selected friends, between 8am–8pm.</div>
                </div>
                <div class="flex flex-row gap-2 items-center flex-wrap">
                    <TextFieldOutlined type="number" label="Min (min)" bind:value={meetMinDurationMinutesInput} />
                    <TextFieldOutlined type="number" label="Buffer (min)" bind:value={meetBufferMinutesInput} />
                    <TextFieldOutlined type="time" label="Start" bind:value={meetRangeStartInput} />
                    <TextFieldOutlined type="time" label="End" bind:value={meetRangeEndInput} />
                    <Chip variant="input" selected={meetBetweenClassesOnly} onclick={() => { meetBetweenClassesOnly = !meetBetweenClassesOnly; }}>
                        Between classes
                    </Chip>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-3 w-full max-w-3xl mt-2">
            {#if selectedFriends.length === 0}
                <div class="text-sm text-secondary">Select at least one friend to see suggestions.</div>
            {:else if !meetRangeValid}
                <div class="text-sm text-secondary">Invalid time range.</div>
            {:else if Object.values(bestMeetTimesByDay ?? {}).some((arr) => arr.length > 0)}
                <div class="flex flex-col gap-2">
                    {#each dayOrder.slice(0, 5) as day}
                        {@const windows = bestMeetTimesByDay?.[day.key] ?? []}
                        {#if windows.length > 0}
                            <div class="flex flex-row gap-3 items-start justify-between bg-surface-container-low rounded-lg p-3 border border-outline-variant">
                                <div class="font-medium text-sm w-24">{day.label}</div>
                                <div class="flex-1 flex flex-row gap-2 flex-wrap justify-end">
                                    {#each windows as w (`${day.key}-${w.start}-${w.end}`)}
                                        <Chip variant="input" selected={false} onclick={() => {}}>
                                            {convertTo12Hour(minutesToHHMM(w.start))} – {convertTo12Hour(minutesToHHMM(w.end))} ({w.duration}m)
                                        </Chip>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            {:else}
                <div class="text-sm text-secondary">No meeting windows match your filters.</div>
            {/if}
        </div>
    {/if}

</div>

{#if activeCourse}
    <div
        transition:fade={{ duration: 200 }}
        class="fixed inset-0 bg-scrim/60 z-50 flex items-center justify-center p-4"
        role="button"
        tabindex="0"
        onclick={(e) => { if (e.target === e.currentTarget) { activeCourse = undefined; activeMeeting = undefined; activeDay = undefined; } }}
        onkeydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { activeCourse = undefined; activeMeeting = undefined; activeDay = undefined; } }}
    >
        <div
            transition:scale={{ duration: 200, start: 0.95 }}
            class="relative bg-surface-container-low rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
            <div class="flex flex-col gap-4 p-6">
                <div class="flex justify-between">
                    <h1 class="font-bold text-2xl">{activeCourse.title}</h1>
                    <button
                        class="p-2 rounded-full hover:bg-surface-container-high text-on-surface"
                        aria-label="Close"
                        onclick={() => {activeCourse = undefined; activeMeeting = undefined; activeDay = undefined;}}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
