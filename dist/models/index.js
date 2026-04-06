"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = __importDefault(require("./admin"));
const business_1 = __importDefault(require("./business"));
const conversation_1 = __importDefault(require("./conversation"));
const user_1 = __importDefault(require("./user"));
const db = {
    admin: admin_1.default,
    business: business_1.default,
    conversation: conversation_1.default,
    user: user_1.default,
};
exports.default = db;
//# sourceMappingURL=index.js.map