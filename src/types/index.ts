export type IntentCategory = "INVESTOR" | "PRODUCER" | "CREATIVE" | "GENERAL";

export type TUserTypes = {
  name: string;
  email: string;
  password: string;
};

export type TBusinessTypes = {
  user_id?: string;
  business_name: string;
  business_listing_price: number;
  business_gross_revenue: number;
  business_cash_flow: number;
  business_notes: string;
  loan_sba_amount: number;
  loan_sba_rate: number;
  loan_sba_term: number;
  loan_seller_amount: number;
  loan_seller_rate: number;
  loan_seller_term: number;
  loan_down_payment: number;
  desired_owner_salary: number;
  additional_startup_capital: number;
  additional_capital_expenses: number;
  expected_annual_growth_rate: number;
};

export type ConversationTag =
  | "NEW"
  | "ENGAGED"
  | "EMAIL_RECEIVED"
  | "PHONE_RECEIVED"
  | "INVESTOR"
  | "PRODUCER"
  | "PRODUCER_FINANCING"
  | "PRODUCER_CREATIVE"
  | "CREATIVE"
  | "CREATIVE_ACTOR"
  | "CREATIVE_DIRECTOR"
  | "CREATIVE_FILMMAKER"
  | "CREATIVE_PRODUCER"
  | "CREATIVE_EDITOR"
  | "CREATIVE_COMPOSER"
  | "CREATIVE_DP"
  | "GENERAL_SUPPORT";

export type MessageSender = "user" | "assistant";

export type MessageRecord = {
  sender: MessageSender;
  text: string;
  createdAt?: Date;
  step?: number;
  delayMs?: number;
  quickReplies?: string[];
};

export type ConversationStatus = "ACTIVE" | "WAITING_FOR_CONTACT" | "COMPLETED";

export type ConversationDocumentShape = {
  userId: string;
  currentFlow: IntentCategory | null;
  messageStep: number;
  tags: ConversationTag[];
  capturedData: {
    email?: string;
    phone?: string;
  };
  messages: MessageRecord[];
  profileType: "professional" | "fan" | null;
  classificationSource: "keyword" | "gemini" | "fallback";
  status: ConversationStatus;
};
