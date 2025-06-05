// src/components/onboarding/CategorySelection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { catalogService, Category } from '@/lib/catalogService';

// Category icons mapping for visual appeal
const categoryIcons: Record<string, string> = {
    'electronics': '📱',
    'fashion': '👕',
    'clothing': '👗',
    'home': '🏠',
    'sports': '⚽',
    'books': '📚',
    'toys': '🎮',
    'beauty': '💄',
    'automotive': '🚗',
    'health': '💊',
    'others': '📦',
    'others-level-2': '📋',
    'others-level-3': '🔗'
};

interface CategorySelectionProps {
    onNext: (selectedCategories: string[]) => void;
}

export default function CategorySelection({ onNext }: CategorySelectionProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const fetchedCategories = await catalogService.getCategories();
                console.log('Fetched categories:', fetchedCategories);

                // Flatten categories and get main ones
                const flatCategories = flattenCategories(fetchedCategories);
                setCategories(flatCategories.slice(0, 6)); // Show max 6 categories
            } catch (error) {
                console.error('Error loading categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Helper function to flatten nested categories from Fynd API structure
    const flattenCategories = (apiResponse: any[]): Category[] => {
        const result: Category[] = [];

        const processCategories = (items: any[]) => {
            items.forEach(item => {
                if (item.items) {
                    // This is a department, process its items
                    processCategories(item.items);
                } else {
                    // This is a category item
                    const category: Category = {
                        uid: item.uid?.toString() || item.slug || Math.random().toString(),
                        name: item.name,
                        slug: item.slug
                    };
                    result.push(category);

                    // Process child categories if they exist
                    if (item.childs && item.childs.length > 0) {
                        processCategories(item.childs);
                    }
                }
            });
        };

        processCategories(apiResponse);
        return result;
    };

    const getCategoryIcon = (slug: string): string => {
        return categoryIcons[slug] || categoryIcons[slug.split('-')[0]] || '📦';
    };

    const toggleCategory = (categorySlug: string) => {
        setSelectedCategories(prev =>
            prev.includes(categorySlug)
                ? prev.filter(slug => slug !== categorySlug)
                : [...prev, categorySlug]
        );
    };

    const handleContinue = () => {
        if (selectedCategories.length > 0) {
            onNext(selectedCategories);
        }
    };

    if (loading) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading categories...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                    What interests you?
                </CardTitle>
                <p className="text-gray-600 mt-2">
                    Select categories you'd like to get notifications for
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Category Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((category) => {
                        const isSelected = selectedCategories.includes(category.slug);
                        const icon = getCategoryIcon(category.slug);

                        return (
                            <div
                                key={category.uid || category.slug}
                                onClick={() => toggleCategory(category.slug)}
                                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }
                `}
                            >
                                {/* Selection indicator */}
                                <div className="absolute top-2 right-2">
                                    {isSelected ? (
                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                {/* Category content */}
                                <div className="text-center">
                                    <div className="text-3xl mb-2">{icon}</div>
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">{category.slug}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Show if no categories found */}
                {categories.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No categories available at the moment</p>
                        <Button
                            variant="ghost"
                            onClick={() => onNext([])}
                            className="mt-4 text-blue-600 hover:text-blue-700"
                        >
                            Continue anyway →
                        </Button>
                    </div>
                )}

                {/* Selected count */}
                {selectedCategories.length > 0 && (
                    <div className="text-center">
                        <Badge variant="secondary" className="text-sm">
                            {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                        </Badge>
                    </div>
                )}

                {/* Continue button */}
                {categories.length > 0 && (
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={handleContinue}
                            disabled={selectedCategories.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                        >
                            Continue to Products →
                        </Button>
                    </div>
                )}

                {/* Skip option */}
                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => onNext([])}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Skip for now
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}