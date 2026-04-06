"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationValidator = exports.sendMessageValidator = exports.startConversationValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.startConversationValidator = {
    body: joi_1.default.object().keys({
        userId: joi_1.default.string().trim().optional(),
    }),
};
exports.sendMessageValidator = {
    body: joi_1.default.object().keys({
        conversationId: joi_1.default.string().trim().allow(null).optional(),
        userId: joi_1.default.string().trim().allow(null).optional(),
        message: joi_1.default.string().trim().required(),
    }),
};
exports.getConversationValidator = {
    params: joi_1.default.object().keys({
        id: joi_1.default.string().trim().required(),
    }),
};
//# sourceMappingURL=conversation.js.map