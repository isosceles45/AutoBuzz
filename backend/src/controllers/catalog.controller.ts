// src/controllers/catalog.controller.ts
import { Request, Response } from 'express';
import { createResponse, sendResponse } from '@utils/response';
import {
    getBrands,
    getCategories, getCategoryFilters,
    getCategoryProducts,
    getProductDetail, getTrendingProducts,
    searchProducts
} from "@services/fyndCatalog.service";

// Get all categories
const getAllCategories = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('📂 Fetching categories...');

        const categories = await getCategories();

        const response = createResponse.success({
            categories,
            total: categories.length
        }, 'Categories fetched successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Categories fetch error:', error);
        const response = createResponse.error('Failed to fetch categories');
        return sendResponse(res, response);
    }
};

// Get products by category
const getProductsByCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { categorySlug } = req.params;
        const {
            page = '1',
            pageSize = '20',
            sortOn = 'latest'
        } = req.query;

        if (!categorySlug) {
            const response = createResponse.validation(['Category slug is required']);
            return sendResponse(res, response);
        }

        console.log(`🛍️ Fetching products for category: ${categorySlug}`);

        const result = await getCategoryProducts(
            categorySlug,
            parseInt(page as string),
            parseInt(pageSize as string),
            sortOn as string
        );

        const response = createResponse.success({
            ...result,
            category: categorySlug
        }, 'Products fetched successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Category products fetch error:', error);
        const response = createResponse.error('Failed to fetch category products');
        return sendResponse(res, response);
    }
};

// Search products
const searchCatalogProducts = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            q: query = '',
            page = '1',
            pageSize = '20',
            category,
            brand,
            priceMin,
            priceMax
        } = req.query;

        console.log(`🔍 Searching products with query: "${query}"`);

        // Build filters
        const filters: Record<string, string[]> = {};
        if (category) filters.category = Array.isArray(category) ? category as string[] : [category as string];
        if (brand) filters.brand = Array.isArray(brand) ? brand as string[] : [brand as string];
        if (priceMin || priceMax) {
            filters.price = [`${priceMin || 0}-${priceMax || 999999}`];
        }

        const result = await searchProducts(
            query as string,
            parseInt(page as string),
            parseInt(pageSize as string),
            Object.keys(filters).length > 0 ? filters : undefined
        );

        const response = createResponse.success({
            ...result,
            query,
            appliedFilters: filters
        }, 'Search completed successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Product search error:', error);
        const response = createResponse.error('Failed to search products');
        return sendResponse(res, response);
    }
};

// Get product details
const getProductDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { productSlug } = req.params;

        if (!productSlug) {
            const response = createResponse.validation(['Product slug is required']);
            return sendResponse(res, response);
        }

        console.log(`📦 Fetching product details for: ${productSlug}`);

        const product = await getProductDetail(productSlug);

        if (!product) {
            const response = createResponse.error('Product not found', 404);
            return sendResponse(res, response);
        }

        const response = createResponse.success({
            product
        }, 'Product details fetched successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Product details fetch error:', error);
        const response = createResponse.error('Failed to fetch product details');
        return sendResponse(res, response);
    }
};

// Get all brands
const getAllBrands = async (req: Request, res: Response): Promise<any> => {
    try {
        const { pageSize = '100' } = req.query;

        console.log('🏷️ Fetching brands...');

        const brands = await getBrands(parseInt(pageSize as string));

        const response = createResponse.success({
            brands,
            total: brands.length
        }, 'Brands fetched successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Brands fetch error:', error);
        const response = createResponse.error('Failed to fetch brands');
        return sendResponse(res, response);
    }
};

// Get trending products
const getTrending = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            pageSize = '20',
            category
        } = req.query;

        console.log('🔥 Fetching trending products...');

        const products = await getTrendingProducts(
            parseInt(pageSize as string),
            category as string
        );

        const response = createResponse.success({
            products,
            total: products.length,
            category: category || 'all'
        }, 'Trending products fetched successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Trending products fetch error:', error);
        const response = createResponse.error('Failed to fetch trending products');
        return sendResponse(res, response);
    }
};

// Get catalog filters
const getCatalogFilters = async (req: Request, res: Response): Promise<any> => {
    try {
        const { category } = req.query;

        console.log('🎛️ Fetching catalog filters...');

        const filters = await getCategoryFilters(category as string);

        const response = createResponse.success({
            ...filters,
            category: category || 'all'
        }, 'Catalog filters fetched successfully');

        return sendResponse(res, response);
    } catch (error) {
        console.error('Catalog filters fetch error:', error);
        const response = createResponse.error('Failed to fetch catalog filters');
        return sendResponse(res, response);
    }
};

export {
    getAllCategories,
    getProductsByCategory,
    searchCatalogProducts,
    getProductDetails,
    getAllBrands,
    getTrending,
    getCatalogFilters
};