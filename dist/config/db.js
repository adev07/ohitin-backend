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
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = __importDefault(require("../models"));
dotenv_1.default.config();
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/demo";
/**
 * Cached connection promise for serverless environments.
 * Prevents creating a new connection on every cold/warm invocation.
 */
let cachedConnection = null;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    // If already connected, skip
    if (mongoose_1.default.connection.readyState === 1) {
        return;
    }
    // If a connection is already in progress, wait for it
    if (cachedConnection) {
        yield cachedConnection;
        return;
    }
    try {
        cachedConnection = mongoose_1.default.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        yield cachedConnection;
        yield ensureDefaultAdmin();
        console.log("DB Connected Successfully....");
    }
    catch (err) {
        cachedConnection = null;
        console.log("DB Connection Failed!");
        console.error(err);
        // In serverless, don't call process.exit — throw so the request fails gracefully
        throw err;
    }
});
exports.connectDB = connectDB;
const ensureDefaultAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const existingAdmin = yield models_1.default.admin.findOne({ username: "admin" });
    if (existingAdmin) {
        return;
    }
    yield models_1.default.admin.create({
        username: process.env.ADMIN_USERNAME || "admin",
        password: process.env.ADMIN_PASSWORD || "admin",
    });
});
exports.default = exports.connectDB;
//# sourceMappingURL=db.js.map