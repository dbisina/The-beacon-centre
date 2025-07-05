import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AdminRole } from '../types';
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (requiredRoles: AdminRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const generateTokens: (admin: any) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyRefreshToken: (token: string) => {
    adminId: number;
};
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const ensureDefaultAdmin: () => Promise<void>;
declare const _default: {
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (requiredRoles: AdminRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    requirePermission: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    requireSuperAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    generateTokens: (admin: any) => {
        accessToken: string;
        refreshToken: string;
    };
    verifyRefreshToken: (token: string) => {
        adminId: number;
    };
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map