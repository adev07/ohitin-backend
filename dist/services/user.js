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
const createUser = (body) => __awaiter(void 0, void 0, void 0, function* () {
    if (!body) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Please provide all the required fields");
    }
    const { name, email, password } = body;
    const existingUser = yield models_1.default.user.findOne({ email });
    if (existingUser) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Email already exists");
    }
    return models_1.default.user.create({ name, email, password });
});
const loginUser = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = body;
    const user = yield models_1.default.user.findOne({ email });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const isMatch = yield user.validatePassword(password);
    if (!isMatch) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid credentials");
    }
    return user;
});
const forgotPassword = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = body;
    const user = yield models_1.default.user.findOne({ email });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const generatedOtp = Math.floor(100000 + Math.random() * 900000);
    const existingOtp = yield models_1.default.otp.findOne({ email });
    if (existingOtp) {
        existingOtp.otp = generatedOtp;
        yield existingOtp.save();
        return existingOtp;
    }
    return models_1.default.otp.create({ email, otp: generatedOtp });
});
const verifyOtp = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = body;
    const user = yield models_1.default.user.findOne({ email });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const otpRecord = yield models_1.default.otp.findOne({ email, otp });
    if (!otpRecord) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP");
    }
    return otpRecord;
});
const resetPassword = (body) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, password } = body;
    const user = yield models_1.default.user.findOne({ email });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const otpRecord = yield models_1.default.otp.findOne({ email, otp });
    if (!otpRecord) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP");
    }
    user.password = password;
    yield user.save();
    yield models_1.default.otp.deleteOne({ _id: otpRecord._id });
    return user;
});
exports.default = {
    createUser,
    loginUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
};
//# sourceMappingURL=user.js.map