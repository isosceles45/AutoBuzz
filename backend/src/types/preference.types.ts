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
    // Original structure
    likedProducts: string[];
    dislikedProducts: string[];
    selectedCategories: string[];

    // Enhanced data
    likedProductsData: ProductInteraction[];
    dislikedProductsData: ProductInteraction[];

    // Analytics
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

export interface CreatePreferencesRequest {
    preferences: UserPreferences;
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