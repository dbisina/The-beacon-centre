import { ServiceResponse, CreateAudioSermonRequest, UpdateAudioSermonRequest, AudioSermonFilters } from '../types';
import { AudioSermon } from '@prisma/client';
export declare class AudioSermonService {
    static getAllAudioSermons(filters: AudioSermonFilters): Promise<ServiceResponse<{
        sermons: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    static getAudioSermonById(id: number): Promise<ServiceResponse<any>>;
    static getFeaturedAudioSermons(limit?: number): Promise<ServiceResponse<any[]>>;
    static getAudioSermonsByCategory(categoryId: number, limit?: number): Promise<ServiceResponse<any[]>>;
    static createAudioSermon(sermonData: CreateAudioSermonRequest): Promise<ServiceResponse<AudioSermon>>;
    static updateAudioSermon(id: number, updateData: UpdateAudioSermonRequest): Promise<ServiceResponse<AudioSermon>>;
    static deleteAudioSermon(id: number): Promise<ServiceResponse<{
        id: number;
    }>>;
    static toggleFeatured(id: number): Promise<ServiceResponse<{
        id: number;
        isFeatured: boolean;
    }>>;
    static getAudioSermonStats(): Promise<ServiceResponse<{
        total: number;
        active: number;
        featured: number;
        totalDuration: string;
        totalSize: string;
        byCategory: Array<{
            categoryName: string;
            count: number;
        }>;
        bySpeaker: Array<{
            speaker: string;
            count: number;
        }>;
    }>>;
    private static formatFileSize;
}
//# sourceMappingURL=audioSermon.service.d.ts.map