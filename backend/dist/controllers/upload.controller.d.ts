import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class UploadController {
    static uploadAudio(req: AuthenticatedRequest, res: Response): Promise<void>;
    static uploadImage(req: AuthenticatedRequest, res: Response): Promise<void>;
    static uploadThumbnail(req: AuthenticatedRequest, res: Response): Promise<void>;
    static extractYouTubeThumbnail(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteFile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getFileDetails(req: AuthenticatedRequest, res: Response): Promise<void>;
    static generateSignedUrl(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteMultipleFiles(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUploadStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    static uploadHealthCheck(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=upload.controller.d.ts.map