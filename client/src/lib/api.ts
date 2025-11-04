import { goto } from '$app/navigation';

export interface BetaAccessError {
	error: string;
	message: string;
}

export function isBetaAccessError(data: any): data is BetaAccessError {
	return (
		data &&
		typeof data === 'object' &&
		data.error === 'Access denied. This feature is currently in beta testing.'
	);
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
	const data = await response.json();

	// Check for beta access error
	if (isBetaAccessError(data)) {
		// Store the current path so we can return there after retry
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('beta_access_return_path', window.location.pathname);
		}
		await goto('/beta-access-denied');
		throw new Error('Beta access required');
	}

	return data as T;
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
	const response = await fetch(url, options);
	return handleApiResponse<T>(response);
}
