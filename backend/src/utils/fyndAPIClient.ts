import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FYND_BASE_URL = process.env.FYND_API_BASE_URL;
const FYND_APPLICATION_ID = process.env.FYND_APPLICATION_ID;
const FYND_APPLICATION_TOKEN = process.env.FYND_APPLICATION_TOKEN;

// Create reusable Fynd API client with Basic Auth
const createFyndApiClient = (baseUrl?: string): AxiosInstance | null => {
    if (!FYND_APPLICATION_ID || !FYND_APPLICATION_TOKEN) {
        console.log('⏭️ Fynd API credentials not configured');
        return null;
    }

    const apiBaseUrl = baseUrl || FYND_BASE_URL;

    return axios.create({
        baseURL: apiBaseUrl,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${FYND_APPLICATION_ID}:${FYND_APPLICATION_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/json'
        },
        timeout: 15000
    });
};

// Default Fynd API client for application APIs
export const fyndApi = createFyndApiClient();

// Catalog specific API client
export const fyndCatalogApi = createFyndApiClient(`${FYND_BASE_URL}/catalog/v1.0`);

// Export the creator function for custom endpoints
export { createFyndApiClient };