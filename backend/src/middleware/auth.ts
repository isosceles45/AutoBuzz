import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Define the JWT payload structure based on your token
interface JWTPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

// Extend the Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: 'JWT secret not configured' });
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

        // Map your JWT structure to the expected user object
        req.user = {
            id: decoded.userId, // Your JWT uses 'userId', not 'id'
            email: decoded.email
        };

        console.log('Authenticated user:', req.user.id);
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};