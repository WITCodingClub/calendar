export type Environment = 'dev' | 'staging' | 'prod';

export interface EnvironmentConfig {
    name: Environment;
    displayName: string;
    baseUrl: string;
}

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
    dev: {
        name: 'dev',
        displayName: 'Development',
        baseUrl: 'https://heron-selected-literally.ngrok-free.app'
    },
    staging: {
        name: 'staging',
        displayName: 'Staging',
        baseUrl: 'https://staging-calendar.witcc.dev'
    },
    prod: {
        name: 'prod',
        displayName: 'Production',
        baseUrl: 'https://server-calendar.witcc.dev'
    }
};

interface StoredEnvironmentData {
    current_environment: Environment;
    jwt_tokens: Partial<Record<Environment, string>>;
}

export class EnvironmentManager {
    private static readonly STORAGE_KEY = 'environment_data';

    /**
     * Get the current environment data from storage
     */
    public static async getEnvironmentData(): Promise<StoredEnvironmentData> {
        const result = await chrome.storage.local.get(this.STORAGE_KEY);
        return result[this.STORAGE_KEY] || {
            current_environment: 'prod',
            jwt_tokens: {}
        };
    }

    /**
     * Get the current environment
     */
    public static async getCurrentEnvironment(): Promise<Environment> {
        const data = await this.getEnvironmentData();
        return data.current_environment;
    }

    /**
     * Get the current environment config
     */
    public static async getCurrentEnvironmentConfig(): Promise<EnvironmentConfig> {
        const env = await this.getCurrentEnvironment();
        return ENVIRONMENTS[env];
    }

    /**
     * Get the base URL for the current environment
     */
    public static async getBaseUrl(): Promise<string> {
        const config = await this.getCurrentEnvironmentConfig();
        return config.baseUrl;
    }

    /**
     * Get JWT token for a specific environment
     */
    public static async getJwtToken(environment?: Environment): Promise<string | undefined> {
        const data = await this.getEnvironmentData();
        const env = environment || data.current_environment;
        return data.jwt_tokens[env];
    }

    /**
     * Set JWT token for a specific environment
     */
    public static async setJwtToken(token: string, environment?: Environment): Promise<void> {
        const data = await this.getEnvironmentData();
        const env = environment || data.current_environment;
        data.jwt_tokens[env] = token;
        await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
    }

    /**
     * Switch to a new environment
     * Returns true if JWT exists for the environment, false if onboarding is needed
     */
    public static async switchEnvironment(environment: Environment): Promise<boolean> {
        const data = await this.getEnvironmentData();
        data.current_environment = environment;
        await chrome.storage.local.set({ [this.STORAGE_KEY]: data });

        // Return whether JWT exists for this environment
        return !!data.jwt_tokens[environment];
    }

    /**
     * Clear JWT token for a specific environment
     */
    public static async clearJwtToken(environment?: Environment): Promise<void> {
        const data = await this.getEnvironmentData();
        const env = environment || data.current_environment;
        delete data.jwt_tokens[env];
        await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
    }

    /**
     * Clear all data (for logout)
     */
    public static async clearAllData(): Promise<void> {
        await chrome.storage.local.remove(this.STORAGE_KEY);
    }

    /**
     * Check which environments have JWT tokens
     */
    public static async getAuthenticatedEnvironments(): Promise<Environment[]> {
        const data = await this.getEnvironmentData();
        return Object.keys(data.jwt_tokens) as Environment[];
    }

    /**
     * Migration helper: Import old JWT token format
     * This helps migrate from the old 'jwt_token' key to the new structure
     */
    public static async migrateOldJwtToken(): Promise<void> {
        const result = await chrome.storage.local.get('jwt_token');
        if (result.jwt_token) {
            // Assume old token is for dev environment
            await this.setJwtToken(result.jwt_token, 'dev');
            await chrome.storage.local.remove('jwt_token');
        }
    }
}
