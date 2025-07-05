"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginatedSuccess = exports.sendServerError = exports.sendForbidden = exports.sendUnauthorized = exports.sendNotFound = exports.sendValidationError = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, message, data, statusCode = 200) => {
    const response = {
        success: true,
        message,
        data
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 400, details) => {
    const response = {
        success: false,
        error,
        ...(details && { errors: details })
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendValidationError = (res, errors, message = 'Validation failed') => {
    const response = {
        success: false,
        error: message,
        errors
    };
    return res.status(422).json(response);
};
exports.sendValidationError = sendValidationError;
const sendNotFound = (res, resource = 'Resource') => {
    const response = {
        success: false,
        error: `${resource} not found`
    };
    return res.status(404).json(response);
};
exports.sendNotFound = sendNotFound;
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    const response = {
        success: false,
        error: message
    };
    return res.status(401).json(response);
};
exports.sendUnauthorized = sendUnauthorized;
const sendForbidden = (res, message = 'Access forbidden') => {
    const response = {
        success: false,
        error: message
    };
    return res.status(403).json(response);
};
exports.sendForbidden = sendForbidden;
const sendServerError = (res, message = 'Internal server error', details) => {
    const response = {
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && details && { errors: details })
    };
    return res.status(500).json(response);
};
exports.sendServerError = sendServerError;
const sendPaginatedSuccess = (res, message, data, pagination) => {
    const response = {
        success: true,
        message,
        data: {
            items: data,
            pagination
        }
    };
    return res.status(200).json(response);
};
exports.sendPaginatedSuccess = sendPaginatedSuccess;
//# sourceMappingURL=responses.js.map