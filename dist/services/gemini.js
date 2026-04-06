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
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyIntentWithGemini = void 0;
const genai_1 = require("@google/genai");
const FALLBACK_CATEGORY = "GENERAL";
const VALID_CATEGORIES = [
    "INVESTOR",
    "PRODUCER",
    "CREATIVE",
    "GENERAL",
];
let client = null;
const getClient = () => {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }
    if (!client) {
        client = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return client;
};
const classifyIntentWithGemini = (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const geminiClient = getClient();
    if (!geminiClient) {
        return FALLBACK_CATEGORY;
    }
    const response = yield geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: [
                            "Classify this message into exactly one category.",
                            "Valid outputs: INVESTOR, PRODUCER, CREATIVE, GENERAL.",
                            "Return only one word.",
                            `Message: ${message}`,
                        ].join("\n"),
                    },
                ],
            },
        ],
    });
    const value = (_a = response.text) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase();
    if (value && VALID_CATEGORIES.includes(value)) {
        return value;
    }
    return FALLBACK_CATEGORY;
});
exports.classifyIntentWithGemini = classifyIntentWithGemini;
//# sourceMappingURL=gemini.js.map