import { goto } from '$app/navigation';

export interface BetaAccessError {
	error: string;
	message: string;
}

/**
 * Checks if the API response is a beta access error
 */
export function isBetaAccessError(data: any): data is BetaAccessError {
	return (
		data &&
		typeof data === 'object' &&
		data.error === 'Access denied. This feature is currently in beta testing.'
	);
}

/**
 * Handles API response and checks for beta access errors
 * Redirects to beta access denied page if detected
 * @param response - Fetch response object
 * @returns The parsed JSON data if no beta error
 */
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

/**
 * Makes an API call with automatic beta access error handling
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns The parsed response data
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
	const response = await fetch(url, options);
	return handleApiResponse<T>(response);
}
