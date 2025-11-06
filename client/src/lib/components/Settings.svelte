<script lang="ts">
    import { Button, SelectOutlined } from "m3-svelte";
    import type { UserSettings } from "$lib/types";
    import { API } from "$lib/api";
    import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { userSettings as storedUserSettings } from "$lib/store";

    let userSettings = $state<UserSettings | undefined>(undefined);
    let email = $state<string | undefined>(undefined);

    onMount(async () => {
        userSettings = await API.userSettings();
		storedUserSettings.set(userSettings);
        email = await API.getUserEmail().then(data => data.email);
    });

    const defaultColorLectureGetterSetter = {
        get value() { return userSettings?.default_color_lecture ?? ""; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.default_color_lecture = value;
			storedUserSettings.set(userSettings);
			API.updateUserSettings(userSettings);
		}
    }

    const militaryTimeGetterSetter = {
        get value() { return userSettings?.military_time ? "true" : "false"; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.military_time = value === "true";
			storedUserSettings.set(userSettings);
			API.updateUserSettings(userSettings);
		}
    }

    const defaultColorLabGetterSetter = {
        get value() { return userSettings?.default_color_lab ?? ""; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.default_color_lab = value;
			storedUserSettings.set(userSettings);
			API.updateUserSettings(userSettings);
		}
    }

    async function clearLocalStorage() {
        await chrome.storage.local.clear();
        localStorage.clear();
        sessionStorage.clear();
        await goto('/');
    }
</script>

<h1 class="text-lg font-bold">Currently signed in as: {email}</h1>

<div class="flex flex-col gap-3">
    <div class="flex flex-row gap-3 items-center justify-between">
        <h2 class="text-md font-bold">Default Lecture Color</h2>
        <div class="flex flex-row gap-2 items-center">
            <div class="w-6 h-6 rounded-full border-2 border-outline other-stuff" style="background-color: {userSettings?.default_color_lecture};"></div>
            <SelectOutlined label=""
                options={[
                    { text: "Tomato", value: "#dc2127" },
                    { text: "Flamingo", value: "#ff887c" },
                    { text: "Tangerine", value: "#ffb878" },
                    { text: "Banana", value: "#fbd75b" },
                    { text: "Sage", value: "#7ae7bf" },
                    { text: "Basil", value: "#51b749" },
                    { text: "Peacock", value: "#46d6db" },
                    { text: "Blueberry", value: "#5484ed" },
                    { text: "Lavender", value: "#a4bdfc" },
                    { text: "Grape", value: "#dbadff" },
                    { text: "Graphite", value: "#e1e1e1" },
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
                    { text: "Tomato", value: "#dc2127" },
                    { text: "Flamingo", value: "#ff887c" },
                    { text: "Tangerine", value: "#ffb878" },
                    { text: "Banana", value: "#fbd75b" },
                    { text: "Sage", value: "#7ae7bf" },
                    { text: "Basil", value: "#51b749" },
                    { text: "Peacock", value: "#46d6db" },
                    { text: "Blueberry", value: "#5484ed" },
                    { text: "Lavender", value: "#a4bdfc" },
                    { text: "Grape", value: "#dbadff" },
                    { text: "Graphite", value: "#e1e1e1" },
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
    <div class="flex flex-col gap-2 items-center justify-center mt-6 w-full">
        <Button variant="filled" onclick={clearLocalStorage}>Clear Local Data</Button>
        <p class="text-sm text-error text-center max-w-md">
            <span class="font-semibold">Warning:</span>
            This will clear all your local data and you will need to sign in again. This does <b>not</b> affect your Calendar data.
        </p>
    </div>
</div>