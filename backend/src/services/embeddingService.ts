import OpenAI from 'openai';
import { UserPreferences } from '@/types/preference.types.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generatePreferenceText = (preferences: UserPreferences): string => {
    const enhanced = preferences.enhancedData;

    if (!enhanced) {
        return `User prefers categories: ${preferences.selectedCategories.join(', ')}. 
                Price range: ${preferences.priceRange.currency}${preferences.priceRange.min}-${preferences.priceRange.max}. 
                Brands: ${preferences.selectedBrands.join(', ')}.`;
    }

    const { priceInsights, brandInsights, categoryInsights, behaviorMetrics, likedProductsData } = enhanced;

    let summary = `User shopping preferences: `;
    summary += `Avg liked price ${priceInsights.currency}${Math.round(priceInsights.averageLikedPrice)}. `;
    summary += `Price range ${preferences.priceRange.currency}${preferences.priceRange.min}-${preferences.priceRange.max}. `;
    summary += `${behaviorMetrics.priceConsciousness} price consciousness. `;
    summary += `${Math.round(priceInsights.discountSensitivity * 100)}% discount sensitivity. `;

    if (brandInsights.preferredBrands.length > 0) {
        summary += `Preferred brands: ${brandInsights.preferredBrands.join(', ')}. `;
    }

    const topCategories = categoryInsights
        .filter(cat => cat.affinityScore > 0.5)
        .map(cat => cat.categoryName)
        .slice(0, 3);

    if (topCategories.length > 0) {
        summary += `Top categories: ${topCategories.join(', ')}. `;
    }

    summary += `${Math.round(behaviorMetrics.likeRate * 100)}% like rate. `;

    if (likedProductsData.length > 0) {
        const likedProducts = likedProductsData
            .slice(0, 3)
            .map(p => `${p.name} by ${p.brand}`)
            .join(', ');
        summary += `Liked: ${likedProducts}.`;
    }

    return summary.trim();
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            encoding_format: "float",
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('OpenAI embedding error:', error);
        throw new Error('Failed to generate embedding');
    }
};