<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { API } from "$lib/api";
    import { EnvironmentManager, ENVIRONMENTS, type Environment } from "$lib/environment";
    import { processedData as storedProcessedData, userSettings as storedUserSettings } from "$lib/store";
    import type { UserSettings } from "$lib/types";
    import { Button, SelectOutlined, snackbar, Switch } from "m3-svelte";
    import { onMount } from "svelte";

    let userSettings = $state<UserSettings | undefined>(undefined);
    let email = $state<string | undefined>(undefined);
    let currentEnvironment = $state<Environment>('prod');
    let authenticatedEnvironments = $state<Environment[]>([]);

    $effect(() => {
        userSettings = $storedUserSettings;
    });

    let previousSettingsWasUndefined = false;
    $effect(() => {
        if (previousSettingsWasUndefined && $storedUserSettings !== undefined && browser) {
            (async () => {
                try {
                    email = await API.getUserEmail().then(data => data.email);
                    currentEnvironment = await EnvironmentManager.getCurrentEnvironment();
                    authenticatedEnvironments = await EnvironmentManager.getAuthenticatedEnvironments();
                } catch (error) {
                    console.error('Failed to refetch email/env after environment switch:', error);
                }
            })();
        }
        previousSettingsWasUndefined = $storedUserSettings === undefined;
    });

    onMount(async () => {
        await EnvironmentManager.migrateOldJwtToken();

        try {
            userSettings = await API.userSettings();
            storedUserSettings.set(userSettings);
            email = await API.getUserEmail().then(data => data.email);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }

        currentEnvironment = await EnvironmentManager.getCurrentEnvironment();
        authenticatedEnvironments = await EnvironmentManager.getAuthenticatedEnvironments();
    });

    let defaultColorLecture = $derived(userSettings?.default_color_lecture ?? "");
    let defaultColorLab = $derived(userSettings?.default_color_lab ?? "");
    let militaryTimeValue = $derived(userSettings?.military_time ? "true" : "false");
    let advancedEditingValue = $derived(userSettings?.advanced_editing ?? false);
    let syncUniversityEventsValue = $derived(userSettings?.sync_university_events ?? false);
    let universityEventCategories = $derived(userSettings?.university_event_categories ?? []);
    let availableCategories = $derived(userSettings?.available_university_event_categories ?? []);

    const defaultColorLectureGetterSetter = {
        get value() { return defaultColorLecture; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings = { ...userSettings, default_color_lecture: value };
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
			clearStoredColors();
		}
    }

    const militaryTimeGetterSetter = {
        get value() { return militaryTimeValue; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings = { ...userSettings, military_time: value === "true" };
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
		}
    }

    const defaultColorLabGetterSetter = {
        get value() { return defaultColorLab; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings = { ...userSettings, default_color_lab: value };
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
			clearStoredColors();
		}
    }

    const advancedEditingGetterSetter = {
        get value() { return advancedEditingValue; },
		set value(value: boolean) {
			if (!userSettings) return;
			userSettings = { ...userSettings, advanced_editing: value };
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
		}
    }

    const syncUniversityEventsGetterSetter = {
        get value() { return syncUniversityEventsValue; },
		set value(value: boolean) {
			if (!userSettings) return;
			userSettings = { ...userSettings, sync_university_events: value };
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
		}
    }

    function toggleUniversityCategory(categoryId: string) {
        if (!userSettings) return;
        const currentCategories = userSettings.university_event_categories ?? [];
        let newCategories: string[];

        if (currentCategories.includes(categoryId)) {
            newCategories = currentCategories.filter(c => c !== categoryId);
        } else {
            newCategories = [...currentCategories, categoryId];
        }

        userSettings = { ...userSettings, university_event_categories: newCategories };
        storedUserSettings.set(userSettings);
        API.userSettings(userSettings);
    }

    function isCategorySelected(categoryId: string): boolean {
        return universityEventCategories.includes(categoryId);
    }

    function clearStoredColors() {
        storedProcessedData.update((list) => {
            return list.map((termData) => ({
                ...termData,
                responseData: {
                    ...termData.responseData,
                    classes: termData.responseData.classes.map((course) => ({
                        ...course,
                        meeting_times: course.meeting_times.map((meeting) => {
                            const { color, ...meetingWithoutColor } = meeting;
                            return meetingWithoutColor;
                        })
                    }))
                }
            }));
        });
    }

    async function switchEnvironment(newEnv: Environment) {
        if (newEnv === currentEnvironment) return;

        currentEnvironment = newEnv;
        const hasJwt = await EnvironmentManager.switchEnvironment(newEnv);

        if (browser) {
            sessionStorage.setItem('returnToSettings', 'true');
            sessionStorage.setItem('clearCalendarData', 'true');
        }

        const envDisplayName = ENVIRONMENTS[newEnv].displayName;

        if (!hasJwt) {
            storedProcessedData.set([]);
            snackbar(`Switched to ${envDisplayName}. Please sign in.`, undefined, true);
            await goto('/');
        }
    }

    const environmentGetterSetter = {
        get value() { return currentEnvironment; },
        set value(value: string) {
            switchEnvironment(value as Environment);
        }
    }

    async function clearLocalStorage() {
        await chrome.storage.local.clear();
        localStorage.clear();
        sessionStorage.clear();
        storedUserSettings.set(undefined);
        storedProcessedData.set([]);
        snackbar('Local data cleared successfully', undefined, true);
        await goto('/');
    }
