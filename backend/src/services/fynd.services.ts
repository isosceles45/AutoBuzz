import { AxiosError } from 'axios';
import { FyndUser, UserData } from "../types/user.types.js";
import { generateTempPassword } from "@utils/auth";
import {fyndApi} from "@utils/fyndAPIClient";

const createOrGetFyndUser = async (userData: UserData): Promise<FyndUser> => {
    if (!fyndApi) {
        console.log('⏭️ Skipping Fynd - not configured');
        return { id: null };
    }

    try {
        const tempPassword = generateTempPassword();
        const cleanPhone = userData.phone.replace(/^\+91/, '').replace(/\D/g, '');

        const payload = {
            first_name: userData.firstName,
            last_name: userData.lastName,
            gender: "male",
            email: userData.email,
            password: tempPassword,
            phone: {
                mobile: cleanPhone,
                country_code: "91"
            },
            register_token: "",
            consent: false
        };

        const response = await fyndApi.post('/user/authentication/v1.0/register/form', payload);
        console.log('✅ Fynd user response:', response.data);

        // Return the complete response data with requires_otp flag
        return {
            ...response.data,
            requires_otp: response.data.verify_mobile_otp || false
        };

    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Fynd error:', axiosError.response?.data);
        return { id: null };
    }
};

const verifyFyndOTP = async (requestId: string, registerToken: string, otp: string): Promise<FyndUser> => {
    if (!fyndApi) {
        throw new Error('Fynd API not configured');
    }

    try {
        console.log('🔐 Verifying OTP with Fynd...');
        console.log('📋 Request ID:', requestId);
        console.log('🎫 Register token:', registerToken);
        console.log('📱 OTP:', otp);

        const payload = {
            request_id: requestId,
            register_token: registerToken,
            otp: otp
        };

        console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

        const response = await fyndApi.post('/user/authentication/v1.0/otp/mobile/verify', payload);
        console.log('✅ Fynd OTP verified:', response.data);

        return response.data;

    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Fynd OTP verification failed:');
        console.error('- Status:', axiosError.response?.status);
        console.error('- Data:', JSON.stringify(axiosError.response?.data, null, 2));
        console.error('- Request URL:', axiosError.config?.url);

        const errorData = axiosError.response?.data as any;
        if (errorData?.message) {
            throw new Error(errorData.message);
        }
        throw new Error('OTP verification failed');
    }
};

const resendFyndOTP = async (mobile: string, resendToken: string): Promise<any> => {
    if (!fyndApi) {
        throw new Error('Fynd API not configured');
    }

    try {
        console.log('🔄 Resending OTP...');

        const cleanPhone = mobile.replace(/^\+91/, '').replace(/\D/g, '');

        const payload = {
            encrypt_otp: false,
            mobile: cleanPhone,
            country_code: "91",
            action: "send",
            token: resendToken,
            force: true
        };

        console.log('📤 Resend payload:', JSON.stringify(payload, null, 2));

        const response = await fyndApi.post('/user/authentication/v1.0/otp/mobile/send', payload);
        console.log('📱 OTP resent:', response.data);

        return response.data;

    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('❌ Resend OTP failed:', axiosError.response?.data);
        throw new Error('Failed to resend OTP');
    }
};

export { createOrGetFyndUser, verifyFyndOTP, resendFyndOTP };