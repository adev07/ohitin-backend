"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTACT_CAPTURE_MESSAGES = exports.FLOW_MESSAGES = exports.GENERAL_REPLY_LIMIT = exports.PROFESSIONAL_REPLY_LIMIT = exports.CREATIVE_SUBTYPE_TAGS = exports.CREATIVE_KEYWORDS = exports.PRODUCER_KEYWORDS = exports.INVESTOR_KEYWORDS = exports.MAX_REPLY_DELAY_MS = exports.MIN_REPLY_DELAY_MS = exports.ASSISTANT_DEFAULT_MESSAGE = void 0;
exports.ASSISTANT_DEFAULT_MESSAGE = "Hi I am AI-GENT 001, Ohitiin's personal assistant. How may I help you?";
exports.MIN_REPLY_DELAY_MS = 45 * 1000;
exports.MAX_REPLY_DELAY_MS = 15 * 60 * 1000;
exports.INVESTOR_KEYWORDS = [
    "invest",
    "investment",
    "funding",
    "finance",
    "capital",
    "equity",
    "presales",
    "distribution",
    "budget",
];
exports.PRODUCER_KEYWORDS = [
    "producer",
    "producing",
    "film producer",
];
exports.CREATIVE_KEYWORDS = [
    "director",
    "actor",
    "actress",
    "filmmaker",
    "cinematographer",
    "editor",
    "composer",
    "collaborate",
];
exports.CREATIVE_SUBTYPE_TAGS = {
    actor: "CREATIVE_ACTOR",
    actress: "CREATIVE_ACTOR",
    director: "CREATIVE_DIRECTOR",
    filmmaker: "CREATIVE_FILMMAKER",
    producer: "CREATIVE_PRODUCER",
    editor: "CREATIVE_EDITOR",
    composer: "CREATIVE_COMPOSER",
    cinematographer: "CREATIVE_DP",
    dp: "CREATIVE_DP",
};
exports.PROFESSIONAL_REPLY_LIMIT = 4;
exports.GENERAL_REPLY_LIMIT = 5;
exports.FLOW_MESSAGES = {
    INVESTOR: [
        "Thank you for reaching out — we truly appreciate your interest. What initially caught your attention about the project?",
        "Thank you for sharing that. Have you previously been involved with film investments or projects in development?",
        "When you look at a new project, what usually draws your interest first — the story, the team, or the overall potential?",
        "I’ve really appreciated hearing your perspective. If you're open to continuing, feel free to share your preferred contact — email or phone — and someone will follow up.",
    ],
    PRODUCER: [
        "Thank you for reaching out — really appreciate your interest. Are you approaching this from a creative side or financing/production side?",
        "What types of projects do you typically help finance?",
        "What usually draws your interest — story, team, or production approach?",
        "I’ve really appreciated hearing your perspective. If you're open to continuing, feel free to share your preferred contact — email or phone — and someone will follow up.",
    ],
    CREATIVE: [
        "Thank you for reaching out — really appreciate your interest. What aspect of the story resonated with you?",
        "What type of creative work do you usually focus on?",
        "What kinds of stories or characters draw you in the most?",
        "I’ve really appreciated hearing your perspective. If you're open to continuing, feel free to share your preferred contact — email or phone — and someone will follow up.",
    ],
    GENERAL: [
        "Thank you for reaching out — it means a lot to see interest like this. What caught your attention?",
        "What kinds of emotionally driven stories stay with you the most?",
        "Is there a film or story that has stayed with you over time?",
        "Those are the kinds of stories that inspire meaningful conversations. Thank you for sharing.",
        "What kinds of characters resonate with you the most?",
    ],
};
exports.CONTACT_CAPTURE_MESSAGES = {
    BOTH: "Thank you for sharing your email and phone number. I’ve noted both, and someone will reach out soon.",
    EMAIL: "Thank you for sharing your email. I’ve noted it, and someone will reach out soon.",
    PHONE: "Thank you for sharing your phone number. I’ve noted it, and someone will reach out soon.",
    REMINDER: "Whenever you're ready, feel free to share your preferred email or phone number so someone can follow up.",
};
//# sourceMappingURL=assistant.js.map