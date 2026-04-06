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
exports.getAnalyticsFunnel = exports.getAnalyticsTags = exports.getAnalyticsList = exports.getAnalyticsOverview = exports.getAdminMe = exports.adminLogin = void 0;
const http_status_1 = __importDefault(require("http-status"));
const admin_1 = __importDefault(require("../services/admin"));
const adminAnalytics_1 = __importDefault(require("../services/adminAnalytics"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
exports.adminLogin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield admin_1.default.loginAdmin(req.body);
    const token = admin.generateAuthToken();
    res.status(http_status_1.default.OK).json({
        token,
        admin: {
            id: admin._id,
            username: admin.username,
            role: admin.role,
        },
    });
}));
exports.getAdminMe = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield admin_1.default.getAdminById(req.admin._id);
    res.status(http_status_1.default.OK).json({ admin });
}));
exports.getAnalyticsOverview = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const overview = yield adminAnalytics_1.default.getOverview();
    res.status(http_status_1.default.OK).json({ overview });
}));
exports.getAnalyticsList = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const exportType = String(req.query.export || "");
    const result = yield adminAnalytics_1.default.getList({
        page,
        limit,
        search: req.query.search ? String(req.query.search) : undefined,
        sortBy: req.query.sortBy ? String(req.query.sortBy) : "createdAt",
        sortOrder: req.query.sortOrder === "asc" ? "asc" : "desc",
        profileType: req.query.profileType ? String(req.query.profileType) : undefined,
        classificationSource: req.query.classificationSource
            ? String(req.query.classificationSource)
            : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
    });
    if (exportType === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="analytics.csv"');
        res.status(http_status_1.default.OK).send(adminAnalytics_1.default.toCsv(result.rows));
        return;
    }
    res.status(http_status_1.default.OK).json(result);
}));
exports.getAnalyticsTags = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tags = yield adminAnalytics_1.default.getTags();
    res.status(http_status_1.default.OK).json({ tags });
}));
exports.getAnalyticsFunnel = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const funnel = yield adminAnalytics_1.default.getFunnel();
    res.status(http_status_1.default.OK).json({ funnel });
}));
//# sourceMappingURL=admin.js.map