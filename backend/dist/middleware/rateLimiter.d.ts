import { Request, Response } from 'express';
export declare const generalApiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminAuthLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminApiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const analyticsLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const createDevLimiter: () => import("express-rate-limit").RateLimitRequestHandler;
export declare const smartRateLimiter: (req: Request, res: Response, next: any) => any;
//# sourceMappingURL=rateLimiter.d.ts.map