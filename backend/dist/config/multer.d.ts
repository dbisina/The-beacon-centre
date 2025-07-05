import multer from 'multer';
export declare const uploadAudio: multer.Multer;
export declare const uploadImage: multer.Multer;
export declare const uploadAny: multer.Multer;
import { Request, Response } from 'express';
export declare class UploadController {
    static uploadAudio(req: Request, res: Response): Promise<void>;
    static uploadImage(req: Request, res: Response): Promise<void>;
    static uploadThumbnail(req: Request, res: Response): Promise<void>;
    static deleteFile(req: Request, res: Response): Promise<void>;
    static getFileDetails(req: Request, res: Response): Promise<void>;
    static extractYouTubeThumbnail(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=multer.d.ts.map