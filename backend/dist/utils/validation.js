"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const responses_1 = require("./responses");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg).join(', ');
        (0, responses_1.sendError)(res, 'Validation failed', 400, errorMessages);
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        (0, exports.handleValidationErrors)(req, res, next);
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map