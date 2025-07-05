import { AdminLoginRequest, AdminLoginResponse, CreateAdminRequest, ServiceResponse } from '../types';
export declare class AuthService {
    static login(credentials: AdminLoginRequest): Promise<ServiceResponse<AdminLoginResponse>>;
    private static fallbackLogin;
    static refreshToken(refreshToken: string): Promise<ServiceResponse<{
        accessToken: string;
    }>>;
    static createAdmin(adminData: CreateAdminRequest): Promise<ServiceResponse<any>>;
    static getAllAdmins(): Promise<ServiceResponse<any[]>>;
    static updateAdmin(adminId: number, updateData: any): Promise<ServiceResponse<any>>;
    static deleteAdmin(adminId: number): Promise<ServiceResponse<any>>;
    static getAdminById(adminId: number): Promise<ServiceResponse<any>>;
    static changePassword(adminId: number, oldPassword: string, newPassword: string): Promise<ServiceResponse<any>>;
}
//# sourceMappingURL=auth.service.d.ts.map