import { Request, Response } from "express";
import {
  handleInstagramWebhook,
  verifyInstagramWebhook,
} from "../services/instagram";

/**
 * GET /api/instagram/webhook
 * Meta calls this to verify the webhook subscription.
 */
export const webhookVerification = async (req: Request, res: Response) => {
  const result = await verifyInstagramWebhook(req.query as any);

  if (result.success) {
    console.log("✅ Instagram webhook verified");
    res.status(200).send(result.challenge);
  } else {
    console.warn("❌ Instagram webhook verification failed");
    res.sendStatus(403);
  }
};

/**
 * POST /api/instagram/webhook
 * Meta sends incoming DM events here.
 * We respond 200 immediately, then process asynchronously.
 */
export const webhookHandler = (req: Request, res: Response) => {
  // Respond immediately so Meta doesn't retry
  res.status(200).send("EVENT_RECEIVED");

  // Process in background — don't await
  handleInstagramWebhook(req.body).catch((err) => {
    console.error("Instagram webhook processing error:", err);
  });
};
