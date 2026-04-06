"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapIntentToTags = exports.addUniqueTags = void 0;
const keywordRouter_1 = require("./keywordRouter");
const addUniqueTags = (currentTags, nextTags) => {
    const merged = new Set(currentTags);
    nextTags.forEach((tag) => merged.add(tag));
    return Array.from(merged);
};
exports.addUniqueTags = addUniqueTags;
const mapIntentToTags = (category, message) => {
    if (category === "INVESTOR") {
        return ["INVESTOR"];
    }
    if (category === "PRODUCER") {
        return ["PRODUCER"];
    }
    if (category === "CREATIVE") {
        return ["CREATIVE", ...(0, keywordRouter_1.getCreativeSubtypeTags)(message)];
    }
    return ["GENERAL_SUPPORT"];
};
exports.mapIntentToTags = mapIntentToTags;
//# sourceMappingURL=tagManager.js.map