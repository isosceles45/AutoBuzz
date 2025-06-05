import { Request, Response } from 'express';
import { generateToken, normalizePhone, JWTPayload } from '@utils/auth';
import { createResponse, sendResponse } from '@utils/response';
import { AuthResponse, RegisterRequest, UserResponse, OTPVerificationRequest, ResendOTPRequest } from "../types/user.types";
import { createOrGetFyndUser, verifyFyndOTP, resendFyndOTP } from "@services/fynd.services";
import { supabase } from "@utils/supabase";

const register = async (req: Request<{}, any, RegisterRequest>, res: Response): Promise<any> => {
    try {
        const { email, phone, password, firstName, lastName } = req.body;

        // Basic validation
        if (!email || !phone || !password || !firstName || !lastName) {
            const response = createResponse.validation(['All fields (email, phone, password, firstName, lastName) are required']);
            return sendResponse(res, response);
        }

        if (!email.includes('@')) {
            const response = createResponse.validation(['Please provide a valid email address']);
            return sendResponse(res, response);
        }

        const normalizedPhone = normalizePhone(phone);

        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                phone: normalizedPhone
            }
        });

        if (authError) {
            const response = createResponse.error(authError.message, 400);
            return sendResponse(res, response);
        }

        // Create user in Fynd
        const fyndUser = await createOrGetFyndUser({
            email,
            phone: normalizedPhone,
            firstName,
            lastName
        });

        // Store essential Fynd data in our profiles table
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                fynd_user_id: fyndUser.id,
                fynd_request_id: fyndUser.request_id,
                fynd_register_token: fyndUser.register_token,
                fynd_resend_token: fyndUser.resend_token,
                fynd_verification_status: fyndUser.requires_otp ? 'otp_pending' : 'verified',
                phone: normalizedPhone,
                notification_preferences: {
                    email: true,
                    sms: true,
                    frequency: 'immediate'
                }
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Rollback auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            const response = createResponse.error('Registration failed. Please try again.');
            return sendResponse(res, response);
        }

        // If OTP required, return pending status
        if (fyndUser.requires_otp) {
            const response = createResponse.success({
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    firstName,
                    lastName,
                    phone: normalizedPhone
                },
                fynd: {
                    mobile: fyndUser.mobile,
                    message: fyndUser.message
                },
                requiresOTP: true
            }, 'Registration pending OTP verification', 202);
            return sendResponse(res, response);
        }

        // Complete registration if no OTP needed
        const tokenPayload: JWTPayload = {
            userId: authData.user.id,
            email: authData.user.email!,
            fyndUserId: fyndUser.id
        };

        const token = generateToken(tokenPayload);

        const userResponse: UserResponse = {
            id: authData.user.id,
            email: authData.user.email!,
            firstName,
            lastName,
            phone: normalizedPhone,
            fyndUserId: fyndUser.id
        };

        const authResponse: AuthResponse = {
            user: userResponse,
            token
        };

        const response = createResponse.success(authResponse, 'User registered successfully', 201);
        return sendResponse(res, response);

    } catch (error) {
        console.error('Registration error:', error);
        const response = createResponse.error('Registration failed. Please try again.');
        return sendResponse(res, response);
    }
};

const verifyOTP = async (req: Request<{}, any, OTPVerificationRequest>, res: Response): Promise<any> => {
    try {
        const { mobile, otp } = req.body;

        if (!mobile || !otp) {
            const response = createResponse.validation(['Mobile number and OTP are required']);
            return sendResponse(res, response);
        }

        // Get user profile by mobile (search in phone field)
        const normalizedMobile = normalizePhone(mobile);
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('phone', normalizedMobile)
            .eq('fynd_verification_status', 'otp_pending')
            .single();

        if (profileError || !userProfile) {
            const response = createResponse.error('No pending verification found for this mobile number', 404);
            return sendResponse(res, response);
        }

        // Verify OTP with Fynd
        const verifiedFyndUser = await verifyFyndOTP(
            userProfile.fynd_request_id,
            userProfile.fynd_register_token,
            otp
        );

        // Update verification status
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                fynd_user_id: verifiedFyndUser.id,
                fynd_verification_status: 'verified',
                fynd_register_token: null
            })
            .eq('id', userProfile.id);

        if (updateError) {
            console.error('Update error:', updateError);
            const response = createResponse.error('Verification update failed');
            return sendResponse(res, response);
        }

        // Get auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userProfile.id);

        if (authError || !authUser.user) {
            const response = createResponse.error('User not found', 404);
            return sendResponse(res, response);
        }

        // Generate token
        const tokenPayload: JWTPayload = {
            userId: authUser.user.id,
            email: authUser.user.email!,
            fyndUserId: verifiedFyndUser.id
        };

        const token = generateToken(tokenPayload);

        const userResponse: UserResponse = {
            id: authUser.user.id,
            email: authUser.user.email!,
            firstName: authUser.user.user_metadata.first_name,
            lastName: authUser.user.user_metadata.last_name,
            phone: userProfile.phone,
            fyndUserId: verifiedFyndUser.id
        };

        const authResponse: AuthResponse = {
            user: userResponse,
            token
        };

        const response = createResponse.success(authResponse, 'OTP verified successfully. Registration complete!', 200);
        return sendResponse(res, response);

    } catch (error) {
        console.error('OTP verification error:', error);
        const response = createResponse.error('OTP verification failed. Please check your OTP and try again.');
        return sendResponse(res, response);
    }
};

const resendOTP = async (req: Request<{}, any, ResendOTPRequest>, res: Response): Promise<any> => {
    try {
        const { mobile } = req.body;

        if (!mobile) {
            const response = createResponse.validation(['Mobile number is required']);
            return sendResponse(res, response);
        }

        // Get user profile by mobile
        const normalizedMobile = normalizePhone(mobile);
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('phone', normalizedMobile)
            .eq('fynd_verification_status', 'otp_pending')
            .single();

        if (profileError || !userProfile) {
            const response = createResponse.error('No pending verification found for this mobile number', 404);
            return sendResponse(res, response);
        }

        // Resend OTP with mobile number and resend token
        const resendResult = await resendFyndOTP(mobile, userProfile.fynd_resend_token);

        // Update the resend token if new one is provided
        if (resendResult.resend_token) {
            await supabase
                .from('user_profiles')
                .update({
                    fynd_resend_token: resendResult.resend_token
                })
                .eq('id', userProfile.id);
        }

        const response = createResponse.success({
            message: resendResult.message || 'OTP resent successfully',
            mobile: resendResult.mobile || mobile
        }, 'OTP resent successfully', 200);
        return sendResponse(res, response);

    } catch (error) {
        console.error('Resend OTP error:', error);
        const response = createResponse.error('Failed to resend OTP. Please try again.');
        return sendResponse(res, response);
    }
};

export { register, verifyOTP, resendOTP };