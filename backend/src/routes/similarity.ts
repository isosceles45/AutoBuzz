import express from 'express';
import {checkProductSimilarity, getProductBySlug} from "@controllers/similarity.controller";

const router = express.Router();

// Get product by slug with embedding
router.get('/product/:productSlug', getProductBySlug);

// Check similarity between product and users
router.get('/product/:productSlug/similar-users', checkProductSimilarity);

export default router;