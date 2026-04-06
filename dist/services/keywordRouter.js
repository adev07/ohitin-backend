"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProducerBranch = exports.routeMessageByKeyword = exports.getCreativeSubtypeTags = void 0;
const assistant_1 = require("../config/assistant");
const normalizeText = (value) => value.trim().toLowerCase();
const includesAnyKeyword = (message, keywords) => {
    const text = normalizeText(message);
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};
const getCreativeSubtypeTags = (message) => {
    const tags = [];
    const lowered = normalizeText(message);
    Object.entries(assistant_1.CREATIVE_SUBTYPE_TAGS).forEach(([keyword, tag]) => {
        if (lowered.includes(keyword)) {
            tags.push(tag);
        }
    });
    return tags;
};
exports.getCreativeSubtypeTags = getCreativeSubtypeTags;
const routeMessageByKeyword = (message) => {
    if (includesAnyKeyword(message, assistant_1.CREATIVE_KEYWORDS)) {
        return "CREATIVE";
    }
    if (includesAnyKeyword(message, assistant_1.PRODUCER_KEYWORDS)) {
        return "PRODUCER";
    }
    if (includesAnyKeyword(message, assistant_1.INVESTOR_KEYWORDS)) {
        return "INVESTOR";
    }
    return null;
};
exports.routeMessageByKeyword = routeMessageByKeyword;
const detectProducerBranch = (message) => {
    const text = normalizeText(message);
    if (text.includes("creative") ||
        text.includes("director") ||
        text.includes("actor") ||
        text.includes("actress") ||
        text.includes("filmmaker") ||
        text.includes("cinematographer") ||
        text.includes("dp") ||
        text.includes("composer") ||
        text.includes("editor") ||
        text.includes("production designer") ||
        text.includes("development") ||
        text.includes("packaging") ||
        text.includes("collaborate") ||
        text.includes("collaboration") ||
        text.includes("attach talent") ||
        text.includes("creative producer")) {
        return "creative";
    }
    if (text.includes("finance") ||
        text.includes("financing") ||
        text.includes("production") ||
        text.includes("producer") ||
        text.includes("budget") ||
        text.includes("fund")) {
        return "financing";
    }
    return null;
};
exports.detectProducerBranch = detectProducerBranch;
//# sourceMappingURL=keywordRouter.js.map