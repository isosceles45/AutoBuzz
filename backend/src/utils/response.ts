interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    statusCode: number;
    timestamp: string;
}

const createResponse = {
    success: <T>(data: T, message: string = 'Success', statusCode: number = 200): ApiResponse<T> => ({
        success: true,
        message,
        data,
        statusCode,
        timestamp: new Date().toISOString()
    }),

    error: (message: string = 'An error occurred', statusCode: number = 500, details: any = null): ApiResponse => ({
        success: false,
        message,
        error: details,
        statusCode,
        timestamp: new Date().toISOString()
    }),

    validation: (errors: string[]): ApiResponse => ({
        success: false,
        message: 'Validation failed',
        error: errors,
        statusCode: 400,
        timestamp: new Date().toISOString()
    })
};

const sendResponse = (res: any, response: ApiResponse): any => {
    return res.status(response.statusCode).json(response);
};

export { createResponse, sendResponse };
export type { ApiResponse };