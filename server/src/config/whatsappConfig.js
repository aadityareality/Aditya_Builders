import "dotenv/config";

export const whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  phoneNumberId: process.env.PHONE_NUMBER_ID || "",
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  verifyToken: process.env.VERIFY_TOKEN || "aaditya-builders-webhook",
  adminPhoneNumber: process.env.ADMIN_WHATSAPP_NUMBER || process.env.ADMIN_PHONE_NUMBER || "919974858500",
  businessPhoneNumber: process.env.BUSINESS_WHATSAPP_NUMBER || "919974858500",
  graphApiVersion: process.env.GRAPH_API_VERSION || "v23.0",
  appSecret: process.env.WHATSAPP_APP_SECRET || ""
};

export default whatsappConfig;
