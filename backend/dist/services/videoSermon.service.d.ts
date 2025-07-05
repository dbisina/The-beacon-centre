import { ServiceResponse, CreateVideoSermonRequest, UpdateVideoSermonRequest, VideoSermonFilters } from '../types';
import { VideoSermon } from '@prisma/client';
export declare class VideoSermonService {
    static getAllVideoSermons(filters: VideoSermonFilters): Promise<ServiceResponse<{
        sermons: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    static getVideoSermonById(id: number): Promise<ServiceResponse<any>>;
    static getFeaturedVideoSermons(limit?: number): Promise<ServiceResponse<any[]>>;
    static getVideoSermonsByCategory(categoryId: number, limit?: number): Promise<ServiceResponse<any[]>>;
    static createVideoSermon(sermonData: CreateVideoSermonRequest): Promise<ServiceResponse<VideoSermon>>;
    static updateVideoSermon(id: number, updateData: UpdateVideoSermonRequest): Promise<ServiceResponse<VideoSermon>>;
    static deleteVideoSermon(id: number): Promise<ServiceResponse<{
        id: number;
    }>>;
    static toggleFeatured(id: number): Promise<ServiceResponse<{
        id: number;
        isFeatured: boolean;
    }>>;
    static getVideoSermonStats(): Promise<ServiceResponse<{
        total: number;
        active: number;
        featured: number;
        byCategory: Array<{
            categoryName: string;
            count: number;
        }>;
        bySpeaker: Array<{
            speaker: string;
            count: number;
        }>;
    }>>;
}
//# sourceMappingURL=videoSermon.service.d.ts.map