import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class AdminController {
    static login(req: Request, res: Response): Promise<void>;
    static refreshToken(req: Request, res: Response): Promise<void>;
    static logout(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createAdmin(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAllAdmins(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateAdmin(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteAdmin(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map