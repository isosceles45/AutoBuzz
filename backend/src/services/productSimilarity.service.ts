import { generateEmbedding } from '@services/embeddingService';
import { getProductDetail } from '@services/fyndCatalog.service';
import { supabase } from '@utils/supabase';

/**
 * Generate text summary for product embedding
 */
function generateProductText(product: any): string {
    // Extract price from attributes
    const price = product.attributes?.min_price_effective || 0;
    const discount = product.attributes?.discount || 0;
    const brand = product.brand?.name || 'Generic';
    const category = product.category_map?.l3?.name || product.categories?.[0]?.name || 'Others';
    const shortDescription = product.short_description || product.attributes?.short_description || '';
    const department = product.department?.name || product.attributes?.departments || '';
    const sizes = product.attributes?.sizes ? product.attributes.sizes.join(', ') : '';

    return `Product: ${product.name} by ${brand}. Category: ${category} in ${department}. Price: ₹${price}. Discount: ${discount}%. Description: ${shortDescription}. Available sizes: ${sizes}.`.trim();
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get product by slug and convert to embedding
 */
export async function getProductEmbedding(productSlug: string) {
    try {
        console.log(`📦 Fetching product: ${productSlug}`);

        // Get product details from Fynd
        const product = await getProductDetail(productSlug);

        if (!product) {
            throw new Error('Product not found');
        }

        // Generate text summary
        const productText = generateProductText(product);
        console.log(`📝 Product text: ${productText}`);

        // Generate embedding
        const embedding = await generateEmbedding(productText);
        console.log(`🧠 Generated embedding with ${embedding.length} dimensions`);

        return {
            product: {
                slug: productSlug,
                name: product.name,
                brand: product.brand?.name || 'Generic',
                price: {
                    effective: product.attributes?.min_price_effective || 0,
                    discount: product.attributes?.discount || 0,
                    currency: '₹'
                },
                category: product.category_map?.l3?.name || product.categories?.[0]?.name || 'Others',
                department: product.department?.name || 'Others',
                description: product.short_description || product.attributes?.short_description || '',
                sizes: product.attributes?.sizes || []
            },
            textSummary: productText,
            embedding
        };

    } catch (error) {
        console.error('❌ Error getting product embedding:', error);
        throw error;
    }
}

/**
 * Find similar users for a product
 */
export async function findSimilarUsers(productSlug: string, threshold: number = 0.7) {
    try {
        // Get product embedding
        const productData = await getProductEmbedding(productSlug);

        // Get all user preferences with embeddings
        const { data: userPreferences, error } = await supabase
            .from('user_preferences')
            .select('user_id, preferences, embedding')
            .not('embedding', 'is', null);

        if (error) {
            throw error;
        }

        console.log(`👥 Checking ${userPreferences?.length || 0} users`);

        // Calculate similarities
        const matches = [];

        for (const userPref of userPreferences || []) {
            const userEmbedding = userPref.embedding as number[];
            const similarity = cosineSimilarity(productData.embedding, userEmbedding);

            if (similarity >= threshold) {
                // Check if user previously interacted with this product
                const likedProducts = userPref.preferences?.likedProducts || [];
                const dislikedProducts = userPref.preferences?.dislikedProducts || [];

                const previouslyLiked = likedProducts.includes(productData.product.slug);
                const previouslyDisliked = dislikedProducts.includes(productData.product.slug);

                // Apply business logic filtering
                let shouldInclude = true;
                let matchQuality = 'good';

                if (previouslyDisliked) {
                    shouldInclude = false; // Don't notify users who disliked this product
                } else if (previouslyLiked) {
                    matchQuality = 'excellent'; // Perfect match - they liked it before
                }

                if (shouldInclude) {
                    matches.push({
                        userId: userPref.user_id,
                        similarity: Math.round(similarity * 100) / 100,
                        matchQuality,
                        previouslyLiked,
                        userPreferences: userPref.preferences
                    });
                }
            }
        }

        // Sort by similarity (highest first)
        matches.sort((a, b) => b.similarity - a.similarity);

        return {
            product: productData.product,
            matches,
            totalMatches: matches.length
        };

    } catch (error) {
        console.error('❌ Error finding similar users:', error);
        throw error;
    }
}