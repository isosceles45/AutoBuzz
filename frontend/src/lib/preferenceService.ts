import api from './api';

export interface ProductInteraction {
    slug: string;
    uid: number;
    name: string;
    brand: string;
    category: string;
    price: {
        effective: number;
        marked: number;
        currency: string;
    };
    discount: number;
    interactionType: 'like' | 'dislike';
    interactionTime: Date;
    swipeOrder: number;
    hasImages: boolean;
    imageCount: number;
    primaryImageUrl?: string;
    countryOfOrigin: string;
    sellable: boolean;
    productAge: number;
}

export interface EnhancedProductPreferences {
    likedProducts: string[];
    dislikedProducts: string[];
    selectedCategories: string[];
    likedProductsData: ProductInteraction[];
    dislikedProductsData: ProductInteraction[];
    priceInsights: {
        averageLikedPrice: number;
        priceRangeMin: number;
        priceRangeMax: number;
        currency: string;
        discountSensitivity: number;
    };
    brandInsights: {
        preferredBrands: string[];
        brandAffinityScores: Record<string, number>;
    };
    categoryInsights: {
        categoryName: string;
        likeCount: number;
        dislikeCount: number;
        affinityScore: number;
    }[];
    behaviorMetrics: {
        totalSwipes: number;
        likeRate: number;
        skipRate: number;
        priceConsciousness: 'high' | 'medium' | 'low';
        categoryDiversity: number;
    };
}

export interface UserPreferences {
    selectedCategories: string[];
    likedProducts: string[];
    dislikedProducts: string[];
    priceRange: {
        min: number;
        max: number;
        currency: string;
    };
    selectedBrands: string[];
    enhancedData?: EnhancedProductPreferences;
}

export interface PreferencesResponse {
    id: string;
    userId: string;
    preferences: UserPreferences;
    embedding: number[];
    textSummary: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
    timestamp: string;
}

export const preferenceService = {
    /**
     * Store user preferences with OpenAI embeddings
     */
    async storePreferences(preferences: UserPreferences): Promise<PreferencesResponse> {
        try {
            const response = await api.post('/preferences/store', {
                preferences
            });

            if (response.data.success) {
                return response.data.data;
            }

            // If backend doesn't wrap in success format, return directly
            return response.data;
        } catch (error: any) {
            console.error('Error storing preferences:', error);

            // Extract error message from different possible formats
            let errorMessage = 'Failed to store preferences';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    }
};