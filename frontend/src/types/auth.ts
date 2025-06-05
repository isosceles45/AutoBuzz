export interface RegisterRequest {
    email: string;
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface OTPVerificationRequest {
    mobile: string;
    otp: string;
}

export interface ResendOTPRequest {
    mobile: string;
}

export interface UserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    fyndUserId: string | null;
}

export interface AuthResponse {
    user: UserResponse;
    token: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
    timestamp: string;
}