'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { authService } from '@/lib/authService';

interface OTPFormProps {
    mobile: string;
    onBack: () => void;
}

export default function OTPForm({ mobile, onBack }: OTPFormProps) {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        // Countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerifyOTP = async () => {
        if (otp.length !== 4) {
            toast.error("Please enter all 4 digits");
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.verifyOTP({
                mobile,
                otp: otp,
            });

            if (response.success && response.data) {
                authService.setToken(response.data.token);
                toast.success("Welcome to AutoBuzz! 🎉");
                window.location.href = '/dashboard';
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
            toast.error("Verification failed", {
                description: errorMessage,
            });

            // Clear OTP on error
            setOtp('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsResending(true);
        try {
            const response = await authService.resendOTP({ mobile });

            if (response.success) {
                toast.success("OTP Resent! 📱", {
                    description: "Please check your mobile for the new verification code",
                });
                setCountdown(30);
                setOtp('');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
            toast.error("Resend Failed", {
                description: errorMessage,
            });
        } finally {
            setIsResending(false);
        }
    };

    const formatMobile = (mobile: string) => {
        if (mobile.length === 10) {
            return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
        }
        return mobile;
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white">
            <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-3xl font-bold text-gray-900">Verify Your Phone</CardTitle>
                <CardDescription className="text-gray-600">
                    Enter the 4-digit code sent to<br />
                    <span className="font-semibold text-gray-800">{formatMobile(mobile)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center">
                    <InputOTP
                        maxLength={4}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        className="gap-3"
                    >
                        <InputOTPGroup>
                            <InputOTPSlot
                                index={0}
                                className="w-14 h-14 text-xl font-bold border-2 border-gray-300 focus:border-blue-500 rounded-lg"
                            />
                            <InputOTPSlot
                                index={1}
                                className="w-14 h-14 text-xl font-bold border-2 border-gray-300 focus:border-blue-500 rounded-lg"
                            />
                            <InputOTPSlot
                                index={2}
                                className="w-14 h-14 text-xl font-bold border-2 border-gray-300 focus:border-blue-500 rounded-lg"
                            />
                            <InputOTPSlot
                                index={3}
                                className="w-14 h-14 text-xl font-bold border-2 border-gray-300 focus:border-blue-500 rounded-lg"
                            />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <Button
                    onClick={handleVerifyOTP}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                    disabled={isLoading || otp.length !== 4}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify OTP'
                    )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-800 p-0 h-auto"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Signup
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleResendOTP}
                        disabled={countdown > 0 || isResending}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                                Resending...
                            </>
                        ) : countdown > 0 ? (
                            `Resend in ${countdown}s`
                        ) : (
                            <>
                                <RefreshCw className="mr-1 h-4 w-4" />
                                Resend OTP
                            </>
                        )}
                    </Button>
                </div>

                <div className="text-center text-sm text-gray-600">
                    Didn't receive the code? Check your spam folder or try resending
                </div>
            </CardContent>
        </Card>
    );
}