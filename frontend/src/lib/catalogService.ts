import api from './api';

export interface Category {
    uid: string;
    name: string;
    slug: string;
    logo?: {
        url: string;
        alt?: string;
    };
    banner?: {
        url: string;
        alt?: string;
    };
    children?: Category[];
}

export interface Brand {
    uid: number;
    name: string;
    logo?: {
        url: string;
        alt?: string;
    };
}

export interface Filter {
    key: {
        display: string;
        name: string;
        kind: string;
    };
    values: Array<{
        display: string;
        min?: number;
        max?: number;
        currency_symbol?: string;
        count?: number;
    }>;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
    timestamp: string;
}

export const catalogService = {
    async getCategories(): Promise<Category[]> {
        try {
            const response = await api.get('/catalog/categories');

            if (response.data.success) {
                return response.data.data.categories || [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    async getBrands(): Promise<Brand[]> {
        try {
            const response = await api.get('/catalog/brands');

            if (response.data.success) {
                return response.data.data.brands || [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching brands:', error);
            return [];
        }
    },

    async getFilters(): Promise<Filter[]> {
        try {
            const response = await api.get('/catalog/filters');

            if (response.data.success) {
                return response.data.data.filters || [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching filters:', error);
            return [];
        }
    },

    async searchProducts(query: string, pageSize: number = 10) {
        try {
            const response = await api.get(`/catalog/products/search`, {
                params: { q: query, pageSize }
            });

            if (response.data.success) {
                return response.data.data.products || [];
            }

            return [];
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    },

    async getCategoryProducts(categorySlug: string, pageSize: number = 20) {
        try {
            const response = await api.get(`/catalog/categories/${categorySlug}/products`, {
                params: { pageSize }
            });

            if (response.data.success) {
                return response.data.data.products || [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching category products:', error);
            return [];
        }
    },

    async getTrendingProducts(pageSize: number = 20) {
        try {
            const response = await api.get('/catalog/products/trending', {
                params: { pageSize }
            });

            if (response.data.success) {
                return response.data.data.products || [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching trending products:', error);
            return [];
        }
    }
};