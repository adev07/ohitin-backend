"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldCompleteAfterReply = exports.shouldWaitForContact = exports.buildUserMessage = exports.buildAssistantMessage = void 0;
const assistant_1 = require("../config/assistant");
const getRandomDelayMs = () => Math.floor(Math.random() * (assistant_1.MAX_REPLY_DELAY_MS - assistant_1.MIN_REPLY_DELAY_MS + 1)) +
    assistant_1.MIN_REPLY_DELAY_MS;
const buildAssistantMessage = (flow, text, step) => {
    const message = {
        sender: "assistant",
        text,
        step,
        delayMs: getRandomDelayMs(),
        createdAt: new Date(),
    };
    if (flow === "PRODUCER" && step === 1) {
        message.quickReplies = ["Creative", "Financing"];
    }
    return message;
};
exports.buildAssistantMessage = buildAssistantMessage;
const buildUserMessage = (text) => ({
    sender: "user",
    text,
    createdAt: new Date(),
});
exports.buildUserMessage = buildUserMessage;
const shouldWaitForContact = (flow, step) => false;
exports.shouldWaitForContact = shouldWaitForContact;
const shouldCompleteAfterReply = (flow, step) => (flow !== "GENERAL" && step === assistant_1.PROFESSIONAL_REPLY_LIMIT) ||
    (flow === "GENERAL" && step === assistant_1.GENERAL_REPLY_LIMIT);
exports.shouldCompleteAfterReply = shouldCompleteAfterReply;
//# sourceMappingURL=responseGenerator.js.map