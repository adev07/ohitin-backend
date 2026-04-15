import { ASSISTANT_DEFAULT_MESSAGE } from "../config/assistant";
import InstagramConversation, {
  IInstagramConversation,
} from "../models/instagramConversation";
import { classifyIntentWithGemini, generateChatResponse } from "./gemini";
import {
  detectProducerBranch,
  detectSelfIdentification,
} from "./keywordRouter";
import { addUniqueTags, mapIntentToTags } from "./tagManager";
import { getFlowReply, getReplyLimitForFlow } from "./flowEngine";
import {
  buildAssistantMessage,
  buildUserMessage,
  shouldWaitForContact,
} from "./responseGenerator";
import {
  sendInstagramMessage,
  sendInstagramTypingIndicator,
} from "./instagramApi";
import metaSettingsService from "./metaSettings";

// ─── Types ──────────────────────────────────────────────────────────

interface WebhookPayload {
  object: string;
  entry?: WebhookEntry[];
}

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: MessagingEvent[];
}

interface MessagingEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
  postback?: {
    title?: string;
    payload?: string;
  };
  read?: any;
}

// ─── Contact regex (same as chatbot) ────────────────────────────────

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRegex =
  /(?:(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4})/;

const extractContactData = (message: string) => ({
  email: message.match(emailRegex)?.[0],
  phone: message.match(phoneRegex)?.[0],
});

// ─── Intent resolver (reused from chatbot) ──────────────────────────

const resolveIntent = async (message: string) => {
  const selfId = detectSelfIdentification(message);
  if (selfId) {
    return { category: selfId, source: "keyword" as const };
  }

  const aiCategory = await classifyIntentWithGemini(message);
  return {
    category: aiCategory,
    source:
      process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
        ? ("gemini" as const)
        : ("fallback" as const),
  };
};

// ─── Conversation lookup / creation ─────────────────────────────────

const getOrCreateConversation = async (
  instagramUserId: string,
  instagramPageId: string
): Promise<IInstagramConversation> => {
  let conversation = await InstagramConversation.findOne({
    instagramUserId,
    instagramPageId,
  });

  if (!conversation) {
    conversation = await InstagramConversation.create({
      instagramUserId,
      instagramPageId,
      currentFlow: null,
      messageStep: 0,
      tags: [],
      capturedData: {},
      messages: [
        {
          sender: "assistant",
          text: ASSISTANT_DEFAULT_MESSAGE,
          step: 0,
          delayMs: 0,
          createdAt: new Date(),
        },
      ],
      profileType: null,
      classificationSource: "fallback",
      status: "ACTIVE",
    });
  }

  return conversation;
};

// ─── Core: process a single messaging event ─────────────────────────

const processMessagingEvent = async (event: MessagingEvent) => {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const isEcho = event.message?.is_echo === true;

  // Handle postback (button tap) as text
  const messageText = event.message?.text ?? event.postback?.payload;

  // Skip read receipts, echos, empty messages
  if (event.read || isEcho || !senderId || !recipientId || !messageText) return;

  const accessToken = await metaSettingsService.getAccessToken();
  if (!accessToken) {
    console.error("Instagram access token is not configured");
    return;
  }

  try {
    await processIncomingMessage(senderId, recipientId, messageText, accessToken);
  } catch (error) {
    console.error("Error processing Instagram message:", error);
  }
};

// ─── Gate checks + AI response ──────────────────────────────────────

const processIncomingMessage = async (
  senderId: string,
  pageId: string,
  messageText: string,
  accessToken: string
) => {
  const conversation = await getOrCreateConversation(senderId, pageId);

  // Send typing indicator while we process
  await sendInstagramTypingIndicator(accessToken, senderId).catch(() => {});

  // Process the message through the AI pipeline (same logic as chatbot)
  await processAIResponse(senderId, messageText, conversation, accessToken);
};

// ─── AI pipeline (mirrors chatbot conversation.sendMessage) ─────────

