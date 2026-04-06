"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsListValidator = exports.adminLoginValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.adminLoginValidator = {
    body: joi_1.default.object().keys({
        username: joi_1.default.string().trim().required(),
        password: joi_1.default.string().required(),
    }),
};
exports.analyticsListValidator = {
    query: joi_1.default.object().keys({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(20),
        search: joi_1.default.string().trim().allow(""),
        sortBy: joi_1.default.string()
            .valid("createdAt", "userId", "profileType", "classificationSource", "status")
            .default("createdAt"),
        sortOrder: joi_1.default.string().valid("asc", "desc").default("desc"),
        profileType: joi_1.default.string().valid("professional", "fan"),
        classificationSource: joi_1.default.string().valid("keyword", "gemini", "fallback"),
        status: joi_1.default.string().valid("ACTIVE", "WAITING_FOR_CONTACT", "COMPLETED"),
        startDate: joi_1.default.date().iso(),
        endDate: joi_1.default.date().iso(),
        export: joi_1.default.string().valid("csv"),
    }),
};
//# sourceMappingURL=admin.js.map