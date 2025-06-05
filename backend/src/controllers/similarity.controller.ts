import { Request, Response } from 'express';
import { createResponse, sendResponse } from '@utils/response';
import { getProductEmbedding, findSimilarUsers } from '@services/productSimilarity.service';
import { supabase } from '@utils/supabase';

/**
 * Get product by slug and return embedding data
 */
export const getProductBySlug = async (req: Request, res: Response): Promise<any> => {
    try {
        const { productSlug } = req.params;

        if (!productSlug) {
            const response = createResponse.validation(['Product slug is required']);
            return sendResponse(res, response);
        }

        const result = await getProductEmbedding(productSlug);

        const response = createResponse.success({
            product: result.product,
            textSummary: result.textSummary,
            embeddingDimensions: result.embedding.length
        }, 'Product embedding generated successfully');

        return sendResponse(res, response);

    } catch (error) {
        console.error('❌ Error getting product:', error);
        const response = createResponse.error('Failed to get product');
        return sendResponse(res, response);
    }
};

/**
 * Find users similar to a product
 */
export const checkProductSimilarity = async (req: Request, res: Response): Promise<any> => {
    try {
        const { productSlug } = req.params;
        const { threshold = '0.6' } = req.query;

        if (!productSlug) {
            const response = createResponse.validation(['Product slug is required']);
            return sendResponse(res, response);
        }

        const result = await findSimilarUsers(productSlug, parseFloat(threshold as string));

        // Get user details for all matched users
        const userIds = result.matches.map(match => match.userId);

        if (userIds.length === 0) {
            const response = createResponse.success({
                product: result.product,
                similarUsers: [],
                summary: {
                    totalMatches: 0,
                    threshold: parseFloat(threshold as string)
                }
            }, 'No similar users found');
            return sendResponse(res, response);
        }

        // Fetch user profiles and auth data
        const { data: userProfiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, phone')
            .in('id', userIds);

        if (profileError) {
            console.error('Error fetching user profiles:', profileError);
            throw new Error('Failed to fetch user profiles');
        }

        // Fetch auth user data
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('Error fetching auth users:', authError);
            throw new Error('Failed to fetch user auth data');
        }

        // Create a map of user data for quick lookup
        const userDataMap = new Map();

        // Map auth users by ID
        authUsers.users.forEach(user => {
            if (userIds.includes(user.id)) {
                userDataMap.set(user.id, {
                    id: user.id,
                    email: user.email,
                    firstName: user.user_metadata?.first_name || '',
                    lastName: user.user_metadata?.last_name || '',
                    phone: null // Will be updated from profiles
                });
            }
        });

        // Add phone numbers from profiles
        userProfiles?.forEach(profile => {
            if (userDataMap.has(profile.id)) {
                const userData = userDataMap.get(profile.id);
                userData.phone = profile.phone;
                userDataMap.set(profile.id, userData);
            }
        });

        // Enhance matches with user data
        const enhancedMatches = result.matches.map(match => {
            const userData = userDataMap.get(match.userId);
            return {
                userId: match.userId,
                similarity: match.similarity,
                matchQuality: match.matchQuality,
                previouslyLiked: match.previouslyLiked,
                user: userData ? {
                    name: `${userData.firstName} ${userData.lastName}`.trim(),
                    email: userData.email,
                    phone: userData.phone
                } : null
            };
        }).filter(match => match.user !== null); // Remove matches where user data couldn't be found

        const response = createResponse.success({
            product: result.product,
            similarUsers: enhancedMatches,
            summary: {
                totalMatches: enhancedMatches.length,
                threshold: parseFloat(threshold as string)
            }
        }, `Found ${enhancedMatches.length} similar users`);

        return sendResponse(res, response);

    } catch (error) {
        console.error('❌ Error checking similarity:', error);
        const response = createResponse.error('Failed to check similarity');
        return sendResponse(res, response);
    }
};