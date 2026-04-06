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
const classifyIntentHeuristically = (message) => {
    const text = message.trim().toLowerCase();
    const investorSignals = [
        "financial side",
        "investment side",
        "financing opportunity",
        "financing opportunities",
        "back this project",
        "back the project",
        "back films",
        "back film projects",
        "return on investment",
        "roi",
    ];
    const producerSignals = [
        "i produce",
        "we produce",
        "producing side",
        "production side",
        "executive produce",
        "exec produce",
        "line produce",
        "put together projects",
    ];
    const creativeSignals = [
        "work in film",
        "work in movies",
        "creative side",
        "join the project creatively",
        "join the team creatively",
        "come on board creatively",
        "story resonated",
        "connected with the material",
    ];
    if (investorSignals.some((signal) => text.includes(signal))) {
        return "INVESTOR";
    }
    if (producerSignals.some((signal) => text.includes(signal))) {
        return "PRODUCER";
    }
    if (creativeSignals.some((signal) => text.includes(signal))) {
        return "CREATIVE";
    }
    return FALLBACK_CATEGORY;
};
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
        return classifyIntentHeuristically(message);
    }
    const response = yield geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: [
                            "Classify this message into exactly one user-intent category for the A DREAM conversation router.",
                            "This classifier is only used when keyword routing does not find a match.",
                            "Valid outputs: INVESTOR, PRODUCER, CREATIVE, GENERAL.",
                            "INVESTOR = investment, financing, capital, funders, backers.",
                            "PRODUCER = producing, film producer, financing/production standpoint.",
                            "CREATIVE = directors, filmmakers, actors, cinematographers, editors, composers, collaborators, development, packaging, attach talent.",
                            "GENERAL = fan interest, curiosity about the story, Instagram discovery, non-professional interest.",
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
    return classifyIntentHeuristically(message);
});
exports.classifyIntentWithGemini = classifyIntentWithGemini;
//# sourceMappingURL=gemini.js.map