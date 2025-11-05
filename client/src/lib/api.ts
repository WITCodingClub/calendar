import { goto } from '$app/navigation';

export interface BetaAccessError {
  error: string;
  message: string;
}

export function isBetaAccessError(data: unknown): data is BetaAccessError {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as BetaAccessError).error ===
      'Access denied. This feature is currently in beta testing.'
  );
}

/**
 * Minimal ambient declarations to satisfy TS if chrome types aren't installed.
 * If you have @types/chrome available, you can remove this and add "types": ["chrome"]
 * in tsconfig.json.
 */
declare global {
  // Only the parts we use
  interface ChromeStorageArea {
    set(items: Record<string, unknown>): Promise<void> | void;
    get(keys?: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>> | void;
    remove(keys: string | string[]): Promise<void> | void;
  }
  interface ChromeStorage {
    // session is available in MV3; may be undefined in non-extension contexts
    session?: ChromeStorageArea;
    local?: ChromeStorageArea;
  }
  interface Chrome {
    storage?: ChromeStorage;
  }
  // eslint-disable-next-line no-var
  var chrome: Chrome | undefined;
}

/**
 * Utility to persist the return path using chrome.storage.
 * Choose session or local depending on desired persistence.
 */
async function saveReturnPath(pathname: string): Promise<void> {
  // Prefer session semantics; change to .local if you want persistence across windows/sessions
  const area = chrome?.storage?.session ?? chrome?.storage?.local;

  // If no chrome or storage area, just no-op
  if (!area) return;

  try {
    // In MV3+ recent Chrome versions, storage methods return Promises.
    // If they don’t in your runtime, this await is harmless (undefined is awaitable).
    await area.set({ beta_access_return_path: pathname });
  } catch (err) {
    // Non-fatal: log and continue
    console.error('Failed to set beta_access_return_path in chrome.storage', err);
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (isBetaAccessError(data)) {
    // Record current path for post-auth return. Guard window for SSR.
    const pathname =
      typeof window !== 'undefined' ? window.location.pathname : '/';

    await saveReturnPath(pathname);

    await goto('/beta-access-denied');
    throw new Error('Beta access required');
  }

  return data as T;
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  return handleApiResponse<T>(response);
}
