import { ServiceResponse, CreateDevotionalRequest, UpdateDevotionalRequest, DevotionalFilters } from '../types';
import { Devotional } from '@prisma/client';
export declare class DevotionalService {
    static getAllDevotionals(filters: DevotionalFilters): Promise<ServiceResponse<{
        devotionals: Devotional[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    static getDevotionalById(id: number): Promise<ServiceResponse<Devotional>>;
    static getDevotionalByDate(date: string): Promise<ServiceResponse<Devotional>>;
    static getTodaysDevotional(): Promise<ServiceResponse<Devotional>>;
    static createDevotional(devotionalData: CreateDevotionalRequest): Promise<ServiceResponse<Devotional>>;
    static updateDevotional(id: number, updateData: UpdateDevotionalRequest): Promise<ServiceResponse<Devotional>>;
    static deleteDevotional(id: number): Promise<ServiceResponse<{
        id: number;
    }>>;
    static bulkCreateDevotionals(devotionals: CreateDevotionalRequest[]): Promise<ServiceResponse<{
        created: number;
        skipped: number;
        errors: string[];
    }>>;
}
//# sourceMappingURL=devotional.service.d.ts.map