"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
    sender: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    step: { type: Number },
    delayMs: { type: Number },
    quickReplies: { type: [String], default: undefined },
}, { _id: false });
const conversationSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    currentFlow: {
        type: String,
        enum: ["INVESTOR", "PRODUCER", "CREATIVE", "GENERAL", null],
        default: null,
    },
    messageStep: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    capturedData: {
        email: { type: String, default: undefined },
        phone: { type: String, default: undefined },
    },
    messages: { type: [messageSchema], default: [] },
    profileType: {
        type: String,
        enum: ["professional", "fan", null],
        default: null,
    },
    classificationSource: {
        type: String,
        enum: ["keyword", "gemini", "fallback"],
        default: "fallback",
    },
    status: {
        type: String,
        enum: ["ACTIVE", "WAITING_FOR_CONTACT", "COMPLETED"],
        default: "ACTIVE",
    },
}, {
    timestamps: true,
});
conversationSchema.index({ profileType: 1 });
conversationSchema.index({ classificationSource: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ tags: 1 });
exports.default = mongoose_1.default.model("Conversation", conversationSchema);
//# sourceMappingURL=conversation.js.map