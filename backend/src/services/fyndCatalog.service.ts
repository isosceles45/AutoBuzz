import {  AxiosError } from 'axios';
import {
    FyndCategory,
    FyndProduct,
    FyndProductDetail,
    FyndBrand,
    CategoryProductsResponse,
    ProductSearchResponse,
    CatalogFiltersResponse
} from "../types/catalog.types.js";
import {fyndCatalogApi} from "@utils/fyndAPIClient";

// Get all categories for navigation
const getCategories = async (): Promise<FyndCategory[]> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return [];
    }

    try {
        console.log('📂 Fetching categories from Fynd...');

        const response = await fyndCatalogApi.get('/categories');
        console.log('✅ Categories fetched:', response.data.data?.length || 0);

        return response.data.data || [];
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error fetching categories:', axiosError.response?.data);
        return [];
    }
};

// Get products by category with pagination
const getCategoryProducts = async (
    categorySlug: string,
    page: number = 1,
    pageSize: number = 20,
    sortOn: string = 'latest'
): Promise<CategoryProductsResponse> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return { products: [], page: { current: 1, total: 0, hasNext: false } };
    }

    try {
        console.log(`🛍️ Fetching products for category: ${categorySlug}`);

        const response = await fyndCatalogApi.get(`/products`, {
            params: {
                category: categorySlug,
                page_no: page,
                page_size: pageSize,
                sort_on: sortOn,
                facets: true
            }
        });

        console.log('✅ Products fetched:', response.data.items?.length || 0);

        return {
            products: response.data.items || [],
            page: {
                current: response.data.page?.current || 1,
                total: response.data.page?.total || 0,
                hasNext: response.data.page?.has_next || false
            },
            filters: response.data.filters || [],
            sortOptions: response.data.sort_on || []
        };
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error fetching category products:', axiosError.response?.data);
        return { products: [], page: { current: 1, total: 0, hasNext: false } };
    }
};

// Search products with query
const searchProducts = async (
    query: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: Record<string, string[]>
): Promise<ProductSearchResponse> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return { products: [], page: { current: 1, total: 0, hasNext: false } };
    }

    try {
        console.log(`🔍 Searching products with query: "${query}"`);

        const params: any = {
            q: query,
            page_no: page,
            page_size: pageSize,
            facets: true
        };

        // Add filters if provided
        if (filters) {
            Object.entries(filters).forEach(([key, values]) => {
                params[key] = values.join(',');
            });
        }

        const response = await fyndCatalogApi.get(`/products/search`, { params });

        console.log('✅ Search results:', response.data.items?.length || 0);

        return {
            products: response.data.items || [],
            page: {
                current: response.data.page?.current || 1,
                total: response.data.page?.total || 0,
                hasNext: response.data.page?.has_next || false
            },
            filters: response.data.filters || [],
            sortOptions: response.data.sort_on || []
        };
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error searching products:', axiosError.response?.data);
        return { products: [], page: { current: 1, total: 0, hasNext: false } };
    }
};

// Get detailed product information
const getProductDetail = async (slug: string): Promise<FyndProductDetail | null> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return null;
    }

    try {
        console.log(`📦 Fetching product details for: ${slug}`);

        const response = await fyndCatalogApi.get(`/products/${slug}`);
        console.log('✅ Product details fetched');

        return response.data || null;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error fetching product details:', axiosError.response?.data);
        return null;
    }
};

// Get all available brands
const getBrands = async (pageSize: number = 100): Promise<FyndBrand[]> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return [];
    }

    try {
        console.log('🏷️ Fetching brands from Fynd...');

        const response = await fyndCatalogApi.get('/brands', {
            params: { page_size: pageSize }
        });

        console.log('✅ Brands fetched:', response.data.items?.length || 0);

        return response.data.items || [];
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error fetching brands:', axiosError.response?.data);
        return [];
    }
};

// Get available filters for a category (useful for intelligent categorization)
const getCategoryFilters = async (categorySlug?: string): Promise<CatalogFiltersResponse> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return { filters: [], brands: [], categories: [] };
    }

    try {
        console.log('🎛️ Fetching catalog filters...');

        const params: any = { facets: true };
        if (categorySlug) {
            params.category = categorySlug;
        }

        const response = await fyndCatalogApi.get('/products', { params });

        console.log('✅ Filters fetched');

        return {
            filters: response.data.filters || [],
            brands: response.data.filters?.find((f: any) => f.key === 'brand')?.values || [],
            categories: response.data.filters?.find((f: any) => f.key === 'category')?.values || []
        };
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error fetching filters:', axiosError.response?.data);
        return { filters: [], brands: [], categories: [] };
    }
};

// Get trending/popular products
const getTrendingProducts = async (
    pageSize: number = 20,
    category?: string
): Promise<FyndProduct[]> => {
    if (!fyndCatalogApi) {
        console.log('⏭️ Skipping Fynd Catalog - not configured');
        return [];
    }

    try {
        console.log('🔥 Fetching trending products...');

        const params: any = {
            page_size: pageSize,
            sort_on: 'popular'
        };

        if (category) {
            params.category = category;
        }

        const response = await fyndCatalogApi.get('/products', { params });

        console.log('✅ Trending products fetched:', response.data.items?.length || 0);

        return response.data.items || [];
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Error fetching trending products:', axiosError.response?.data);
        return [];
    }
};

// Utility function to generate embeddings text from product
const generateProductEmbeddingText = (product: FyndProduct): string => {
    const parts = [
        product.name || '',
        product.short_description || '',
        product.description || '',
        product.category?.name || '',
        product.brand?.name || '',
        ...(product.tags || []),
        ...(product.attributes ? Object.values(product.attributes).flat() : [])
    ];

    return parts.filter(Boolean).join(' ').toLowerCase();
};

export {
    getCategories,
    getCategoryProducts,
    searchProducts,
    getProductDetail,
    getBrands,
    getCategoryFilters,
    getTrendingProducts,
    generateProductEmbeddingText
};