'use client';

import { useState } from 'react';
import { Toaster } from 'sonner';
import SignupForm from '@/components/auth/SignupForm';
import OTPForm from '@/components/auth/OTPForm';

export default function AuthPage() {
    const [currentStep, setCurrentStep] = useState<'signup' | 'otp'>('signup');
    const [userMobile, setUserMobile] = useState('');

    const handleOTPRequired = (mobile: string) => {
        setUserMobile(mobile);
        setCurrentStep('otp');
    };

    const handleBackToSignup = () => {
        setCurrentStep('signup');
        setUserMobile('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl flex items-center justify-center">
                {/* Left side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center space-y-8 pr-12">
                    <div className="space-y-6">
                        <h1 className="text-6xl font-bold text-gray-900">
                            Auto<span className="text-blue-600">Buzz</span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            Never miss out on your favorite products again. Get instant notifications when items are back in stock.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-gray-700">Real-time stock alerts</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-gray-700">SMS & Email notifications</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-gray-700">Track multiple products</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side - Auth Forms */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                    {/* Mobile branding */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Auto<span className="text-blue-600">Buzz</span>
                        </h1>
                        <p className="text-gray-600">
                            Get notified when products are back in stock
                        </p>
                    </div>

                    {/* Auth Forms */}
                    {currentStep === 'signup' ? (
                        <SignupForm onOTPRequired={handleOTPRequired} />
                    ) : (
                        <OTPForm mobile={userMobile} onBack={handleBackToSignup} />
                    )}
                </div>
            </div>

            <Toaster />
        </div>
    );
}