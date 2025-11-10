<script lang="ts">
    import { Button, SelectOutlined } from "m3-svelte";
    import type { UserSettings } from "$lib/types";
    import { API } from "$lib/api";
    import { onMount } from "svelte";
	import { goto } from "$app/navigation";
    import { userSettings as storedUserSettings } from "$lib/store";
    import { processedData as storedProcessedData } from "$lib/store";
    import { snackbar } from "m3-svelte";

    let userSettings = $state<UserSettings | undefined>(undefined);
    let email = $state<string | undefined>(undefined);
    let emailToSignInWith: string | null = $state(null);
    let emailToSubmit = $state('');
    let jwt_token: string | undefined = $state(undefined);

    onMount(async () => {
        jwt_token = await API.getJwtToken();
        userSettings = await API.userSettings();
		storedUserSettings.set(userSettings);
        tryForEmail();
        email = await API.getUserEmail().then(data => data.email);
    });

    const defaultColorLectureGetterSetter = {
        get value() { return userSettings?.default_color_lecture ?? ""; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.default_color_lecture = value;
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
		}
    }

    const militaryTimeGetterSetter = {
        get value() { return userSettings?.military_time ? "true" : "false"; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.military_time = value === "true";
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
		}
    }

    const defaultColorLabGetterSetter = {
        get value() { return userSettings?.default_color_lab ?? ""; },
		set value(value: string) {
			if (!userSettings) return;
			userSettings.default_color_lab = value;
			storedUserSettings.set(userSettings);
			API.userSettings(userSettings);
		}
    }

    async function clearLocalStorage() {
        await chrome.storage.local.clear();
        localStorage.clear();
        sessionStorage.clear();
        storedUserSettings.set(undefined);
        storedProcessedData.set([]);
        await goto('/');
    }

    async function tryForEmail() {
        const info = await chrome.identity.getProfileUserInfo();
        if (info && info.email) {
            emailToSignInWith = info.email;
        }
    }

    async function submitEmail() {
        const emailToUse = emailToSignInWith || emailToSubmit; 
        
        const response = await fetch(`${API.baseUrl}/user/gcal`, {
            method: 'POST',
            body: JSON.stringify({email: emailToUse}),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt_token}`
            }
        });
        const data = await response.json();
        if (response.ok && data.oauth_url) {
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;

            await chrome.windows.create({
                url: data.oauth_url,
                width: 650,
                height: 800,
                left: Math.floor((screenWidth - 650) / 2),
                top: Math.floor((screenHeight - 800) / 2),
                type: 'popup'
            });
        } else if (response.ok && !data.oauth_url) {
            await chrome.storage.local.set({
                    oauth_status: 'success',
            });
            await chrome.storage.local.set({
                oauth_email: emailToSignInWith || emailToSubmit,
            });
            goto('/calendar');
        } else {
            snackbar('Failed to submit email: ' + data.error, undefined, true);
        }
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
    <div class="flex flex-col gap-2 items-center justify-center mt-6 w-full">
        <div class="flex justify-center mt-3 peak flex-col gap-2">
            {#if emailToSignInWith}
                <Button variant="filled" square onclick={submitEmail}>Continue with {emailToSignInWith}</Button>
            {/if}
        </div>
        <Button variant="filled" onclick={clearLocalStorage}>Clear Local Data</Button>
        <p class="text-sm text-error text-center max-w-md">
            <span class="font-semibold">Warning:</span>
            This will clear all your local data and you will need to sign in again. This does <b>not</b> affect your Calendar data.
        </p>
    </div>
</div>