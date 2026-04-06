export const ASSISTANT_DEFAULT_MESSAGE =
  "Hi I am AI-GENT 001, Ohitiin's personal assistant. How may I help you?";

export const MIN_REPLY_DELAY_MS = 45 * 1000;
export const MAX_REPLY_DELAY_MS = 15 * 60 * 1000;

export const INVESTOR_KEYWORDS = [
  "invest",
  "investor",
  "investment",
  "fund",
  "funding",
  "finance",
  "financing",
  "capital",
  "equity",
  "raise",
  "slate",
  "gap",
  "presales",
  "distribution",
  "backer",
  "budget",
];

export const PRODUCER_KEYWORDS = [
  "producer",
  "producing",
  "film producer",
];

export const CREATIVE_KEYWORDS = [
  "director",
  "actor",
  "actress",
  "filmmaker",
  "cinematographer",
  "dp",
  "editor",
  "composer",
  "collaborate",
  "collaboration",
  "creative producer",
  "attach talent",
  "development",
  "packaging",
  "production designer",
];

export const CREATIVE_SUBTYPE_TAGS: Record<string, string> = {
  actor: "CREATIVE_ACTOR",
  actress: "CREATIVE_ACTRESS",
  director: "CREATIVE_DIRECTOR",
  filmmaker: "CREATIVE_FILMMAKER",
  "creative producer": "CREATIVE_PRODUCER",
  editor: "CREATIVE_EDITOR",
  composer: "CREATIVE_COMPOSER",
  cinematographer: "CREATIVE_CINEMATOGRAPHER",
  dp: "CREATIVE_DP",
  "production designer": "CREATIVE_PRODUCTION_DESIGNER",
  development: "CREATIVE_DEVELOPMENT",
  collaborate: "CREATIVE_COLLABORATION",
  collaboration: "CREATIVE_COLLABORATION",
};

export const PROFESSIONAL_REPLY_LIMIT = 4;
export const GENERAL_REPLY_LIMIT = 5;

export const FLOW_MESSAGES = {
  INVESTOR: [
    "Thank you for reaching out — we truly appreciate your interest in A DREAM. May I ask what initially caught your attention about the project?",
    "Thank you for sharing that. Out of curiosity, have you previously been involved with film investments or projects in development?",
    "That’s really interesting to hear. When you look at a new project, what usually draws your interest first — the story itself, the creative team involved, or the overall potential of the project?",
    "I’ve really appreciated hearing your perspective on this. If you're open to continuing the conversation, feel free to share your preferred way of communication — email or phone — and someone from our team will follow up with you directly.",
  ],
  PRODUCER: [
    "Thank you for reaching out — we really appreciate your interest in A DREAM. May I ask if you're approaching this more from a creative standpoint or from a financing / production standpoint?",
    "Thank you for clarifying. May I ask what types of projects you typically help finance?",
    "That’s really helpful to hear. When you look at a new project, what usually draws your interest first — the story itself, the creative team attached, or the overall production approach? And are you usually involved during the development stage, or later when projects move into production and financing?",
    "I’ve really appreciated hearing your perspective on this. If you're open to continuing the conversation, feel free to share your preferred way of communication — email or phone — and someone from our team will follow up with you directly.",
  ],
  CREATIVE: [
    "Thank you for reaching out — we really appreciate your interest in A DREAM. May I ask what aspect of the story resonated with you?",
    "It’s always interesting to hear how people connect with the material. Out of curiosity, what type of creative work do you usually focus on?",
    "That’s great to hear. What kinds of stories or characters tend to draw you in the most when you’re developing or collaborating on a project?",
    "I’ve really appreciated hearing your perspective on this. If you're open to continuing the conversation, feel free to share your preferred way of communication — email or phone — and someone from our team will follow up with you directly.",
  ],
  GENERAL: [
    "Thank you for reaching out — it really means a lot to see people interested in A DREAM. What initially caught your attention about the project?",
    "I appreciate you sharing that. Stories inspired by real events tend to resonate in very different ways with people. What kinds of emotionally driven films or true stories tend to stay with you the most?",
    "That’s really interesting. Many people connect with stories that explore personal journeys and moments of change. Is there a particular film or story that has stayed with you over the years?",
    "Those are exactly the kinds of stories that tend to inspire meaningful conversations. Thank you again for taking the time to share your perspective.",
    "Out of curiosity, what kinds of characters or personal journeys usually resonate with you the most in films like these?",
  ],
} as const;

export const GENERAL_CONTINUATION_MESSAGES = [
  "I appreciate you sharing that. It’s always interesting to hear how different people connect with stories like A DREAM.",
  "That’s thoughtful to hear. Emotionally grounded stories tend to stay with people for very personal reasons.",
  "Thank you for sharing your perspective. What kinds of themes or character journeys usually stay with you the longest?",
] as const;

export const CONTACT_CAPTURE_MESSAGES = {
  BOTH: "Thank you for sharing your email and phone number. I’ve noted both, and someone will reach out soon.",
  EMAIL: "Thank you for sharing your email. I’ve noted it, and someone will reach out soon.",
  PHONE: "Thank you for sharing your phone number. I’ve noted it, and someone will reach out soon.",
  REMINDER:
    "Whenever you're ready, feel free to share your preferred email or phone number so someone can follow up.",
} as const;
