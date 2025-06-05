'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/authService';
import { preferenceService, UserPreferences, EnhancedProductPreferences, PreferencesResponse } from '@/lib/preferenceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import CategorySelection from '@/components/onboarding/CategorySelection';
import ProductSwipe from '@/components/onboarding/ProductSwipe';
import FinalPreferences from '@/components/onboarding/FinalPreferences';

type OnboardingStep = 'categories' | 'products' | 'preferences' | 'complete';

export default function DashboardPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('categories');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [productPreferences, setProductPreferences] = useState<EnhancedProductPreferences | null>(null);
    const [finalPreferences, setFinalPreferences] = useState<UserPreferences | null>(null);

    // API states
    const [isStoringPreferences, setIsStoringPreferences] = useState(false);
    const [storeSuccess, setStoreSuccess] = useState(false);
    const [storeError, setStoreError] = useState<string | null>(null);
    const [apiResponse, setApiResponse] = useState<PreferencesResponse | null>(null);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            window.location.href = '/auth';
            return;
        }
        setIsAuthenticated(true);
    }, []);

    const handleCategorySelection = (categories: string[]) => {
        console.log('Selected categories:', categories);
        setSelectedCategories(categories);
        setOnboardingStep('products');
    };

    const handleProductPreferences = (preferences: EnhancedProductPreferences) => {
        console.log('Enhanced product preferences:', preferences);
        setProductPreferences(preferences);
        setOnboardingStep('preferences');
    };

    const handleFinalPreferences = async (preferences: UserPreferences) => {
        console.log('Final preferences:', preferences);

        // Merge enhanced data with final preferences
        const enhancedFinalPreferences: UserPreferences = {
            ...preferences,
            enhancedData: productPreferences
        };

        setFinalPreferences(enhancedFinalPreferences);

        // Reset API states
        setStoreSuccess(false);
        setStoreError(null);
        setIsStoringPreferences(true);

        try {
            console.log('🚀 Sending preferences to API...');
            const result = await preferenceService.storePreferences(enhancedFinalPreferences);

            console.log('✅ API Response:', result);
            setApiResponse(result);
            setStoreSuccess(true);
            setOnboardingStep('complete');

        } catch (error) {
            console.error('❌ API Error:', error);
            setStoreError(error instanceof Error ? error.message : 'Failed to store preferences');
            // Still show complete step but with error indicator
            setOnboardingStep('complete');
        } finally {
            setIsStoringPreferences(false);
        }
    };

    const handleRetry = async () => {
        if (finalPreferences) {
            // Reset states and retry
            setStoreSuccess(false);
            setStoreError(null);
            setIsStoringPreferences(true);

            try {
                const result = await preferenceService.storePreferences(finalPreferences);
                setApiResponse(result);
                setStoreSuccess(true);
            } catch (error) {
                setStoreError(error instanceof Error ? error.message : 'Failed to store preferences');
            } finally {
                setIsStoringPreferences(false);
            }
        }
    };

    const handleLogout = () => {
        authService.removeToken();
        window.location.href = '/auth';
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Auto<span className="text-blue-600">Buzz</span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Loading overlay for API call */}
                {isStoringPreferences && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md mx-4">
                            <CardContent className="flex items-center space-x-4 p-6">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <div>
                                    <h3 className="font-semibold">Processing your preferences...</h3>
                                    <p className="text-sm text-gray-600">
                                        Generating AI embeddings and storing securely
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content - Onboarding Flow */}
                {onboardingStep === 'categories' && (
                    <div className="mb-8">
                        <CategorySelection onNext={handleCategorySelection} />
                    </div>
                )}

                {onboardingStep === 'products' && (
                    <div className="mb-8">
                        <ProductSwipe
                            selectedCategories={selectedCategories}
                            onNext={handleProductPreferences}
                        />
                    </div>
                )}

                {onboardingStep === 'preferences' && productPreferences && (
                    <div className="mb-8">
                        <FinalPreferences
                            previousPreferences={{
                                likedProducts: productPreferences.likedProducts,
                                dislikedProducts: productPreferences.dislikedProducts,
                                selectedCategories: productPreferences.selectedCategories
                            }}
                            onComplete={handleFinalPreferences}
                        />
                    </div>
                )}

                {onboardingStep === 'complete' && (
                    <>
                        {/* API Status Card */}
                        <Card className="mb-6">
                            <CardContent className="p-4">
                                {storeSuccess && (
                                    <div className="flex items-center space-x-3 text-green-700">
                                        <CheckCircle className="h-5 w-5" />
                                        <div>
                                            <h4 className="font-semibold">Preferences Saved Successfully!</h4>
                                            <p className="text-sm text-green-600">
                                                Generated {apiResponse?.embedding?.length || 0} dimensional AI embedding
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {storeError && (
                                    <div className="flex items-center space-x-3 text-red-700">
                                        <AlertCircle className="h-5 w-5" />
                                        <div>
                                            <h4 className="font-semibold">Error Saving Preferences</h4>
                                            <p className="text-sm text-red-600">{storeError}</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={handleRetry}
                                                disabled={isStoringPreferences}
                                            >
                                                {isStoringPreferences ? 'Retrying...' : 'Retry'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle className="text-xl">🎉 Welcome to AutoBuzz!</CardTitle>
                                <CardDescription>
                                    Your profile is complete! We'll now start finding products that match your preferences and notify you when they're available.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {finalPreferences && (
                                    <div className="space-y-6">
                                        {/* Basic Stats */}
                                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                                            <div>• <strong>Categories:</strong> {finalPreferences.selectedCategories.length}</div>
                                            <div>• <strong>Liked products:</strong> {finalPreferences.likedProducts.length}</div>
                                            <div>• <strong>Price range:</strong> {finalPreferences.priceRange.currency}{finalPreferences.priceRange.min} - {finalPreferences.priceRange.currency}{finalPreferences.priceRange.max}</div>
                                            <div>• <strong>Preferred brands:</strong> {finalPreferences.selectedBrands.length}</div>
                                        </div>

                                        {/* Enhanced Insights */}
                                        {finalPreferences.enhancedData && (
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-blue-900 mb-3">Your Preference Insights</h4>
                                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-blue-700 font-medium">Average Liked Price:</span>
                                                        <div className="text-blue-600">
                                                            {finalPreferences.enhancedData.priceInsights.currency}
                                                            {Math.round(finalPreferences.enhancedData.priceInsights.averageLikedPrice)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-700 font-medium">Price Consciousness:</span>
                                                        <div className="text-blue-600 capitalize">
                                                            {finalPreferences.enhancedData.behaviorMetrics.priceConsciousness}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-700 font-medium">Like Rate:</span>
                                                        <div className="text-blue-600">
                                                            {Math.round(finalPreferences.enhancedData.behaviorMetrics.likeRate * 100)}%
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-700 font-medium">Category Diversity:</span>
                                                        <div className="text-blue-600">
                                                            {finalPreferences.enhancedData.behaviorMetrics.categoryDiversity} categories
                                                        </div>
                                                    </div>
                                                </div>

                                                {finalPreferences.enhancedData.brandInsights.preferredBrands.length > 0 && (
                                                    <div className="mt-3">
                                                        <span className="text-blue-700 font-medium">Preferred Brands:</span>
                                                        <div className="text-blue-600">
                                                            {finalPreferences.enhancedData.brandInsights.preferredBrands.join(', ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* API Response Debug Info (remove in production) */}
                                        {apiResponse && process.env.NODE_ENV === 'development' && (
                                            <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                                <h4 className="font-semibold text-gray-700 mb-2">API Response</h4>
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <div><strong>User ID:</strong> {apiResponse.userId}</div>
                                                    <div><strong>Embedding Dimensions:</strong> {apiResponse.embedding.length}</div>
                                                    <div><strong>Text Summary:</strong> {apiResponse.textSummary}</div>
                                                    <div><strong>Created:</strong> {new Date(apiResponse.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}