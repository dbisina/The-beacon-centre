import { PaginatedResponse } from '../types';
export declare const getPaginationParams: (page?: string, limit?: string) => {
    page: number;
    limit: number;
    skip: number;
};
export declare const createPaginatedResponse: <T>(items: T[], total: number, page: number, limit: number) => PaginatedResponse<T>;
//# sourceMappingURL=pagination.d.ts.map