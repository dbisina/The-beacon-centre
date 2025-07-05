import { ServiceResponse, FileUploadResponse } from '../types';
export declare class UploadService {
    static uploadAudio(file: Express.Multer.File): Promise<ServiceResponse<FileUploadResponse>>;
    static uploadImage(file: Express.Multer.File): Promise<ServiceResponse<FileUploadResponse>>;
    static uploadThumbnail(file: Express.Multer.File): Promise<ServiceResponse<FileUploadResponse>>;
    static deleteFile(publicId: string, resourceType?: 'image' | 'video'): Promise<ServiceResponse<{
        publicId: string;
    }>>;
    static getFileDetails(publicId: string, resourceType?: 'image' | 'video'): Promise<ServiceResponse<any>>;
    static generateSignedUrl(publicId: string, transformation?: any): Promise<ServiceResponse<{
        url: string;
    }>>;
    static extractYouTubeThumbnail(youtubeId: string): Promise<ServiceResponse<FileUploadResponse>>;
    static deleteMultipleFiles(publicIds: string[], resourceType?: 'image' | 'video'): Promise<ServiceResponse<{
        deleted: string[];
        failed: string[];
    }>>;
}
//# sourceMappingURL=upload.service.d.ts.map