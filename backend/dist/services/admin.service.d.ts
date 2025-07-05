import { CreateAdminRequest, UpdateAdminRequest, AdminLoginRequest, AdminLoginResponse, ServiceResponse, Admin, AdminRole } from '../types';
export declare class AdminService {
    static login(credentials: AdminLoginRequest): Promise<ServiceResponse<AdminLoginResponse>>;
    static refreshToken(refreshToken: string): Promise<ServiceResponse<{
        accessToken: string;
    }>>;
    static verifyToken(token: string): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>>;
    static getAdmins(includeInactive?: boolean): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>[]>>;
    static getAdminById(id: number): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>>;
    static createAdmin(data: CreateAdminRequest): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>>;
    static updateAdmin(data: UpdateAdminRequest): Promise<ServiceResponse<Omit<Admin, 'passwordHash'>>>;
    static changePassword(adminId: number, currentPassword: string, newPassword: string): Promise<ServiceResponse<{
        message: string;
    }>>;
    static resetPassword(adminId: number, newPassword: string): Promise<ServiceResponse<{
        message: string;
    }>>;
    static deleteAdmin(id: number): Promise<ServiceResponse<{
        id: number;
    }>>;
    static toggleActive(id: number): Promise<ServiceResponse<{
        isActive: boolean;
    }>>;
    static getAdminStats(): Promise<ServiceResponse<{
        total: number;
        active: number;
        inactive: number;
        byRole: Array<{
            role: AdminRole;
            count: number;
        }>;
        recentLogins: Array<{
            id: number;
            name: string;
            email: string;
            lastLogin: Date | null;
            loginCount: number;
        }>;
    }>>;
    static hasPermission(admin: Omit<Admin, 'passwordHash'>, permission: string): boolean;
    static hasRole(admin: Omit<Admin, 'passwordHash'>, role: AdminRole): boolean;
    static hasMinimumRole(admin: Omit<Admin, 'passwordHash'>, minimumRole: AdminRole): boolean;
}
//# sourceMappingURL=admin.service.d.ts.map