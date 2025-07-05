import { Request, Response } from 'express';
export declare class DevotionalController {
    static getAllDevotionals(req: Request, res: Response): Promise<void>;
    static getDevotionalById(req: Request, res: Response): Promise<void>;
    static getDevotionalByDate(req: Request, res: Response): Promise<void>;
    static getTodaysDevotional(req: Request, res: Response): Promise<void>;
    static createDevotional(req: Request, res: Response): Promise<void>;
    static updateDevotional(req: Request, res: Response): Promise<void>;
    static deleteDevotional(req: Request, res: Response): Promise<void>;
    static bulkCreateDevotionals(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=devotional.controller.d.ts.map