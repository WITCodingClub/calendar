import type { UserSettings } from "./types";

export class API {
    public static readonly baseUrl = 'https://heron-selected-literally.ngrok-free.app/api';

    public static async getJwtToken() {
        const result = await chrome.storage.local.get('jwt_token');
        if (!result.jwt_token) {
            throw new Error('No JWT token found');
        }
        return result.jwt_token;
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

    public static async userSettings(settings?: UserSettings) {
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

    public static async getUserSettings(): Promise<UserSettings> {
        const url = `${this.baseUrl}/user/extension_config`;
        const token = await this.getJwtToken();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

    public static async updateUserSettings(settings: UserSettings): Promise<UserSettings> {
        const url = `${this.baseUrl}/user/extension_config`;
        const token = await this.getJwtToken();
        const response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(settings),
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    }

    public static settings = () => ({
        military_time: async () => await this.getUserSettings().then(settings => settings.military_time),
        default_color_lecture: async () => await this.getUserSettings().then(settings => settings.default_color_lecture),
        default_color_lab: async () => await this.getUserSettings().then(settings => settings.default_color_lab),
    });

}