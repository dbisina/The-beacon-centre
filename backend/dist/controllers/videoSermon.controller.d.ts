import { Request, Response } from 'express';
export declare class VideoSermonController {
    static getAllVideoSermons(req: Request, res: Response): Promise<void>;
    static getVideoSermonById(req: Request, res: Response): Promise<void>;
    static getFeaturedVideoSermons(req: Request, res: Response): Promise<void>;
    static getVideoSermonsByCategory(req: Request, res: Response): Promise<void>;
    static createVideoSermon(req: Request, res: Response): Promise<void>;
    static updateVideoSermon(req: Request, res: Response): Promise<void>;
    static deleteVideoSermon(req: Request, res: Response): Promise<void>;
    static toggleFeatured(req: Request, res: Response): Promise<void>;
    static getVideoSermonStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=videoSermon.controller.d.ts.map