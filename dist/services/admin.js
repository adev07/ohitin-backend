"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const models_1 = __importDefault(require("../models"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const loginAdmin = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield models_1.default.admin.findOne({ username: body.username });
    if (!admin) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid credentials");
    }
    const isMatch = yield admin.validatePassword(body.password);
    if (!isMatch) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid credentials");
    }
    return admin;
});
const getAdminById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield models_1.default.admin.findById(id).select("-password");
    if (!admin) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Admin not found");
    }
    return admin;
});
exports.default = {
    loginAdmin,
    getAdminById,
};
//# sourceMappingURL=admin.js.map