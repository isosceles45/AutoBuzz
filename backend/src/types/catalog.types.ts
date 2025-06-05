export interface FyndCategory {
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
    action?: {
        type: string;
        url: string;
    };
    children?: FyndCategory[];
    priority?: number;
    _custom_json?: Record<string, any>;
}

export interface FyndBrand {
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
    description?: string;
    _custom_json?: Record<string, any>;
}

export interface FyndProduct {
    uid: string;
    name: string;
    slug: string;
    short_description?: string;
    description?: string;
    brand?: {
        uid: string;
        name: string;
        slug: string;
    };
    category?: {
        uid: string;
        name: string;
        slug: string;
    };
    images?: Array<{
        url: string;
        alt?: string;
        type?: string;
    }>;
    price?: {
        marked: number;
        effective: number;
        currency_code: string;
        currency_symbol: string;
    };
    discount?: {
        percentage?: number;
        amount?: number;
    };
    availability?: {
        is_valid: boolean;
        other_store_quantity: number;
        deliverable: boolean;
        available_sizes: Array<{
            display: string;
            value: string;
            is_available: boolean;
        }>;
    };
    tags?: string[];
    attributes?: Record<string, any>;
    rating?: {
        average: number;
        count: number;
    };
    has_variant?: boolean;
    item_type?: string;
    product_online_date?: string;
    promo_meta?: Record<string, any>;
    _custom_json?: Record<string, any>;
}

export interface FyndProductDetail extends FyndProduct {
    return_config?: {
        returnable: boolean;
        time: number;
        unit: string;
    };
    product_meta?: Array<{
        title: string;
        description: string;
    }>;
    grouped_attributes?: Array<{
        title: string;
        details: Array<{
            key: string;
            value: string;
        }>;
    }>;
    variants?: Array<{
        uid: string;
        name: string;
        slug: string;
        color_name?: string;
        color?: {
            name: string;
            code: string;
        };
        medias?: Array<{
            url: string;
            alt?: string;
            type: string;
        }>;
    }>;
    sizes?: Array<{
        display: string;
        value: string;
        is_available: boolean;
        quantity?: number;
    }>;
}

export interface FyndFilter {
    key: string;
    display: string;
    kind: string;
    logo?: string;
    values: Array<{
        display: string;
        count: number;
        is_selected: boolean;
        value: string;
        logo?: string;
        currency_code?: string;
        currency_symbol?: string;
        min?: number;
        max?: number;
        selected_min?: number;
        selected_max?: number;
    }>;
}

export interface PaginationInfo {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrevious?: boolean;
    size?: number;
}

export interface CategoryProductsResponse {
    products: FyndProduct[];
    page: PaginationInfo;
    filters?: FyndFilter[];
    sortOptions?: Array<{
        display: string;
        value: string;
        is_selected: boolean;
    }>;
}

export interface ProductSearchResponse {
    products: FyndProduct[];
    page: PaginationInfo;
    filters?: FyndFilter[];
    sortOptions?: Array<{
        display: string;
        value: string;
        is_selected: boolean;
    }>;
    suggestion?: {
        text: string;
        type: string;
    };
}

export interface CatalogFiltersResponse {
    filters: FyndFilter[];
    brands: Array<{
        display: string;
        value: string;
        count: number;
        logo?: string;
    }>;
    categories: Array<{
        display: string;
        value: string;
        count: number;
    }>;
}

// Database models for our app
export interface StoredProduct {
    id: string;
    fynd_uid: string;
    name: string;
    slug: string;
    description?: string;
    brand_name?: string;
    category_name?: string;
    price_effective?: number;
    price_marked?: number;
    currency_code?: string;
    images?: string[];
    tags?: string[];
    attributes?: Record<string, any>;
    is_available: boolean;
    embedding_text?: string;
    embedding_vector?: number[];
    created_at: Date;
    updated_at: Date;
}

export interface UserInterest {
    id: string;
    user_id: string;
    categories: string[];
    brands: string[];
    price_range?: {
        min?: number;
        max?: number;
    };
    keywords: string[];
    preferences: Record<string, any>;
    embedding_text: string;
    embedding_vector?: number[];
    created_at: Date;
    updated_at: Date;
}

export interface ProductMatch {
    user_id: string;
    product_id: string;
    similarity_score: number;
    matched_keywords: string[];
    notification_sent: boolean;
    created_at: Date;
}