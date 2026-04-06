import {
  CREATIVE_KEYWORDS,
  CREATIVE_SUBTYPE_TAGS,
  INVESTOR_KEYWORDS,
  PRODUCER_KEYWORDS,
} from "../config/assistant";
import { ConversationTag, IntentCategory } from "../types";

const normalizeText = (value: string) => value.trim().toLowerCase();

const includesAnyKeyword = (message: string, keywords: string[]) => {
  const text = normalizeText(message);
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};

export const getCreativeSubtypeTags = (message: string): ConversationTag[] => {
  const tags: ConversationTag[] = [];
  const lowered = normalizeText(message);

  Object.entries(CREATIVE_SUBTYPE_TAGS).forEach(([keyword, tag]) => {
    if (lowered.includes(keyword)) {
      tags.push(tag as ConversationTag);
    }
  });

  return tags;
};

export const routeMessageByKeyword = (message: string): IntentCategory | null => {
  if (includesAnyKeyword(message, INVESTOR_KEYWORDS)) {
    return "INVESTOR";
  }

  if (includesAnyKeyword(message, PRODUCER_KEYWORDS)) {
    return "PRODUCER";
  }

  if (includesAnyKeyword(message, CREATIVE_KEYWORDS)) {
    return "CREATIVE";
  }

  return null;
};

export const detectProducerBranch = (
  message: string
): "creative" | "financing" | null => {
  const text = normalizeText(message);

  if (
    text.includes("creative") ||
    text.includes("director") ||
    text.includes("actor") ||
    text.includes("filmmaker")
  ) {
    return "creative";
  }

  if (
    text.includes("finance") ||
    text.includes("financing") ||
    text.includes("production") ||
    text.includes("producer")
  ) {
    return "financing";
  }

  return null;
};
