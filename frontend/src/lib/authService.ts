import api from './api';
import { RegisterRequest, OTPVerificationRequest, ResendOTPRequest, ApiResponse, AuthResponse } from '@/types/auth';

export const authService = {
    async register(data: RegisterRequest): Promise<ApiResponse> {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async verifyOTP(data: OTPVerificationRequest): Promise<ApiResponse<AuthResponse>> {
        const response = await api.post('/auth/verify-otp', data);
        return response.data;
    },

    async resendOTP(data: ResendOTPRequest): Promise<ApiResponse> {
        const response = await api.post('/auth/resend-otp', data);
        return response.data;
    },

    setToken(token: string): void {
        localStorage.setItem('auth_token', token);
    },

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    },

    removeToken(): void {
        localStorage.removeItem('auth_token');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};