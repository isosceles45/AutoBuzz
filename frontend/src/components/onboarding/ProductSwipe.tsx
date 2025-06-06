'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { catalogService } from '@/lib/catalogService';
import {EnhancedProductPreferences, ProductInteraction} from "@/lib/preferenceService";

interface FyndProduct {
    uid: number;
    name: string;
    slug: string;
    price?: {
        marked?: {
            min: number;
            max: number;
            currency_symbol: string;
        };
        effective?: {
            min: number;
            max: number;
            currency_symbol: string;
        };
    };
    medias?: Array<{
        type: string;
        url: string;
        alt?: string;
    }>;
    brand?: {
        name: string;
    };
    short_description?: string;
    description?: string;
    discount?: string;
    categories?: Array<{
        name: string;
    }>;
    product_online_date?: string;
    country_of_origin?: string;
    sellable?: boolean;
}

interface ProductSwipeProps {
    selectedCategories: string[];
    onNext: (preferences: EnhancedProductPreferences) => void;
}

export default function ProductSwipe({ selectedCategories, onNext }: ProductSwipeProps) {
    const [products, setProducts] = useState<FyndProduct[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likedProducts, setLikedProducts] = useState<string[]>([]);
    const [dislikedProducts, setDislikedProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Enhanced tracking
    const [likedProductsData, setLikedProductsData] = useState<ProductInteraction[]>([]);
    const [dislikedProductsData, setDislikedProductsData] = useState<ProductInteraction[]>([]);
    const [swipeOrder, setSwipeOrder] = useState(0);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let allProducts: FyndProduct[] = [];

                if (selectedCategories.length > 0) {
                    for (const category of selectedCategories) {
                        const categoryProducts = await catalogService.getCategoryProducts(category, 10);
                        allProducts = [...allProducts, ...categoryProducts];
                    }
                }

                if (allProducts.length === 0) {
                    allProducts = await catalogService.getTrendingProducts(20);
                }

                const uniqueProducts = allProducts.filter((product, index, self) =>
                    index === self.findIndex(p => p.slug === product.slug)
                ).slice(0, 10);

                console.log('Products for swiping:', uniqueProducts);
                setProducts(uniqueProducts);
            } catch (error) {
                console.error('Error loading products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategories]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handleDislike();
            } else if (e.key === 'ArrowRight') {
                handleLike();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, products]);

    // Helper functions
    const parseDiscount = (discountStr?: string): number => {
        if (!discountStr) return 0;
        const match = discountStr.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
    };

    const calculateProductAge = (productOnlineDate?: string): number => {
        if (!productOnlineDate) return 0;
        const onlineDate = new Date(productOnlineDate);
        const now = new Date();
        return Math.floor((now.getTime() - onlineDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    const createProductInteraction = (product: FyndProduct, type: 'like' | 'dislike'): ProductInteraction => {
        const effectivePrice = product.price?.effective?.min || product.price?.effective?.max || 0;
        const markedPrice = product.price?.marked?.min || product.price?.marked?.max || effectivePrice;

        return {
            slug: product.slug,
            uid: product.uid,
            name: product.name,
            brand: product.brand?.name || 'Unknown',
            category: product.categories?.[0]?.name || 'Uncategorized',
            price: {
                effective: effectivePrice,
                marked: markedPrice,
                currency: product.price?.effective?.currency_symbol || '₹'
            },
            discount: parseDiscount(product.discount),
            interactionType: type,
            interactionTime: new Date(),
            swipeOrder: swipeOrder,
            hasImages: Boolean(product.medias?.length),
            imageCount: product.medias?.length || 0,
            primaryImageUrl: product.medias?.[0]?.url,
            countryOfOrigin: product.country_of_origin || 'India',
            sellable: product.sellable || true,
            productAge: calculateProductAge(product.product_online_date)
        };
    };

    const currentProduct = products[currentIndex];
    const progress = products.length > 0 ? ((currentIndex + 1) / products.length) * 100 : 0;

    const handleLike = () => {
        if (currentProduct) {
            const interaction = createProductInteraction(currentProduct, 'like');

            setLikedProducts(prev => [...prev, currentProduct.slug]);
            setLikedProductsData(prev => [...prev, interaction]);
            setSwipeOrder(prev => prev + 1);

            nextProduct();
        }
    };

    const handleDislike = () => {
        if (currentProduct) {
            const interaction = createProductInteraction(currentProduct, 'dislike');

            setDislikedProducts(prev => [...prev, currentProduct.slug]);
            setDislikedProductsData(prev => [...prev, interaction]);
            setSwipeOrder(prev => prev + 1);

            nextProduct();
        }
    };

    const nextProduct = () => {
        if (currentIndex < products.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    // Calculate insights
    const calculateInsights = (): EnhancedProductPreferences => {
        // Price insights
        const likedPrices = likedProductsData.map(p => p.price.effective);
        const avgPrice = likedPrices.length > 0 ? likedPrices.reduce((sum, price) => sum + price, 0) / likedPrices.length : 0;
        const discountSensitivity = likedProductsData.length > 0 ?
            likedProductsData.filter(p => p.discount > 0).length / likedProductsData.length : 0;

        const priceInsights = {
            averageLikedPrice: avgPrice,
            priceRangeMin: likedPrices.length > 0 ? Math.min(...likedPrices) * 0.8 : 0,
            priceRangeMax: likedPrices.length > 0 ? Math.max(...likedPrices) * 1.3 : 10000,
            currency: likedProductsData[0]?.price.currency || '₹',
            discountSensitivity
        };

        // Brand insights
        const brandCounts: Record<string, { likes: number; dislikes: number }> = {};
        [...likedProductsData, ...dislikedProductsData].forEach(interaction => {
            if (!brandCounts[interaction.brand]) {
                brandCounts[interaction.brand] = { likes: 0, dislikes: 0 };
            }
            if (interaction.interactionType === 'like') {
                brandCounts[interaction.brand].likes++;
            } else {
                brandCounts[interaction.brand].dislikes++;
            }
        });

        const brandAffinityScores: Record<string, number> = {};
        const preferredBrands: string[] = [];

        Object.entries(brandCounts).forEach(([brand, counts]) => {
            const total = counts.likes + counts.dislikes;
            const affinityScore = total > 0 ? counts.likes / total : 0;
            brandAffinityScores[brand] = affinityScore;

            if (affinityScore >= 0.7 && counts.likes >= 2) {
                preferredBrands.push(brand);
            }
        });

        const brandInsights = { preferredBrands, brandAffinityScores };

        // Category insights
        const categoryStats: Record<string, { likes: number; dislikes: number }> = {};
        [...likedProductsData, ...dislikedProductsData].forEach(interaction => {
            if (!categoryStats[interaction.category]) {
                categoryStats[interaction.category] = { likes: 0, dislikes: 0 };
            }
            if (interaction.interactionType === 'like') {
                categoryStats[interaction.category].likes++;
            } else {
                categoryStats[interaction.category].dislikes++;
            }
        });

        const categoryInsights = Object.entries(categoryStats).map(([categoryName, stats]) => {
            const total = stats.likes + stats.dislikes;
            const affinityScore = total > 0 ? stats.likes / total : 0;

            return {
                categoryName,
                likeCount: stats.likes,
                dislikeCount: stats.dislikes,
                affinityScore
            };
        });

        // Behavior metrics
        const totalSwipes = likedProducts.length + dislikedProducts.length;
        const likeRate = totalSwipes > 0 ? likedProducts.length / totalSwipes : 0;
        const avgDiscount = likedProductsData.length > 0 ?
            likedProductsData.reduce((sum, p) => sum + p.discount, 0) / likedProductsData.length : 0;

        const behaviorMetrics = {
            totalSwipes,
            likeRate,
            skipRate: 1 - likeRate,
            priceConsciousness: avgDiscount > 15 ? 'high' as const : avgDiscount > 5 ? 'medium' as const : 'low' as const,
            categoryDiversity: new Set(likedProductsData.map(p => p.category)).size
        };

        return {
            likedProducts,
            dislikedProducts,
            selectedCategories,
            likedProductsData,
            dislikedProductsData,
            priceInsights,
            brandInsights,
            categoryInsights,
            behaviorMetrics
        };
    };

    const handleFinish = () => {
        const enhancedPreferences = calculateInsights();
        console.log('Enhanced preferences:', enhancedPreferences);
        onNext(enhancedPreferences);
    };

    const formatPrice = (price: any) => {
        if (!price) return 'Price not available';

        const effective = price.effective;
        const marked = price.marked;
        const symbol = effective?.currency_symbol || marked?.currency_symbol || '₹';

        if (effective) {
            if (effective.min && effective.max && effective.min !== effective.max) {
                return `${symbol}${effective.min} - ${symbol}${effective.max}`;
            }
            return `${symbol}${effective.min || effective.max || 'N/A'}`;
        }

        if (marked) {
            if (marked.min && marked.max && marked.min !== marked.max) {
                return `${symbol}${marked.min} - ${symbol}${marked.max}`;
            }
            return `${symbol}${marked.min || marked.max || 'N/A'}`;
        }

        return 'Price not available';
    };

    const getDiscountedPrice = (price: any) => {
        if (!price?.marked || !price?.effective) return null;

        const marked = price.marked.min || price.marked.max;
        const effective = price.effective.min || price.effective.max;
        const symbol = price.effective.currency_symbol || '₹';

        if (marked && effective && marked > effective) {
            return {
                original: `${symbol}${marked}`,
                discounted: `${symbol}${effective}`,
                savings: marked - effective
            };
        }

        return null;
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card className="w-full max-w-md mx-auto">
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading products...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card className="w-full max-w-md mx-auto">
                    <CardContent className="text-center py-12">
                        <div className="text-center">
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-600 mb-6">
                                We couldn't find any products in your selected categories.
                            </p>
                            <Button
                                onClick={handleFinish}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Continue anyway →
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-8">
                {/* Left Side - Instructions & Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Product Selection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Help us understand your preferences by indicating which products interest you.
                            </p>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progress</span>
                                    <span>{currentIndex + 1} of {products.length}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{likedProducts.length}</div>
                                    <div className="text-xs text-gray-500">Interested</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-400">{dislikedProducts.length}</div>
                                    <div className="text-xs text-gray-500">Skipped</div>
                                </div>
                            </div>

                            {/* Keyboard shortcuts */}
                            <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500 mb-2">Keyboard shortcuts:</p>
                                <div className="space-y-1">
                                    <div className="flex items-center text-xs text-gray-600">
                                        <ArrowLeft className="h-3 w-3 mr-2" />
                                        Skip product
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600">
                                        <ArrowRight className="h-3 w-3 mr-2" />
                                        Mark as interested
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center - Product Card */}
                <div className="flex flex-col">
                    {currentProduct && (
                        <Card className="flex-1">
                            <CardContent className="p-6 space-y-4">
                                {/* Product Image */}
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    {currentProduct.medias && currentProduct.medias[0] ? (
                                        <img
                                            src={currentProduct.medias[0].url}
                                            alt={currentProduct.medias[0].alt || currentProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">📦</div>
                                                <p className="text-sm">No image</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                                            {currentProduct.name}
                                        </h3>

                                        {currentProduct.brand && (
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                {currentProduct.brand.name}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="space-y-1">
                                        {(() => {
                                            const priceInfo = getDiscountedPrice(currentProduct.price);
                                            if (priceInfo) {
                                                return (
                                                    <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-blue-600">
                              {priceInfo.discounted}
                            </span>
                                                        <span className="text-sm text-gray-500 line-through">
                              {priceInfo.original}
                            </span>
                                                        {currentProduct.discount && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                {currentProduct.discount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <span className="text-xl font-bold text-blue-600">
                            {formatPrice(currentProduct.price)}
                          </span>
                                                );
                                            }
                                        })()}
                                    </div>

                                    {/* Category */}
                                    {currentProduct.categories && currentProduct.categories[0] && (
                                        <p className="text-sm text-gray-600">
                                            in {currentProduct.categories[0].name}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Side - Action Buttons */}
                <div className="space-y-4">
                    <Button
                        onClick={handleLike}
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16"
                    >
                        <Heart className="h-6 w-6 mr-3" />
                        <div className="text-left">
                            <div className="font-semibold">Interested</div>
                            <div className="text-xs opacity-90">I like this product</div>
                        </div>
                    </Button>

                    <Button
                        onClick={handleDislike}
                        variant="outline"
                        size="lg"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-16"
                    >
                        <X className="h-6 w-6 mr-3" />
                        <div className="text-left">
                            <div className="font-semibold">Skip</div>
                            <div className="text-xs opacity-75">Not interested</div>
                        </div>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleFinish}
                        className="w-full text-gray-500 hover:text-gray-700 mt-8"
                    >
                        Skip remaining products →
                    </Button>
                </div>
            </div>

            {/* Mobile Layout - Same as before but using updated handlers */}
            <div className="md:hidden">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">
                            Quick likes to personalize
                        </CardTitle>
                        <p className="text-gray-600 text-sm">
                            Swipe through products to help us understand your preferences
                        </p>

                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {currentIndex + 1} of {products.length}
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {currentProduct && (
                            <>
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    {currentProduct.medias && currentProduct.medias[0] ? (
                                        <img
                                            src={currentProduct.medias[0].url}
                                            alt={currentProduct.medias[0].alt || currentProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">📦</div>
                                                <p className="text-sm">No image</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center space-y-2">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                                        {currentProduct.name}
                                    </h3>

                                    {currentProduct.brand && (
                                        <Badge variant="secondary" className="text-xs">
                                            {currentProduct.brand.name}
                                        </Badge>
                                    )}

                                    <div className="space-y-1">
                                        {(() => {
                                            const priceInfo = getDiscountedPrice(currentProduct.price);
                                            if (priceInfo) {
                                                return (
                                                    <div className="flex items-center justify-center space-x-2">
                            <span className="text-xl font-bold text-blue-600">
                              {priceInfo.discounted}
                            </span>
                                                        <span className="text-sm text-gray-500 line-through">
                              {priceInfo.original}
                            </span>
                                                        {currentProduct.discount && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                {currentProduct.discount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <span className="text-xl font-bold text-blue-600">
                            {formatPrice(currentProduct.price)}
                          </span>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>

                                <div className="flex justify-center space-x-6 pt-4">
                                    <Button
                                        onClick={handleDislike}
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 max-w-[140px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                    >
                                        <X className="h-5 w-5 mr-2" />
                                        Skip
                                    </Button>

                                    <Button
                                        onClick={handleLike}
                                        size="lg"
                                        className="flex-1 max-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Heart className="h-5 w-5 mr-2" />
                                        Interested
                                    </Button>
                                </div>

                                <p className="text-center text-xs text-gray-400">
                                    Or use keyboard: ← to skip, → to like
                                </p>
                            </>
                        )}

                        <div className="flex justify-center space-x-6 pt-4 border-t">
                            <div className="text-center">
                                <div className="text-sm font-semibold text-green-600">{likedProducts.length}</div>
                                <div className="text-xs text-gray-500">Interested</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-semibold text-gray-400">{dislikedProducts.length}</div>
                                <div className="text-xs text-gray-500">Skipped</div>
                            </div>
                        </div>

                        <div className="text-center pt-2">
                            <Button
                                variant="ghost"
                                onClick={handleFinish}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Skip remaining products →
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}