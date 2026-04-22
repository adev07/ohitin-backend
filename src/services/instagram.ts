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


const log = (stage: string, data?: Record<string, unknown>) => {
  if (data !== undefined) {
    console.log(`[IG] ${stage}`, JSON.stringify(data));
  } else {
    console.log(`[IG] ${stage}`);
  }
};

const logErr = (stage: string, err: unknown, data?: Record<string, unknown>) => {
  const info = err instanceof Error ? { message: err.message, stack: err.stack } : { err };
  console.error(`[IG] ${stage}`, JSON.stringify({ ...info, ...(data ?? {}) }));
};

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
    log("conversation.create", { instagramUserId, instagramPageId });
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
  } else {
    log("conversation.loaded", {
      instagramUserId,
      instagramPageId,
      status: conversation.status,
      currentFlow: conversation.currentFlow,
      messageStep: conversation.messageStep,
      messageCount: conversation.messages.length,
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

  log("event.received", {
    senderId,
    recipientId,
    hasText: Boolean(event.message?.text),
    hasPostback: Boolean(event.postback),
    isEcho,
    isRead: Boolean(event.read),
    mid: event.message?.mid,
  });

  if (event.read || isEcho || !senderId || !recipientId || !messageText) {
    log("event.skipped", {
      reason: event.read
        ? "read-receipt"
        : isEcho
          ? "echo"
          : !senderId
            ? "no-sender"
            : !recipientId
              ? "no-recipient"
              : "empty-text",
    });
    return;
  }

  const accessToken = await metaSettingsService.getAccessToken();
  if (!accessToken) {
    logErr("event.no-access-token", new Error("Instagram access token is not configured"));
    return;
  }
  log("event.access-token-resolved", { tokenLen: accessToken.length });

  try {
    await processIncomingMessage(senderId, recipientId, messageText, accessToken);
  } catch (error) {
    logErr("event.process-failed", error, { senderId, recipientId });
  }
};

// ─── Gate checks + AI response ──────────────────────────────────────

const processIncomingMessage = async (
  senderId: string,
  pageId: string,
  messageText: string,
  accessToken: string
) => {
  log("incoming.start", { senderId, pageId, messageText });
  const conversation = await getOrCreateConversation(senderId, pageId);

  // Send typing indicator while we process
  await sendInstagramTypingIndicator(accessToken, senderId).catch((err) => {
    logErr("typing-indicator.failed", err, { senderId });
  });

  // Process the message through the AI pipeline (same logic as chatbot)
  await processAIResponse(senderId, messageText, conversation, accessToken);
  log("incoming.done", { senderId });
};

// ─── AI pipeline (mirrors chatbot conversation.sendMessage) ─────────

const processAIResponse = async (
  senderId: string,
  messageText: string,
  conversation: IInstagramConversation,
  accessToken: string
) => {
  const trimmedMessage = messageText.trim();
  if (!trimmedMessage) {
    log("ai.skip.empty", { senderId });
    return;
  }

  log("ai.start", {
    senderId,
    status: conversation.status,
    currentFlow: conversation.currentFlow,
    messageStep: conversation.messageStep,
  });

  // Record user message
  conversation.messages.push(buildUserMessage(trimmedMessage));

  if (!conversation.tags.includes("NEW")) {
    conversation.tags = addUniqueTags(conversation.tags, ["NEW"]);
  }

  const contactData = extractContactData(trimmedMessage);

  // ── Completed conversation ──
  if (conversation.status === "COMPLETED") {
    log("ai.branch.completed", {
      senderId,
      currentFlow: conversation.currentFlow,
      hasEmail: Boolean(contactData.email),
      hasPhone: Boolean(contactData.phone),
      note: "no reply will be sent — conversation already COMPLETED",
    });
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
    log("ai.branch.waiting-for-contact", {
      senderId,
      currentFlow: conversation.currentFlow,
      hasEmail: Boolean(contactData.email),
      hasPhone: Boolean(contactData.phone),
      note: contactData.email || contactData.phone
        ? "contact received — will acknowledge and COMPLETE"
        : "no contact in message — saving silently, no reply",
    });
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
    log("ai.intent.classified", {
      senderId,
      category: intent.category,
      source: intent.source,
    });
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
    log("ai.skip.no-flow", { senderId, note: "currentFlow still null after classification — saving silently" });
    await conversation.save();
    return;
  }

  // ── Check reply limit ──
  const replyLimit = getReplyLimitForFlow(conversation.currentFlow);
  if (
    conversation.currentFlow !== "GENERAL" &&
    conversation.messageStep >= replyLimit
  ) {
    log("ai.reply-limit.hit", {
      senderId,
      currentFlow: conversation.currentFlow,
      messageStep: conversation.messageStep,
      replyLimit,
      note: "flipping to COMPLETED, no reply sent",
    });
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
    log("ai.reply.generating-general", { senderId, historyLen: conversation.messages.length });
    const aiResponse = await generateChatResponse(conversation.messages);
    if (aiResponse) {
      replyText = aiResponse;
      log("ai.reply.general-ok", { senderId, replyLen: replyText.length });
    } else {
      replyText =
        "Sorry, I'm having a bit of trouble right now. Could you try asking that again?";
      logErr("ai.reply.general-fallback", new Error("All AI providers returned null"), { senderId });
    }
  } else {
    replyText = getFlowReply(
      conversation.currentFlow,
      nextStep,
      producerBranch
    );
    log("ai.reply.flow", {
      senderId,
      currentFlow: conversation.currentFlow,
      nextStep,
      producerBranch,
      replyLen: replyText.length,
    });
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
    log("ai.status.waiting-for-contact", { senderId, currentFlow: conversation.currentFlow, nextStep });
  }

  await conversation.save();
  log("ai.saved", { senderId, status: conversation.status, messageStep: conversation.messageStep });

  // ── Send reply via Instagram Graph API ──
  log("ai.send.start", { senderId, replyLen: replyText.length });
  try {
    const res = await sendInstagramMessage(accessToken, senderId, replyText);
    log("ai.send.done", { senderId, ok: res.ok, status: res.status });
  } catch (err) {
    logErr("ai.send.threw", err, { senderId });
  }
};

// ─── Webhook handler entry points ───────────────────────────────────

/**
 * Handle the incoming webhook POST body from Instagram.
 * Called after immediately responding 200 to Meta.
 */
export const handleInstagramWebhook = async (payload: WebhookPayload) => {
  const entries = payload.entry ?? [];
  log("webhook.received", {
    object: payload.object,
    entryCount: entries.length,
    messagingCounts: entries.map((e) => e.messaging?.length ?? 0),
  });

  if (entries.length === 0) {
    log("webhook.no-entries", { rawPayload: payload });
    return;
  }

  for (const entry of entries) {
    if (Array.isArray(entry.messaging) && entry.messaging.length) {
      await Promise.all(
        entry.messaging.map((event) => processMessagingEvent(event))
      );
    } else {
      log("webhook.entry-no-messaging", {
        entryId: entry.id,
        keys: Object.keys(entry),
      });
    }
  }
  log("webhook.done");
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

  log("webhook.verify.request", {
    mode,
    tokenProvided: Boolean(token),
    tokenConfigured: Boolean(verifyToken),
    tokenMatch: Boolean(verifyToken) && token === verifyToken,
  });

  if (mode === "subscribe" && token === verifyToken) {
    return { success: true, challenge };
  }

  return { success: false };
};
