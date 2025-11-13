import { EnvironmentManager } from "./environment";
import type { isProcessed, ProcessedEvents, UserSettings } from "./types";

export class API {
    private static async getBaseUrl(): Promise<string> {
        const baseUrl = await EnvironmentManager.getBaseUrl();
        return `${baseUrl}/api`;
    }

    public static get baseUrl(): Promise<string> {
        return this.getBaseUrl();
    }

    public static async getJwtToken(): Promise<string | undefined> {
        const token = await EnvironmentManager.getJwtToken();
        return token;
    }

    public static async checkFeatureFlag(flagName:string) {
        const response = await fetch(`${this.baseUrl}/feature_flags/${flagName}`, {
            method: 'GET'
        });

        const data = await response.json();
        return data.is_enabled;
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