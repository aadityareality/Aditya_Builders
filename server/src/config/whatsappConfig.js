import "dotenv/config";

export const whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || "",
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN || "aaditya-builders-webhook",
  adminPhoneNumber: process.env.ADMIN_WHATSAPP_NUMBER || process.env.ADMIN_PHONE_NUMBER || "919974858500",
  businessPhoneNumber: process.env.BUSINESS_WHATSAPP_NUMBER || "919974858500",
  graphApiVersion: process.env.GRAPH_API_VERSION || "v23.0",
  appSecret: process.env.WHATSAPP_APP_SECRET || process.env.APP_SECRET || "",
  brochureUrl: process.env.BROCHURE_URL || "",
  googleMapUrl: process.env.GOOGLE_MAP_URL || "https://www.google.com/maps?q=21.75979,72.12433",
  officePhone: process.env.OFFICE_PHONE || "919974858500",
  officeEmail: process.env.OFFICE_EMAIL || "parthrajsinhparmar4115@gmail.com",
  officeAddress: process.env.OFFICE_ADDRESS || "Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat"
};

export default whatsappConfig;
