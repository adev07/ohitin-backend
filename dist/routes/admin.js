"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const admin_1 = require("../controllers/admin");
const auth_1 = require("../middleware/auth");
const validate_1 = __importDefault(require("../middleware/validate"));
const admin_2 = require("../validators/admin");
const router = express_1.default.Router();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
router.post("/login", loginLimiter, (0, validate_1.default)(admin_2.adminLoginValidator), admin_1.adminLogin);
router.get("/me", auth_1.authMiddleware, admin_1.getAdminMe);
router.get("/analytics/overview", auth_1.authMiddleware, admin_1.getAnalyticsOverview);
router.get("/analytics/list", auth_1.authMiddleware, (0, validate_1.default)(admin_2.analyticsListValidator), admin_1.getAnalyticsList);
router.get("/analytics/tags", auth_1.authMiddleware, admin_1.getAnalyticsTags);
router.get("/analytics/funnel", auth_1.authMiddleware, admin_1.getAnalyticsFunnel);
exports.default = router;
//# sourceMappingURL=admin.js.map