const processAIResponse = async (
  senderId: string,
  messageText: string,
  conversation: IInstagramConversation,
  accessToken: string
) => {
  const trimmedMessage = messageText.trim();
  if (!trimmedMessage) return;

  // Record user message
  conversation.messages.push(buildUserMessage(trimmedMessage));

  if (!conversation.tags.includes("NEW")) {
    conversation.tags = addUniqueTags(conversation.tags, ["NEW"]);
  }

  const contactData = extractContactData(trimmedMessage);

  // ── Completed conversation ──
  if (conversation.status === "COMPLETED") {
    if (conversation.currentFlow && conversation.currentFlow !== "GENERAL") {
      if (contactData.email) {
        conversation.capturedData.email = contactData.email;
        conversation.tags = addUniqueTags(conversation.tags, ["EMAIL_RECEIVED"]);
      }
      if (contactData.phone) {
        conversation.capturedData.phone = contactData.phone;
        conversation.tags = addUniqueTags(conversation.tags, ["PHONE_RECEIVED"]);
      }
    }
    await conversation.save();
    return;
  }

  // ── Waiting for contact info ──
  if (
    conversation.status === "WAITING_FOR_CONTACT" &&
    conversation.currentFlow &&
    conversation.currentFlow !== "GENERAL"
  ) {
    if (contactData.email || contactData.phone) {
      if (contactData.email) {
        conversation.capturedData.email = contactData.email;
        conversation.tags = addUniqueTags(conversation.tags, ["EMAIL_RECEIVED"]);
      }
      if (contactData.phone) {
        conversation.capturedData.phone = contactData.phone;
        conversation.tags = addUniqueTags(conversation.tags, ["PHONE_RECEIVED"]);
      }

      const acknowledgement = contactData.email && contactData.phone
        ? "Got it — I've noted your email and phone number. Someone from our team will reach out to you soon."
        : contactData.email
          ? "Got it — I've noted your email. Someone from our team will reach out to you soon."
          : "Got it — I've noted your phone number. Someone from our team will reach out to you soon.";

      const assistantMsg = buildAssistantMessage(
        conversation.currentFlow,
        acknowledgement,
        conversation.messageStep + 1
      );
      conversation.messages.push(assistantMsg);
      conversation.messageStep += 1;
      conversation.status = "COMPLETED";

      await conversation.save();
      await sendInstagramMessage(accessToken, senderId, acknowledgement);
    } else {
      await conversation.save();
    }
    return;
  }

  // ── Intent classification (first message or flow upgrade) ──
  if (!conversation.currentFlow) {
    const intent = await resolveIntent(trimmedMessage);
    conversation.currentFlow = intent.category;
    conversation.classificationSource = intent.source;
    conversation.profileType =
      intent.category === "GENERAL" ? "fan" : "professional";
    conversation.tags = addUniqueTags(conversation.tags, [
      ...mapIntentToTags(intent.category, trimmedMessage),
      "ENGAGED",
    ]);
  } else {
    const keywordMatch = detectSelfIdentification(trimmedMessage);
    if (keywordMatch && keywordMatch !== conversation.currentFlow) {
      conversation.currentFlow = keywordMatch;
      conversation.classificationSource = "keyword";
      conversation.profileType = "professional";
      conversation.messageStep = 0;
      conversation.tags = addUniqueTags(conversation.tags, [
        ...mapIntentToTags(keywordMatch, trimmedMessage),
      ]);
    } else if (
      conversation.currentFlow === "PRODUCER" &&
      conversation.messageStep === 1
    ) {
      const branch = detectProducerBranch(trimmedMessage);
      if (branch === "creative") {
        conversation.tags = addUniqueTags(conversation.tags, [
          "CREATIVE",
          "PRODUCER_CREATIVE",
        ]);
      }
      if (branch === "financing") {
        conversation.tags = addUniqueTags(conversation.tags, [
          "PRODUCER_FINANCING",
        ]);
      }
    }
  }

  // ── Capture contact data for professional flows ──
  if (conversation.currentFlow !== "GENERAL") {
    if (contactData.email) {
      conversation.capturedData.email = contactData.email;
      conversation.tags = addUniqueTags(conversation.tags, ["EMAIL_RECEIVED"]);
    }
    if (contactData.phone) {
      conversation.capturedData.phone = contactData.phone;
      conversation.tags = addUniqueTags(conversation.tags, ["PHONE_RECEIVED"]);
    }
  }

  // Safety: currentFlow must be set by now
  if (!conversation.currentFlow) {
    await conversation.save();
    return;
  }

  // ── Check reply limit ──
  const replyLimit = getReplyLimitForFlow(conversation.currentFlow);
  if (
    conversation.currentFlow !== "GENERAL" &&
    conversation.messageStep >= replyLimit
  ) {
    conversation.status = "COMPLETED";
    await conversation.save();
    return;
  }

  // ── Generate reply ──
  const nextStep = conversation.messageStep + 1;
  let producerBranch: "financing" | "creative" | null = null;

  if (conversation.currentFlow === "PRODUCER" && nextStep > 1) {
    producerBranch = detectProducerBranch(trimmedMessage);
    if (
      !conversation.tags.includes("PRODUCER_FINANCING") &&
      !conversation.tags.includes("PRODUCER_CREATIVE")
    ) {
      producerBranch = producerBranch ?? "financing";
    } else if (conversation.tags.includes("PRODUCER_CREATIVE")) {
      producerBranch = "creative";
    } else {
      producerBranch = "financing";
    }
  }

  let replyText: string;

  if (conversation.currentFlow === "GENERAL") {
    const aiResponse = await generateChatResponse(conversation.messages);
    if (aiResponse) {
      replyText = aiResponse;
    } else {
      replyText =
        "Sorry, I'm having a bit of trouble right now. Could you try asking that again?";
    }
  } else {
    replyText = getFlowReply(
      conversation.currentFlow,
      nextStep,
      producerBranch
    );
  }

  const assistantMessage = buildAssistantMessage(
    conversation.currentFlow,
    replyText,
    nextStep
  );

  conversation.messageStep = nextStep;
  conversation.messages.push(assistantMessage);

  if (shouldWaitForContact(conversation.currentFlow, nextStep)) {
    conversation.status = "WAITING_FOR_CONTACT";
  }

  await conversation.save();

  // ── Send reply via Instagram Graph API ──
  await sendInstagramMessage(accessToken, senderId, replyText);
};

// ─── Webhook handler entry points ───────────────────────────────────

/**
 * Handle the incoming webhook POST body from Instagram.
 * Called after immediately responding 200 to Meta.
 */
export const handleInstagramWebhook = async (payload: WebhookPayload) => {
  const entries = payload.entry ?? [];

  for (const entry of entries) {
    if (Array.isArray(entry.messaging) && entry.messaging.length) {
      await Promise.all(
        entry.messaging.map((event) => processMessagingEvent(event))
      );
    }
  }
};

/**
 * Verify the webhook subscription (GET request from Meta).
 */
export const verifyInstagramWebhook = async (query: {
  "hub.mode"?: string;
  "hub.verify_token"?: string;
  "hub.challenge"?: string;
}) => {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  const verifyToken = await metaSettingsService.getVerifyToken();

  if (mode === "subscribe" && token === verifyToken) {
    return { success: true, challenge };
  }

  return { success: false };
};
