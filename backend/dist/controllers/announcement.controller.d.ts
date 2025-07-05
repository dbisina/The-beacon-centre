import { Request, Response } from 'express';
export declare class AnnouncementController {
    static getAllAnnouncements(req: Request, res: Response): Promise<void>;
    static getActiveAnnouncements(req: Request, res: Response): Promise<void>;
    static getAnnouncementById(req: Request, res: Response): Promise<void>;
    static createAnnouncement(req: Request, res: Response): Promise<void>;
    static updateAnnouncement(req: Request, res: Response): Promise<void>;
    static deleteAnnouncement(req: Request, res: Response): Promise<void>;
    static toggleActive(req: Request, res: Response): Promise<void>;
    static getAnnouncementStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=announcement.controller.d.ts.map