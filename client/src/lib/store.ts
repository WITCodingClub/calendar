import { writable } from 'svelte/store';
import type { ResponseData } from './types';
import { browser } from '$app/environment';

export const processedData = writable<ResponseData | undefined>(undefined);

processedData.subscribe((value) => {
    if (browser) {
		if (!value) return;
		if (value === undefined) return;
		localStorage.setItem('processedData', JSON.stringify(value));
	}
});

if (browser) {
    const storedData = localStorage.getItem('processedData');
    if (storedData) {
        processedData.set(JSON.parse(storedData));
    }
}