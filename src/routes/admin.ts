import express from "express";
import rateLimit from "express-rate-limit";
import {
  adminLogin,
  getAdminMe,
  getAnalyticsFunnel,
  getAnalyticsList,
  getAnalyticsOverview,
  getAnalyticsTags,
} from "../controllers/admin";
import { authMiddleware } from "../middleware/auth";
import validate from "../middleware/validate";
import { adminLoginValidator, analyticsListValidator } from "../validators/admin";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validate(adminLoginValidator), adminLogin);
router.get("/me", authMiddleware, getAdminMe);
router.get("/analytics/overview", authMiddleware, getAnalyticsOverview);
router.get(
  "/analytics/list",
  authMiddleware,
  validate(analyticsListValidator),
  getAnalyticsList
);
router.get("/analytics/tags", authMiddleware, getAnalyticsTags);
router.get("/analytics/funnel", authMiddleware, getAnalyticsFunnel);

export default router;
