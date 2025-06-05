import express, { Request, Response } from 'express';
import { generatePreferenceText, generateEmbedding } from '@services/embeddingService';
import { supabase } from '@utils/supabase';
import { authenticateToken } from '@/middleware/auth';
import {CreatePreferencesRequest, PreferencesResponse} from "@/types/preference.types.js";

const router = express.Router();

router.post('/store', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { preferences }: CreatePreferencesRequest = req.body;

        if (!preferences) {
            res.status(400).json({ error: 'Preferences data is required' });
            return;
        }

        console.log('Processing preferences for user:', userId);

        // Generate text summary
        const textSummary = generatePreferenceText(preferences);
        console.log('Generated text summary:', textSummary);

        // Generate OpenAI embedding
        const embedding = await generateEmbedding(textSummary);
        console.log('Generated embedding with dimensions:', embedding.length);

        // Check if user already has preferences
        const { data: existingPrefs } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', userId)
            .single();

        let result: any;

        if (existingPrefs) {
            // Update existing
            const { data, error } = await supabase
                .from('user_preferences')
                .update({
                    preferences: preferences,
                    embedding: embedding,
                    text_summary: textSummary,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('Supabase update error:', error);
                res.status(500).json({ error: 'Failed to update preferences' });
                return;
            }
            result = data;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('user_preferences')
                .insert({
                    user_id: userId,
                    preferences: preferences,
                    embedding: embedding,
                    text_summary: textSummary,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                res.status(500).json({ error: 'Failed to create preferences' });
                return;
            }
            result = data;
        }

        // Return response
        const response: PreferencesResponse = {
            id: result.id,
            userId: result.user_id,
            preferences: result.preferences,
            embedding: result.embedding,
            textSummary: result.text_summary,
            createdAt: result.created_at,
            updatedAt: result.updated_at
        };

        console.log('✅ Preferences stored successfully for user:', userId);
        res.status(200).json(response);

    } catch (error) {
        console.error('❌ Error storing preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;