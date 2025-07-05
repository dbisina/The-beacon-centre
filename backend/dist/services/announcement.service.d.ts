import { ServiceResponse, CreateAnnouncementRequest, UpdateAnnouncementRequest, AnnouncementFilters } from '../types';
import { Announcement } from '@prisma/client';
export declare class AnnouncementService {
    static getAllAnnouncements(filters: AnnouncementFilters): Promise<ServiceResponse<{
        announcements: Announcement[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>>;
    static getActiveAnnouncements(): Promise<ServiceResponse<Announcement[]>>;
    static getAnnouncementById(id: number): Promise<ServiceResponse<Announcement>>;
    static createAnnouncement(announcementData: CreateAnnouncementRequest): Promise<ServiceResponse<Announcement>>;
    static updateAnnouncement(id: number, updateData: UpdateAnnouncementRequest): Promise<ServiceResponse<Announcement>>;
    static deleteAnnouncement(id: number): Promise<ServiceResponse<{
        id: number;
    }>>;
    static toggleActive(id: number): Promise<ServiceResponse<{
        id: number;
        isActive: boolean;
    }>>;
}
//# sourceMappingURL=announcement.service.d.ts.map