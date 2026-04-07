import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { IntentCategory, MessageRecord } from "../types";
import { FILM_CHATBOT_SYSTEM_PROMPT } from "../config/systemPrompt";

const FALLBACK_CATEGORY: IntentCategory = "GENERAL";
const VALID_CATEGORIES: IntentCategory[] = [
  "INVESTOR",
  "PRODUCER",
  "CREATIVE",
  "GENERAL",
];

let geminiClient: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;

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

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return geminiClient;
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
};

// ─── Intent Classification ───────────────────────────────────────────

export const classifyIntentWithGemini = async (
  message: string
): Promise<IntentCategory> => {
  const classificationPrompt = [
    "You are a user-intent classifier for a film website chatbot about the film 'A DREAM'.",
    "",
    "Classify this message into exactly ONE category. Return only one word.",
    "",
    "Categories:",
    "INVESTOR = The user identifies as or expresses intent to be an investor, funder, or backer.",
    "PRODUCER = The user identifies as a film producer or expresses intent to produce.",
    "CREATIVE = The user identifies as a creative professional (director, actor, cinematographer, editor, composer) or wants to collaborate creatively.",
    "GENERAL = Everything else — fans, casual viewers, people asking questions about the film, compliments, curiosity.",
    "",
    "CRITICAL RULES:",
    "- Asking ABOUT a role is GENERAL: 'Who is the director?' = GENERAL, 'Tell me about the composer' = GENERAL",
    "- Only classify as professional if the user IS that role or WANTS to be involved professionally.",
    "- Compliments about aspects of the film are GENERAL: 'The editing is amazing' = GENERAL",
    "- Questions about budget, funding, distribution are GENERAL unless the user explicitly offers to invest/produce.",
    "- When in doubt, choose GENERAL.",
    "",
    "Examples:",
    "'What is this film about?' → GENERAL",
    "'Who directed this?' → GENERAL",
    "'I love the cinematography' → GENERAL", 
    "'Is there a trailer?' → GENERAL",
    "'What is the budget?' → GENERAL",
    "'I am a producer' → PRODUCER",
    "'I want to invest' → INVESTOR",
    "'I'm a director and would love to collaborate' → CREATIVE",
    "'Looking to fund this project' → INVESTOR",
    "",
    "Return only one word: INVESTOR, PRODUCER, CREATIVE, or GENERAL.",
    "",
    `Message: "${message}"`,
  ].join("\n");

  // Try Gemini first
  const gClient = getGeminiClient();
  if (gClient) {
    try {
      const response = await gClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: classificationPrompt }],
          },
        ],
      });

      const value = response.text?.trim().toUpperCase() as IntentCategory | undefined;
      if (value && VALID_CATEGORIES.includes(value)) {
        console.log(`✅ Classification: Gemini (gemini-2.0-flash) → ${value}`);
        return value;
      }
    } catch (error: any) {
      console.warn("Gemini classification failed:", error?.message || error);
    }
  }

  // Fallback to OpenAI
  const oClient = getOpenAIClient();
  if (oClient) {
    try {
      const response = await oClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: classificationPrompt },
        ],
        max_tokens: 10,
        temperature: 0,
      });

      const value = response.choices[0]?.message?.content
        ?.trim()
        .toUpperCase() as IntentCategory | undefined;
      if (value && VALID_CATEGORIES.includes(value)) {
        console.log(`✅ Classification: OpenAI (gpt-4o-mini) → ${value}`);
        return value;
      }
    } catch (error: any) {
      console.warn("OpenAI classification failed:", error?.message || error);
    }
  }

  const heuristicResult = classifyIntentHeuristically(message);
  console.log(`✅ Classification: Heuristic fallback → ${heuristicResult}`);
  return heuristicResult;
};

// ─── Chat Response Generation ────────────────────────────────────────

const GEMINI_CHAT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateWithGemini = async (
  historyContents: { role: "model" | "user"; parts: { text: string }[] }[]
): Promise<string | null> => {
  const gClient = getGeminiClient();
  if (!gClient) return null;

  for (const model of GEMINI_CHAT_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await gClient.models.generateContent({
          model,
          config: {
            systemInstruction: FILM_CHATBOT_SYSTEM_PROMPT,
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 1024,
          },
          contents: historyContents,
        });

        const text = response.text?.trim();
        if (text) {
          console.log(`✅ Chat response: Gemini (${model})`);
          return text;
        }
      } catch (error: any) {
        const is503 = error?.status === 503 || error?.message?.includes("503");
        console.warn(
          `Gemini [${model}] attempt ${attempt}/${MAX_RETRIES} failed${is503 ? " (503)" : ""}:`,
          error?.message || error
        );

        if (is503 && attempt < MAX_RETRIES) {
          await sleep(1000 * Math.pow(2, attempt - 1));
          continue;
        }
        break;
      }
    }
  }

  return null;
};

const generateWithOpenAI = async (
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string | null> => {
  const oClient = getOpenAIClient();
  if (!oClient) return null;

  try {
    const response = await oClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1024,
      temperature: 0.8,
      top_p: 0.9,
    });

    const text = response.choices[0]?.message?.content?.trim() || null;
    if (text) console.log(`✅ Chat response: OpenAI (gpt-4o-mini)`);
    return text;
  } catch (error: any) {
    console.warn("OpenAI chat generation failed:", error?.message || error);
    return null;
  }
};

/**
 * Generate a conversational AI response for the GENERAL flow.
 * Tries Gemini (with retry + model fallback), then OpenAI.
 */
export const generateChatResponse = async (
  conversationHistory: MessageRecord[]
): Promise<string | null> => {
  // Try Gemini first
  const geminiHistory = conversationHistory.map((msg) => ({
    role: msg.sender === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.text }],
  }));

  const geminiResult = await generateWithGemini(geminiHistory);
  if (geminiResult) return geminiResult;

  // Fallback to OpenAI
  const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: FILM_CHATBOT_SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.sender === "assistant" ? ("assistant" as const) : ("user" as const),
      content: msg.text,
    })),
  ];

  const openaiResult = await generateWithOpenAI(openaiMessages);
  if (openaiResult) return openaiResult;

  console.error("All AI providers exhausted for chat response generation.");
  return null;
};
