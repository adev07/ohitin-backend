import { GoogleGenAI } from "@google/genai";
import { IntentCategory } from "../types";

const FALLBACK_CATEGORY: IntentCategory = "GENERAL";
const VALID_CATEGORIES: IntentCategory[] = [
  "INVESTOR",
  "PRODUCER",
  "CREATIVE",
  "GENERAL",
];

let client: GoogleGenAI | null = null;

const classifyIntentHeuristically = (message: string): IntentCategory => {
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
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return client;
};

export const classifyIntentWithGemini = async (
  message: string
): Promise<IntentCategory> => {
  const geminiClient = getClient();
  if (!geminiClient) {
    return classifyIntentHeuristically(message);
  }

  const response = await geminiClient.models.generateContent({
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

  const value = response.text?.trim().toUpperCase() as IntentCategory | undefined;
  if (value && VALID_CATEGORIES.includes(value)) {
    return value;
  }

  return classifyIntentHeuristically(message);
};
