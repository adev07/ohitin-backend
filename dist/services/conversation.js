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
const mongoose_1 = __importDefault(require("mongoose"));
const assistant_1 = require("../config/assistant");
const models_1 = __importDefault(require("../models"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const gemini_1 = require("./gemini");
const tagManager_1 = require("./tagManager");
const keywordRouter_1 = require("./keywordRouter");
const flowEngine_1 = require("./flowEngine");
const responseGenerator_1 = require("./responseGenerator");
const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRegex = /(?:(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4})/;
const resolveIntent = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const keywordMatch = (0, keywordRouter_1.routeMessageByKeyword)(message);
    if (keywordMatch) {
        return {
            category: keywordMatch,
            source: "keyword",
        };
    }
    const geminiCategory = yield (0, gemini_1.classifyIntentWithGemini)(message);
    return {
        category: geminiCategory,
        source: process.env.GEMINI_API_KEY ? "gemini" : "fallback",
    };
});
const extractContactData = (message) => {
    var _a, _b;
    return ({
        email: (_a = message.match(emailRegex)) === null || _a === void 0 ? void 0 : _a[0],
        phone: (_b = message.match(phoneRegex)) === null || _b === void 0 ? void 0 : _b[0],
    });
};
const generateAnonymousUserId = () => new mongoose_1.default.Types.ObjectId().toString();
const getContactAcknowledgement = (contactData) => {
    if (contactData.email && contactData.phone) {
        return assistant_1.CONTACT_CAPTURE_MESSAGES.BOTH;
    }
    if (contactData.email) {
        return assistant_1.CONTACT_CAPTURE_MESSAGES.EMAIL;
    }
    if (contactData.phone) {
        return assistant_1.CONTACT_CAPTURE_MESSAGES.PHONE;
    }
    return null;
};
const startConversation = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId }) {
    return {
        _id: null,
        userId: userId || null,
        currentFlow: null,
        messageStep: 0,
        tags: [],
        capturedData: {},
        messages: [
            {
                sender: "assistant",
                text: assistant_1.ASSISTANT_DEFAULT_MESSAGE,
                step: 0,
                delayMs: 0,
                createdAt: new Date(),
            },
        ],
        profileType: null,
        classificationSource: "fallback",
        status: "ACTIVE",
        createdAt: new Date(),
    };
});
const sendMessage = (_a) => __awaiter(void 0, [_a], void 0, function* ({ conversationId, userId, message }) {
    let conversation = conversationId
        ? yield models_1.default.conversation.findById(conversationId)
        : null;
    if (conversationId && !conversation) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Conversation not found");
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Message is required");
    }
    if (!conversation) {
        conversation = yield models_1.default.conversation.create({
            userId: userId || generateAnonymousUserId(),
            currentFlow: null,
            messageStep: 0,
            tags: [],
            capturedData: {},
            messages: [
                {
                    sender: "assistant",
                    text: assistant_1.ASSISTANT_DEFAULT_MESSAGE,
                    step: 0,
                    delayMs: 0,
                    createdAt: new Date(),
                },
            ],
            profileType: null,
            classificationSource: "fallback",
            status: "ACTIVE",
        });
    }
    conversation.messages.push((0, responseGenerator_1.buildUserMessage)(trimmedMessage));
    if (!conversation.tags.includes("NEW")) {
        conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["NEW"]);
    }
    const contactData = extractContactData(trimmedMessage);
    if (conversation.status === "COMPLETED") {
        if (conversation.currentFlow && conversation.currentFlow !== "GENERAL") {
            if (contactData.email) {
                conversation.capturedData.email = contactData.email;
                conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["EMAIL_RECEIVED"]);
            }
            if (contactData.phone) {
                conversation.capturedData.phone = contactData.phone;
                conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["PHONE_RECEIVED"]);
            }
        }
        yield conversation.save();
        return {
            conversation,
            assistantMessage: null,
            conversationClosed: true,
        };
    }
    if (conversation.status === "WAITING_FOR_CONTACT" &&
        conversation.currentFlow &&
        conversation.currentFlow !== "GENERAL") {
        let assistantMessage = null;
        if (contactData.email || contactData.phone) {
            if (contactData.email) {
                conversation.capturedData.email = contactData.email;
                conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["EMAIL_RECEIVED"]);
            }
            if (contactData.phone) {
                conversation.capturedData.phone = contactData.phone;
                conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["PHONE_RECEIVED"]);
            }
            const acknowledgement = getContactAcknowledgement(contactData);
            if (acknowledgement) {
                assistantMessage = (0, responseGenerator_1.buildAssistantMessage)(conversation.currentFlow, acknowledgement, conversation.messageStep + 1);
                conversation.messages.push(assistantMessage);
                conversation.messageStep += 1;
            }
            conversation.status = "COMPLETED";
        }
        yield conversation.save();
        return {
            conversation,
            assistantMessage,
            conversationClosed: conversation.status === "COMPLETED",
        };
    }
    if (!conversation.currentFlow) {
        const intent = yield resolveIntent(trimmedMessage);
        conversation.currentFlow = intent.category;
        conversation.classificationSource = intent.source;
        conversation.profileType =
            intent.category === "GENERAL" ? "fan" : "professional";
        conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, [
            ...(0, tagManager_1.mapIntentToTags)(intent.category, trimmedMessage),
            "ENGAGED",
        ]);
    }
    else if (conversation.currentFlow === "PRODUCER" && conversation.messageStep === 1) {
        const branch = (0, keywordRouter_1.detectProducerBranch)(trimmedMessage);
        if (branch === "creative") {
            conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, [
                "CREATIVE",
                "PRODUCER_CREATIVE",
            ]);
        }
        if (branch === "financing") {
            conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["PRODUCER_FINANCING"]);
        }
    }
    if (conversation.currentFlow !== "GENERAL") {
        if (contactData.email) {
            conversation.capturedData.email = contactData.email;
            conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["EMAIL_RECEIVED"]);
        }
        if (contactData.phone) {
            conversation.capturedData.phone = contactData.phone;
            conversation.tags = (0, tagManager_1.addUniqueTags)(conversation.tags, ["PHONE_RECEIVED"]);
        }
    }
    const replyLimit = (0, flowEngine_1.getReplyLimitForFlow)(conversation.currentFlow);
    if (conversation.currentFlow !== "GENERAL" && conversation.messageStep >= replyLimit) {
        conversation.status = "COMPLETED";
        yield conversation.save();
        return {
            conversation,
            assistantMessage: null,
            conversationClosed: conversation.status === "COMPLETED",
        };
    }
    const nextStep = conversation.messageStep + 1;
    let producerBranch = null;
    if (conversation.currentFlow === "PRODUCER" && nextStep > 1) {
        producerBranch = (0, keywordRouter_1.detectProducerBranch)(trimmedMessage);
        if (!conversation.tags.includes("PRODUCER_FINANCING") &&
            !conversation.tags.includes("PRODUCER_CREATIVE")) {
            producerBranch = producerBranch !== null && producerBranch !== void 0 ? producerBranch : "financing";
        }
        else if (conversation.tags.includes("PRODUCER_CREATIVE")) {
            producerBranch = "creative";
        }
        else {
            producerBranch = "financing";
        }
    }
    const replyText = (0, flowEngine_1.getFlowReply)(conversation.currentFlow, nextStep, producerBranch);
    const assistantMessage = (0, responseGenerator_1.buildAssistantMessage)(conversation.currentFlow, replyText, nextStep);
    conversation.messageStep = nextStep;
    conversation.messages.push(assistantMessage);
    if ((0, responseGenerator_1.shouldWaitForContact)(conversation.currentFlow, nextStep)) {
        conversation.status = "WAITING_FOR_CONTACT";
    }
    if ((0, responseGenerator_1.shouldCompleteAfterReply)(conversation.currentFlow, nextStep)) {
        conversation.status = "COMPLETED";
    }
    if (conversation.currentFlow !== "GENERAL" &&
        nextStep > assistant_1.PROFESSIONAL_REPLY_LIMIT) {
        conversation.status = "COMPLETED";
    }
    yield conversation.save();
    return {
        conversation,
        assistantMessage,
        conversationClosed: conversation.status === "COMPLETED",
    };
});
const getConversationById = (conversationId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversation = yield models_1.default.conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Conversation not found");
    }
    return conversation;
});
const conversationService = {
    startConversation,
    sendMessage,
    getConversationById,
};
exports.default = conversationService;
//# sourceMappingURL=conversation.js.map