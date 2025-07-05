import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, message: string, data?: T, statusCode?: number) => Response;
export declare const sendError: (res: Response, error: string, statusCode?: number, details?: any) => Response;
export declare const sendValidationError: (res: Response, errors: Record<string, string[]>, message?: string) => Response;
export declare const sendNotFound: (res: Response, resource?: string) => Response;
export declare const sendUnauthorized: (res: Response, message?: string) => Response;
export declare const sendForbidden: (res: Response, message?: string) => Response;
export declare const sendServerError: (res: Response, message?: string, details?: any) => Response;
export declare const sendPaginatedSuccess: <T>(res: Response, message: string, data: T[], pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}) => Response;
//# sourceMappingURL=responses.d.ts.map