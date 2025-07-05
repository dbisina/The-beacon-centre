import { Request, Response } from 'express';
export declare class AudioSermonController {
    static getAllAudioSermons(req: Request, res: Response): Promise<void>;
    static getAudioSermonById(req: Request, res: Response): Promise<void>;
    static getFeaturedAudioSermons(req: Request, res: Response): Promise<void>;
    static getAudioSermonsByCategory(req: Request, res: Response): Promise<void>;
    static createAudioSermon(req: Request, res: Response): Promise<void>;
    static createAudioSermonWithUpload(req: Request, res: Response): Promise<void>;
    static updateAudioSermon(req: Request, res: Response): Promise<void>;
    static deleteAudioSermon(req: Request, res: Response): Promise<void>;
    static toggleFeatured(req: Request, res: Response): Promise<void>;
    static getAudioSermonStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=audioSermon.controller.d.ts.map