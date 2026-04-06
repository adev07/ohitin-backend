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
exports.authMiddleware = exports.isAuthenticated = void 0;
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = __importDefault(require("../models"));
const getBearerToken = (req) => {
    var _a;
    if (!((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer "))) {
        return null;
    }
    return req.headers.authorization.split(" ")[1];
};
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(http_status_1.default.FORBIDDEN).json({
                message: "headers does not have a bearer token",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const authenticatedUser = yield models_1.default.user.findById(decoded._id).lean();
        if (!authenticatedUser) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                message: "You are not authorized to access this route",
                success: false,
            });
        }
        req.user = authenticatedUser;
        return next();
    }
    catch (_error) {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            message: "Token expired.Login Again",
        });
    }
});
exports.isAuthenticated = isAuthenticated;
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = getBearerToken(req);
        if (!token) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                message: "Unauthorized",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== "admin") {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                message: "Unauthorized",
            });
        }
        const admin = yield models_1.default.admin.findById(decoded._id).select("-password").lean();
        if (!admin) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                message: "Unauthorized",
            });
        }
        req.admin = admin;
        return next();
    }
    catch (_error) {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            message: "Unauthorized",
        });
    }
});
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map