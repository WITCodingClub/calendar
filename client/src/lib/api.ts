import type { UserSettings, isProcessed, ProcessedEvents } from "./types";
import { EnvironmentManager } from "./environment";

export class API {
    /**
     * Get the base URL for API calls (includes /api suffix)
     * @private
     */
    private static async getBaseUrl(): Promise<string> {
        const baseUrl = await EnvironmentManager.getBaseUrl();
        return `${baseUrl}/api`;
    }

    /**
     * Get the base URL for the current environment (public access for direct fetch calls)
     * @deprecated Use API class methods instead of direct fetch when possible
     */
    public static get baseUrl(): Promise<string> {
        return this.getBaseUrl();
    }

    /**
     * Get JWT token for the current environment
     */
    public static async getJwtToken(): Promise<string> {
        const token = await EnvironmentManager.getJwtToken();
        if (!token) {
            throw new Error('No JWT token found for current environment');
        }
        return token;
    }

    public static async getTerms() {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/terms/current_and_next`, {
            method: 'GET'
        });
        return response.json();
    }

    public static async getUserEmail() {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}/user/email`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${await this.getJwtToken()}`
            }
        });
        return response.json();
    }

    public static async userSettings(settings?: UserSettings): Promise<UserSettings> {
        const baseUrl = await this.getBaseUrl();
        const url = `${baseUrl}/user/extension_config`;
        const token = await this.getJwtToken();
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };

        if (settings === undefined) {
            const response = await fetch(url, {
                method: 'GET',
                headers,
            });
            return response.json();
        } else {
            const response = await fetch(url, {
                method: 'PUT',
                body: JSON.stringify(settings),
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            return response.json();
        }
    }

    public static async userIsProcessed(termUid: string): Promise<isProcessed> {
        const baseUrl = await this.getBaseUrl();
        const token = await this.getJwtToken();
        const response = await fetch(`${baseUrl}/user/is_processed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ term_uid: termUid })
        });
        return response.json();
    }

    public static async getProcessedEvents(termUid: string): Promise<ProcessedEvents> {
        const baseUrl = await this.getBaseUrl();
        const token = await this.getJwtToken();
        const response = await fetch(`${baseUrl}/user/processed_events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ term_uid: termUid })
        });
        return response.json();
    }

    public static async getIcsUrl(): Promise<{ ics_url: string }> {
        const baseUrl = await this.getBaseUrl();
        const token = await this.getJwtToken();
        const response = await fetch(`${baseUrl}/user/ics_url`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

}