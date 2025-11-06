export class API {
    private static baseUrl = 'https://heron-selected-literally.ngrok-free.app/api';

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
}