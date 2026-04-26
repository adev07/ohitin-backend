import admin from "./admin";
import business from "./business";
import conversation from "./conversation";
import conversationLock from "./conversationLock";
import instagramConversation from "./instagramConversation";
import metaSettings from "./metaSettings";
import processedMessage from "./processedMessage";
import user from "./user";

const db = {
  admin,
  business,
  conversation,
  conversationLock,
  instagramConversation,
  metaSettings,
  processedMessage,
  user,
};

export default db;
