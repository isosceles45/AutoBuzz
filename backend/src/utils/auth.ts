import jwt from 'jsonwebtoken';

interface JWTPayload {
    userId: string;
    email: string;
    fyndUserId: string | null;
}

const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '7d'
    });
};


const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    return phone;
};

export { generateToken, verifyToken, normalizePhone, generateTempPassword };
export type { JWTPayload };