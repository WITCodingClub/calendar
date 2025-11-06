<script lang="ts">
    import { SelectOutlined } from "m3-svelte";
    import type { UserSettings } from "$lib/types";
    import { API } from "$lib/api";
    import { onMount } from "svelte";

    let userSettings = $state<UserSettings | undefined>(undefined);
    let email = $state<string | undefined>(undefined);

    onMount(async () => {
        userSettings = await API.getUserSettings();
        email = await API.getUserEmail().then(data => data.email);
    });

    const defaultColorLectureGetterSetter = {
        get value() { return userSettings?.default_color_lecture ?? ""; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.default_color_lecture = value;
			API.updateUserSettings(userSettings);
		}
    }

    const militaryTimeGetterSetter = {
        get value() { return userSettings?.military_time ? "true" : "false"; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.military_time = value === "true";
			API.updateUserSettings(userSettings);
		}
    }

    const defaultColorLabGetterSetter = {
        get value() { return userSettings?.default_color_lab ?? ""; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.default_color_lab = value;
			API.updateUserSettings(userSettings);
		}
    }
</script>

<h1 class="text-lg font-bold">Currently signed in as: {email}</h1>

<div class="flex flex-col gap-3">
    <div class="flex flex-row gap-3 items-center">
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
    <div class="flex flex-row gap-3 items-center">
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
    <div class="flex flex-row gap-3 items-center">
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
</div>