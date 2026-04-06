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
    return FALLBACK_CATEGORY;
  }

  const response = await geminiClient.models.generateContent({
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

  const value = response.text?.trim().toUpperCase() as IntentCategory | undefined;
  if (value && VALID_CATEGORIES.includes(value)) {
    return value;
  }

  return FALLBACK_CATEGORY;
};
