"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginatedResponse = exports.getPaginationParams = void 0;
const getPaginationParams = (page, limit) => {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
    const skip = (pageNum - 1) * limitNum;
    return {
        page: pageNum,
        limit: limitNum,
        skip,
    };
};
exports.getPaginationParams = getPaginationParams;
const createPaginatedResponse = (items, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data: items,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
};
exports.createPaginatedResponse = createPaginatedResponse;
//# sourceMappingURL=pagination.js.map