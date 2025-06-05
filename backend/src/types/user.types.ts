export interface UserData {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
}

export interface FyndUser {
    id: string | null;
    success?: boolean;
    request_id?: string;
    message?: string;
    mobile?: string;
    resend_token?: string;
    verify_mobile_otp?: boolean;
    register_token?: string;
    requires_otp?: boolean;
    email?: string;
    first_name?: string;
    last_name?: string;
}

export interface RegisterRequest extends UserData {
    password: string;
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

export interface OTPVerificationRequest {
    mobile: string;
    otp: string;
}

export interface ResendOTPRequest {
    mobile: string;
}