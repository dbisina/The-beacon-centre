import { Request, Response } from 'express';
export declare class CategoryController {
    static getAllCategories(req: Request, res: Response): Promise<void>;
    static getCategoryById(req: Request, res: Response): Promise<void>;
    static createCategory(req: Request, res: Response): Promise<void>;
    static updateCategory(req: Request, res: Response): Promise<void>;
    static deleteCategory(req: Request, res: Response): Promise<void>;
    static getCategoryStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=category.controller.d.ts.map