import { EnvironmentManager } from "./environment";
import type { isProcessed, ProcessedEvents, UserSettings } from "./types";

export class API {
    public static readonly baseUrl = 'https://heron-selected-literally.ngrok-free.app/api';

    public static async getJwtToken() {
        const result = await chrome.storage.local.get('jwt_token');
        if (!result.jwt_token) {
            throw new Error('No JWT token found');
        }
        return result.jwt_token;
    }

    public static async checkFeatureFlag(flagName:string) {
        const response = await fetch(`${this.baseUrl}/feature_flags/${flagName}`, {
            method: 'GET'
        });

        const data = await response.json();
        return data.is_enabled;
    }

    public static async getTerms() {
        const response = await fetch(`${this.baseUrl}/terms/current_and_next`, {
            method: 'GET'
        });
        return response.json();
    }

    public static async getUserEmail() {
        const response = await fetch(`${this.baseUrl}/user/email`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${await this.getJwtToken()}`
            }
        });
        return response.json();
    }

    public static async userSettings(settings?: UserSettings): Promise<UserSettings> {
        const url = `${this.baseUrl}/user/extension_config`;
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
        const token = await this.getJwtToken();
        const response = await fetch(`${this.baseUrl}/user/is_processed`, {
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
        const token = await this.getJwtToken();
        const response = await fetch(`${this.baseUrl}/user/processed_events`, {
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
        const token = await this.getJwtToken();
        const response = await fetch(`${this.baseUrl}/user/ics_url`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

}