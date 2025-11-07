import { writable } from 'svelte/store';
import type { ResponseData } from './types';
import type { UserSettings } from './types';
import { browser } from '$app/environment';

const initialProcessedData = (() => {
	if (!browser) return [];
	const raw = localStorage.getItem('processedData');
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
})();

export const processedData = writable<Array<{ termId: string; responseData: ResponseData }>>(initialProcessedData);
export const userSettings = writable<UserSettings | undefined>(undefined);
export const icsUrl = writable<string | undefined>(undefined);

if (browser) {
	const storedUserSettings = localStorage.getItem('userSettings');
	if (storedUserSettings) {
		userSettings.set(JSON.parse(storedUserSettings));
	}
	const storedIcsUrl = localStorage.getItem('icsUrl');
	if (storedIcsUrl) {
		icsUrl.set(storedIcsUrl);
	}
}

processedData.subscribe((value) => {
	if (browser) {
		localStorage.setItem('processedData', JSON.stringify(value));
	}
});

userSettings.subscribe((value) => {
	if (browser) {
		if (value === undefined) return;
		localStorage.setItem('userSettings', JSON.stringify(value));
	}
});

icsUrl.subscribe((value) => {
	if (browser) {
		localStorage.setItem('icsUrl', value ?? '');
	}
});