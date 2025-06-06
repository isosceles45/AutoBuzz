'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Check, DollarSign, Tag } from 'lucide-react';
import { catalogService } from '@/lib/catalogService';

interface Brand {
    uid: number;
    name: string;
    logo?: {
        url: string;
        alt?: string;
    };
}

interface Filter {
    key: {
        display: string;
        name: string;
        kind: string;
    };
    values: Array<{
        display: string;
        value?: string;
        min?: number;
        max?: number;
        currency_symbol?: string;
        count?: number;
    }>;
}

interface SearchResult {
    uid: number;
    name: string;
    slug: string;
    brand?: {
        name: string;
    };
}

interface UserPreferences {
    selectedCategories: string[];
    likedProducts: string[];
    dislikedProducts: string[];
    priceRange: {
        min: number;
        max: number;
        currency: string;
    };
    selectedBrands: string[];
    selectedSizes: string[];
}

interface FinalPreferencesProps {
    previousPreferences: {
        selectedCategories: string[];
        likedProducts: string[];
        dislikedProducts: string[];
    };
    onComplete: (preferences: UserPreferences) => void;
}

export default function FinalPreferences({ previousPreferences, onComplete }: FinalPreferencesProps) {
    // Data from APIs
    const [brands, setBrands] = useState<Brand[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);

    // User selections
    const [priceRange, setPriceRange] = useState<[number, number]>([500, 5000]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch brands and filters in parallel
                const [brandsData, filtersData] = await Promise.all([
                    catalogService.getBrands(),
                    catalogService.getFilters()
                ]);

                console.log('Brands data:', brandsData);
                console.log('Filters data:', filtersData);

                setBrands(brandsData.slice(0, 12)); // Show top 12 brands

                // Extract price filter to set default range
                const priceFilter = filtersData.find(f => f.key.name === 'min_price_effective');
                if (priceFilter && priceFilter.values[0]) {
                    const { min, max } = priceFilter.values[0];
                    if (min !== undefined && max !== undefined) {
                        setPriceRange([min, max]);
                    }
                }

                setFilters(filtersData);
            } catch (error) {
                console.error('Error fetching preferences data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleBrand = (brandName: string) => {
        setSelectedBrands(prev =>
            prev.includes(brandName)
                ? prev.filter(b => b !== brandName)
                : [...prev, brandName]
        );
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size)
                ? prev.filter(s => s !== size)
                : [...prev, size]
        );
    };

    const getPriceFilter = () => {
        return filters.find(f => f.key.name === 'min_price_effective');
    };

    const getSizeFilter = () => {
        return filters.find(f => f.key.name === 'sizes');
    };

    const formatPrice = (amount: number) => {
        const priceFilter = getPriceFilter();
        const symbol = priceFilter?.values[0]?.currency_symbol || '₹';
        return `${symbol}${amount.toLocaleString()}`;
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        const priceFilter = getPriceFilter();
        const currency = priceFilter?.values[0]?.currency_symbol || '₹';

        const finalPreferences: UserPreferences = {
            ...previousPreferences,
            priceRange: {
                min: priceRange[0],
                max: priceRange[1],
                currency
            },
            selectedBrands,
            selectedSizes,
        };

        console.log('Final preferences:', finalPreferences);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        onComplete(finalPreferences);
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading preferences...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        🎯 Final Preferences
                    </CardTitle>
                    <p className="text-gray-600">
                        Let's fine-tune your preferences to get you the best recommendations
                    </p>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Price Range */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                                Price Range
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Set your preferred price range for products
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="px-2">
                                <Slider
                                    value={priceRange}
                                    onValueChange={(val) => setPriceRange([val[0], val[1]])}
                                    max={getPriceFilter()?.values[0]?.max ?? 10000}
                                    min={getPriceFilter()?.values[0]?.min ?? 0}
                                    step={50}
                                    className="w-full"
                                />

                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-blue-600">
                                  {formatPrice(priceRange[0])}
                                </span>
                                <span className="text-gray-500">to</span>
                                <span className="font-semibold text-blue-600">
                                  {formatPrice(priceRange[1])}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Size Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Tag className="h-5 w-5 mr-2 text-orange-600" />
                                Preferred Sizes
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Select your preferred sizes (optional)
                            </p>
                        </CardHeader>
                        <CardContent>
                            {getSizeFilter()?.values && getSizeFilter()!.values.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {getSizeFilter()?.values.map((size) => {
                                        const isSelected = selectedSizes.includes(size.value || size.display);
                                        return (
                                            <div
                                                key={size.value || size.display}
                                                onClick={() => toggleSize(size.value || size.display)}
                                                className={`
                                                    px-4 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center min-w-[60px]
                                                    ${isSelected
                                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                }
                                                `}
                                            >
                                                <div className="font-medium text-lg">{size.display}</div>
                                                <div className="text-xs text-gray-500 mt-1">({size.count} items)</div>
                                                {isSelected && (
                                                    <Check className="h-4 w-4 text-orange-600 mx-auto mt-1" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No sizes available</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Brand Preferences */}
                    <Card className="h-full text-start">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <Tag className="h-5 w-5 mr-2 text-purple-600" />
                                Preferred Brands
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Select brands you like (optional)
                            </p>
                        </CardHeader>
                        <CardContent>
                            {brands.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {brands.map((brand) => {
                                        const isSelected = selectedBrands.includes(brand.name);
                                        return (
                                            <div
                                                key={brand.uid}
                                                onClick={() => toggleBrand(brand.name)}
                                                className={`
                          p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center
                          ${isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                }
                        `}
                                            >
                                                {/* Brand Logo */}
                                                {brand.logo?.url ? (
                                                    <img
                                                        src={brand.logo.url}
                                                        alt={brand.logo.alt || brand.name}
                                                        className="w-8 h-8 mx-auto mb-2 object-contain"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded flex items-center justify-center">
                                                        <Tag className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}

                                                <div className="text-sm font-medium text-gray-900">
                                                    {brand.name}
                                                </div>

                                                {isSelected && (
                                                    <Check className="h-4 w-4 text-blue-600 mx-auto mt-1" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No brands available</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Summary & Submit */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">📊 Your Preferences Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Categories:</span> {previousPreferences.selectedCategories.length}
                        </div>
                        <div>
                            <span className="font-medium">Liked products:</span> {previousPreferences.likedProducts.length}
                        </div>
                        <div>
                            <span className="font-medium">Price range:</span> {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                        </div>
                        <div>
                            <span className="font-medium">Brands:</span> {selectedBrands.length}
                        </div>
                        <div>
                            <span className="font-medium">Sizes:</span> {selectedSizes.length}
                        </div>
                    </div>

                    <div className="pt-4 border-t text-center">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Setting up your profile...
                                </>
                            ) : (
                                <>
                                    Complete Setup →
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}