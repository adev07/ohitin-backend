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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const cors_1 = __importDefault(require("cors"));
const assistant_1 = require("./config/assistant");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Middleware to ensure DB connection on every request (serverless-safe)
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.connectDB)();
        next();
    }
    catch (err) {
        console.error("DB connection failed:", err);
        res.status(500).json({ error: "Database connection failed" });
    }
}));
app.get("/", (req, res) => {
    res.json({
        name: "AI-GENT 001",
        message: assistant_1.ASSISTANT_DEFAULT_MESSAGE,
        status: "ok",
    });
});
app.use("/api", routes_1.default);
app.use(error_1.errorConverter);
app.use(error_1.errorHandler);
// Default export for Vercel (detected automatically at src/app.ts)
exports.default = app;
// Local development server — only runs when executed directly
if (require.main === module) {
    const port = Number(process.env.PORT) || 4000;
    (0, db_1.connectDB)().then(() => {
        app.listen(port, () => {
            console.log(`Express is listening at http://localhost:${port}`);
        });
    });
}
//# sourceMappingURL=app.js.map