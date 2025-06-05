import express from 'express';
import {
    getAllCategories,
    getProductsByCategory,
    searchCatalogProducts,
    getProductDetails,
    getAllBrands,
    getTrending,
    getCatalogFilters
} from '@controllers/catalog.controller.js';

const router = express.Router();

// Category routes
router.get('/categories', getAllCategories);
router.get('/categories/:categorySlug/products', getProductsByCategory);

// Product routes
router.get('/products/search', searchCatalogProducts);
router.get('/products/trending', getTrending);
router.get('/products/:productSlug', getProductDetails);

// Brands route
router.get('/brands', getAllBrands);

// Filters route
router.get('/filters', getCatalogFilters);

export default router;