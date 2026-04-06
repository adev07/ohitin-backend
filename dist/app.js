"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const cors_1 = __importDefault(require("cors"));
const assistant_1 = require("./config/assistant");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
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
exports.default = app;
// Local development server — only runs when executed directly
if (require.main === module) {
    const { connectDB } = require("./config/db");
    const port = Number(process.env.PORT) || 4000;
    connectDB().then(() => {
        app.listen(port, () => {
            console.log(`Express is listening at http://localhost:${port}`);
        });
    });
}
//# sourceMappingURL=app.js.map