</script>

<h1 class="text-lg font-bold">Currently signed in as: {email}</h1>

<div class="flex flex-col gap-3">
    <div class="flex flex-row gap-3 items-center justify-between">
        <div class="flex flex-col">
            <h2 class="text-md font-bold">Environment</h2>
            <p class="text-sm text-outline">
                {#each Object.values(ENVIRONMENTS) as env}
                    {#if authenticatedEnvironments.includes(env.name)}
                        <span class="text-primary">✓ {env.displayName}</span>
                    {:else}
                        <span class="text-outline-variant">○ {env.displayName}</span>
                    {/if}
                    {#if env.name !== 'prod'}&nbsp;&nbsp;{/if}
                {/each}
            </p>
        </div>
        <div class="flex flex-row gap-2 items-center">
            <SelectOutlined label=""
                options={[
                    { text: ENVIRONMENTS.prod.displayName, value: "prod" },
                    { text: ENVIRONMENTS.staging.displayName, value: "staging" },
                    { text: ENVIRONMENTS.dev.displayName, value: "dev" },
                ]}
                bind:value={environmentGetterSetter.value}
            />
        </div>
    </div>
    <div class="flex flex-row gap-3 items-center justify-between">
        <h2 class="text-md font-bold">Default Lecture Color</h2>
        <div class="flex flex-row gap-2 items-center">
            <div class="w-6 h-6 rounded-full border-2 border-outline other-stuff" style="background-color: {userSettings?.default_color_lecture};"></div>
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
                bind:value={defaultColorLectureGetterSetter.value}
            />
        </div>
    </div>
    <div class="flex flex-row gap-3 items-center justify-between">
        <h2 class="text-md font-bold">Default Lab Color</h2>
        <div class="flex flex-row gap-2 items-center">
            <div class="w-6 h-6 rounded-full border-2 border-outline other-stuff" style="background-color: {userSettings?.default_color_lab};"></div>
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
                bind:value={defaultColorLabGetterSetter.value}
            />
        </div>
    </div>
    <div class="flex flex-row gap-3 items-center justify-between">
        <h2 class="text-md font-bold">Time Format</h2>
        <div class="flex flex-row gap-2 items-center">
            <SelectOutlined label=""
                options={[
                    { text: "12-hour", value: "false" },
                    { text: "24-hour", value: "true" },
                ]}
                bind:value={militaryTimeGetterSetter.value}
            />
        </div>
    </div>
    <div class="flex flex-row gap-3 items-center justify-between">
        <h2 class="text-md font-bold">Advanced Editing</h2>
        <div class="flex flex-row gap-2 items-center">
            <label>
                <Switch bind:checked={advancedEditingGetterSetter.value} />
            </label>
        </div>
    </div>

    <!-- University Calendar Events Section -->
    <div class="flex flex-col gap-3 mt-4 pt-4 border-t border-outline-variant">
        <div class="flex flex-row gap-3 items-center justify-between">
            <div class="flex flex-col">
                <h2 class="text-md font-bold">Sync University Events</h2>
                <p class="text-sm text-outline">Add campus events to your calendar (holidays are always synced)</p>
            </div>
            <div class="flex flex-row gap-2 items-center">
                <label>
                    <Switch bind:checked={syncUniversityEventsGetterSetter.value} />
                </label>
            </div>
        </div>

        {#if syncUniversityEventsValue && availableCategories.length > 0}
            <div class="flex flex-col gap-2 ml-2 pl-4 border-l-2 border-outline-variant">
                <p class="text-sm text-outline font-medium">Select event types to sync:</p>
                {#each availableCategories.filter(c => c.id !== 'holiday') as category}
                    <label class="flex flex-row gap-3 items-start cursor-pointer hover:bg-surface-variant rounded-lg p-2 -m-2 transition-colors">
                        <input
                            type="checkbox"
                            checked={isCategorySelected(category.id)}
                            onchange={() => toggleUniversityCategory(category.id)}
                            class="mt-1 w-4 h-4 accent-primary"
                        />
                        <div class="flex flex-col">
                            <span class="text-sm font-medium">{category.name}</span>
                            <span class="text-xs text-outline">{category.description}</span>
                        </div>
                    </label>
                {/each}
            </div>
        {/if}
    </div>

    <div class="flex flex-col gap-2 items-center justify-center mt-6 w-full">
        <Button variant="filled" onclick={clearLocalStorage}>Clear Local Data</Button>
        <p class="text-sm text-error text-center max-w-md">
            <span class="font-semibold">Warning:</span>
            This will clear all your local data and you will need to sign in again. This does <b>not</b> affect your Calendar data.
        </p>
    </div>
</div>