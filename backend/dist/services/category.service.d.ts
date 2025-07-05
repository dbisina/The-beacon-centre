import { ServiceResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types';
import { Category } from '@prisma/client';
export declare class CategoryService {
    static getAllCategories(): Promise<ServiceResponse<Category[]>>;
    static getCategoryById(id: number): Promise<ServiceResponse<Category>>;
    static createCategory(categoryData: CreateCategoryRequest): Promise<ServiceResponse<Category>>;
    static updateCategory(id: number, updateData: UpdateCategoryRequest): Promise<ServiceResponse<Category>>;
    static deleteCategory(id: number): Promise<ServiceResponse<{
        id: number;
    }>>;
    static getCategoryStats(): Promise<ServiceResponse<{
        total: number;
        active: number;
        usage: Array<{
            categoryName: string;
            videoCount: number;
            audioCount: number;
            totalCount: number;
        }>;
    }>>;
}
//# sourceMappingURL=category.service.d.ts.map