import axios from "axios";
import whatsappConfig from "../config/whatsappConfig.js";
import SiteSettings from "../../models/SiteSettings.js";
import Chat from "../../models/Chat.js";
import Customer from "../../models/Customer.js";
import Message from "../../models/Message.js";

/**
 * Helper to construct the API endpoint URL
 */
const getApiUrl = () => {
  const version = whatsappConfig.graphApiVersion || "v23.0";
  const phoneId = whatsappConfig.phoneNumberId;
  return `https://graph.facebook.com/${version}/${phoneId}/messages`;
};

/**
 * Helper to construct authorization and content headers
 */
const getHeaders = () => {
  return {
    Authorization: `Bearer ${whatsappConfig.accessToken}`,
    "Content-Type": "application/json",
  };
};

/**
 * Check if the customer has interacted with us within the last 24 hours.
 */
export const checkActiveSession = async (toPhone) => {
  try {
    const cleanPhone = toPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone) return false;

    // Look up customer by phone (handles suffix matching for the last 10 digits)
    const customer = await Customer.findOne({
      phone: { $regex: new RegExp(cleanPhone.slice(-10) + "$") }
    });
    if (!customer) return false;

    const chat = await Chat.findOne({ customer: customer._id });
    if (!chat) return false;

    const lastIncoming = await Message.findOne({ chat: chat._id, direction: "incoming" })
      .sort({ timestamp: -1 });

    if (!lastIncoming) return false;

    const diff = Date.now() - new Date(lastIncoming.timestamp).getTime();
    return diff < 24 * 60 * 60 * 1000;
  } catch (err) {
    console.error("Error checking active session:", err);
    return false;
  }
};

/**
 * General purpose sender to post payloads to the Meta Graph API
 * @param {Object} payload - The Meta API request payload
 */
export const sendMetaMessage = async (payload) => {
  try {
    const url = getApiUrl();
    const headers = getHeaders();

    if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
      console.warn("⚠️ WhatsApp Credentials (Access Token / Phone Number ID) not fully configured in environment.");
      return { mock: true, success: true, message: "Mock response. Add credentials to send real messages." };
    }

    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error("❌ WhatsApp Service API Error:", JSON.stringify(errorDetails));
    throw new Error(
      `Meta API request failed: ${error.response?.data?.error?.message || error.message}`
    );
  }
};

/**
 * Send standard plain text message
 * @param {string} to - Recipient phone number (with country code, e.g. 919974858500)
 * @param {string} text - Message body
 */
export const sendTextMessage = async (to, text) => {
  const formattedPhone = to.replace(/[^0-9]/g, "");
  const activeSession = await checkActiveSession(formattedPhone);

  if (!activeSession) {
    console.log(`⚠️ Preemptive 24-hour window restriction for ${formattedPhone}. Routing via template...`);
    return await sendTemplateMessage(formattedPhone, "marketing_promotion", "en", [
      {
        type: "body",
        parameters: [
          { type: "text", text: text }
        ]
      }
    ]);
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "text",
    text: {
      preview_url: true,
      body: text,
    },
  };
  try {
    return await sendMetaMessage(payload);
  } catch (err) {
    const errData = err.message || "";
    if (errData.includes("131047") || errData.includes("24 hours") || errData.includes("session")) {
      console.log(`⚠️ 24-hour window restriction for ${formattedPhone}. Retrying with template fallback...`);
      return await sendTemplateMessage(formattedPhone, "marketing_promotion", "en", [
        {
          type: "body",
          parameters: [
            { type: "text", text: text }
          ]
        }
      ]);
    }
    throw err;
  }
};

/**
 * Send template message
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Name of approved Meta template
 * @param {string} languageCode - Language code, e.g. 'en_US'
 * @param {Array} components - Array of components for parameter binding
 */
export const sendTemplateMessage = async (to, templateName, languageCode = "en", components = []) => {
  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/[^0-9]/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: components,
    },
  };
  return sendMetaMessage(payload);
};

/**
 * Mark an incoming message as read by sending a read receipt payload.
 * @param {string} messageId - Unique ID of the incoming message sent by Meta.
 */
export const markMessageAsRead = async (messageId) => {
  const payload = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  };
  return sendMetaMessage(payload);
};

/**
 * Send an image
 * @param {string} to - Recipient phone number
 * @param {string} imageUrl - Fully qualified direct URL to public image
 * @param {string} [caption] - Text description below image
 */
export const sendImage = async (to, imageUrl, caption = "") => {
  const formattedPhone = to.replace(/[^0-9]/g, "");
  const activeSession = await checkActiveSession(formattedPhone);

  if (!activeSession) {
    console.log(`⚠️ Preemptive 24-hour window restriction for ${formattedPhone}. Routing image via template...`);
    const textFallback = `${caption ? caption + "\n\n" : ""}Image Link: ${imageUrl}`;
    return await sendTemplateMessage(formattedPhone, "marketing_promotion", "en", [
      {
        type: "body",
        parameters: [
          { type: "text", text: textFallback }
        ]
      }
    ]);
  }

  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "image",
    image: {
      link: imageUrl,
      caption: caption,
    },
  };
  try {
    return await sendMetaMessage(payload);
  } catch (err) {
    const errData = err.message || "";
    if (errData.includes("131047") || errData.includes("24 hours") || errData.includes("session")) {
      console.log(`⚠️ 24-hour window restriction for ${formattedPhone}. Retrying image with template fallback...`);
      const textFallback = `${caption ? caption + "\n\n" : ""}Image Link: ${imageUrl}`;
      return await sendTemplateMessage(formattedPhone, "marketing_promotion", "en", [
        {
          type: "body",
          parameters: [
            { type: "text", text: textFallback }
          ]
        }
      ]);
    }
    throw err;
  }
};

/**
 * Send a document
 * @param {string} to - Recipient phone number
 * @param {string} documentUrl - Fully qualified direct URL to public document (PDF, docx, etc.)
 * @param {string} filename - Display filename for WhatsApp UI
 * @param {string} [caption] - Text caption
 */
export const sendDocument = async (to, documentUrl, filename, caption = "") => {
  const formattedPhone = to.replace(/[^0-9]/g, "");
  const activeSession = await checkActiveSession(formattedPhone);

  if (!activeSession) {
    console.log(`⚠️ Preemptive 24-hour window restriction for ${formattedPhone}. Routing document via template...`);
    const textFallback = `Document "${filename}"${caption ? ": " + caption : ""}\nLink: ${documentUrl}`;
    return await sendTemplateMessage(formattedPhone, "marketing_promotion", "en", [
      {
        type: "body",
        parameters: [
          { type: "text", text: textFallback }
        ]
      }
    ]);
  }

  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "document",
    document: {
      link: documentUrl,
      filename: filename,
      caption: caption,
    },
  };
  try {
    return await sendMetaMessage(payload);
  } catch (err) {
    const errData = err.message || "";
    if (errData.includes("131047") || errData.includes("24 hours") || errData.includes("session")) {
      console.log(`⚠️ 24-hour window restriction for ${formattedPhone}. Retrying document with template fallback...`);
      const textFallback = `Document "${filename}"${caption ? ": " + caption : ""}\nLink: ${documentUrl}`;
      return await sendTemplateMessage(formattedPhone, "marketing_promotion", "en", [
        {
          type: "body",
          parameters: [
            { type: "text", text: textFallback }
          ]
        }
      ]);
    }
    throw err;
  }
};

/**
 * Send location map pin
 * @param {string} to - Recipient phone number
 * @param {number} latitude - Geo latitude
 * @param {number} longitude - Geo longitude
 * @param {string} name - Title description of location
 * @param {string} address - Physical address
 */
export const sendLocation = async (to, latitude, longitude, name, address) => {
  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/[^0-9]/g, ""),
    type: "location",
    location: {
      latitude: String(latitude),
      longitude: String(longitude),
      name: name,
      address: address,
    },
  };
  return sendMetaMessage(payload);
};

/**
 * Send vCard contact details
 * @param {string} to - Recipient phone number
 * @param {Object} contactData - Structural representation of contact card
 */
export const sendContact = async (to, contactData) => {
  const first = contactData.firstName || "";
  const last = contactData.lastName || "";
  const formattedName = contactData.fullName || `${first} ${last}`.trim();
  const phone = contactData.phone || "";
  const org = contactData.org || "";
  const email = contactData.email || "";

  const vcard = 
    `BEGIN:VCARD\n` +
    `VERSION:3.0\n` +
    `FN:${formattedName}\n` +
    `N:${last};${first};;;\n` +
    `ORG:${org};\n` +
    `TEL;TYPE=CELL,WORK:${phone}\n` +
    `EMAIL;TYPE=INTERNET:${email}\n` +
    `END:VCARD`;

  const payload = {
    messaging_product: "whatsapp",
    to: to.replace(/[^0-9]/g, ""),
    type: "contacts",
    contacts: [
      {
        name: {
          first_name: first,
          last_name: last,
          formatted_name: formattedName,
        },
        org: {
          company: org,
        },
        phones: [
          {
            phone: phone,
            type: "WORK",
          },
        ],
        emails: email ? [
          {
            email: email,
            type: "WORK",
          }
        ] : [],
        ims: [],
      },
    ],
  };
  return sendMetaMessage(payload);
};

/**
 * Send interactive quick-reply buttons (Max 3 buttons)
 * @param {string} to - Recipient phone number
 * @param {string} text - Header/Body message text
 * @param {Array<{id: string, title: string}>} buttons - Config for reply buttons
 */
export const sendInteractiveButtons = async (to, text, buttons) => {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    throw new Error("Interactive message requires at least one button");
  }

  const formattedButtons = buttons.slice(0, 3).map((btn) => ({
    type: "reply",
    reply: {
      id: btn.id,
      title: btn.title.slice(0, 20), // Meta limit title to 20 chars
    },
  }));

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to.replace(/[^0-9]/g, ""),
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: text,
      },
      action: {
        buttons: formattedButtons,
      },
    },
  };
  return sendMetaMessage(payload);
};

/**
 * Send Property Inquiry details
 * @param {string} to - Recipient phone number
 * @param {Object} details - Property interest parameters
 * @param {string} details.property - Property name
 * @param {string} details.budget - Price budget
 * @param {string} details.location - Site location
 */
export const sendPropertyInquiry = async (to, { property, budget, location }) => {
  const text = 
    `Hello,\n\n` +
    `I am interested in\n` +
    `Property: ${property}\n` +
    `Budget: ${budget}\n` +
    `Location: ${location}\n\n` +
    `Please contact me.`;

  return sendTextMessage(to, text);
};

/**
 * Send an appointment reminder (can be triggered by scheduler/node-cron)
 * @param {string} to - Recipient phone number
 * @param {Object} details - Reminder details
 * @param {string} details.customerName - Name of customer
 * @param {string} details.date - Day of meeting
 * @param {string} details.time - Slot of meeting
 * @param {string} details.propertyName - Target construction project
 */
export const sendAppointmentReminder = async (to, { customerName, date, time, projectName, relativeTimeText }) => {
  const settings = await SiteSettings.getSettings();
  const address = settings.address || "Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat";
  const link = `https://www.google.com/maps?q=${settings.mapLatitude || 21.7484},${settings.mapLongitude || 72.1328}`;
  const phone = settings.phoneNumbers?.[0] || "+91 99748 58500";

  const text = 
    `🔔 *Reminder*\n\n` +
    `Your site visit for *${projectName}*\n` +
    `is scheduled *${relativeTimeText}* at *${time}*.\n\n` +
    `📍 *Office Address:* ${address}\n` +
    `🗺️ *Google Maps:* ${link}\n` +
    `📞 *Contact Number:* ${phone}`;

  return sendTextMessage(to, text);
};

/**
 * Helper to clean and format phone numbers for WhatsApp Cloud API (defaults to 91 country code for India if 10-digits)
 * @param {string} phone - Input phone number
 * @returns {string} Cleaned phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
};

/**
 * Send inquiry confirmation to customer
 */
export const sendCustomerInquiryConfirmation = async (customerPhone, customerName, projectName = "") => {
  const formattedPhone = formatPhoneNumber(customerPhone);
  const projectText = projectName ? `for "${projectName}"` : "our projects";

  const components = [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: customerName,
        },
        {
          type: "text",
          text: projectText,
        }
      ],
    },
  ];

  return sendTemplateMessage(formattedPhone, "inquiry_confirmation", "en", components);
};

export const sendAdminInquiryAlert = async (inquiry) => {
  const name = inquiry.name || "N/A";
  const email = inquiry.email || "N/A";
  const phone = inquiry.phone || "N/A";
  const subject = inquiry.subject || "N/A";
  const project = inquiry.interestedProject?.title || "N/A";
  const message = inquiry.message || "N/A";

  const dateStr = new Date(inquiry.createdAt || Date.now()).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
  const timeStr = new Date(inquiry.createdAt || Date.now()).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
  const reference = inquiry.referenceId || inquiry._id || "N/A";

  let adminText = 
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏢 NEW WEBSITE ENQUIRY\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 Name: ${name}\n` +
    `📱 Phone: ${phone}\n` +
    `📧 Email: ${email}\n` +
    `🏗 Project: ${project}\n` +
    `📌 Subject: ${subject}\n` +
    `💬 Message: ${message}\n` +
    `🕒 Date: ${dateStr}\n` +
    `⏰ Time: ${timeStr}\n` +
    `🆔 Reference ID: ${reference}\n`;

  // If a project is attached, append extended property details
  if (inquiry.interestedProject && typeof inquiry.interestedProject === "object") {
    const proj = inquiry.interestedProject;
    
    // Format area
    let areaStr = "N/A";
    if (proj.saleableArea && proj.saleableArea.minSqFt) {
      if (proj.saleableArea.maxSqFt) {
        areaStr = `${proj.saleableArea.minSqFt} - ${proj.saleableArea.maxSqFt} sq.ft`;
      } else {
        areaStr = `${proj.saleableArea.minSqFt} sq.ft`;
      }
    }

    const clientBaseUrl = process.env.CLIENT_URL || "https://adityabuilders.in";
    const propertyUrl = `${clientBaseUrl}/projects/${proj.slug || ""}`;

    adminText += 
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏘️ PROPERTY DETAILS\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `- Property Name: ${proj.title || "N/A"}\n` +
      `- Property ID: ${proj._id || "N/A"}\n` +
      `- Project Name: ${proj.title || "N/A"}\n` +
      `- Property Type: ${proj.type || "N/A"}\n` +
      `- Configuration: ${proj.configuration || "N/A"}\n` +
      `- Area: ${areaStr}\n` +
      `- Price: ${proj.startingPrice || "N/A"}\n` +
      `- Location: ${proj.location || "N/A"}\n` +
      `- Builder: Aditya Builders\n` +
      `- Possession Date: ${proj.possessionDate || "N/A"}\n` +
      `- Property URL: ${propertyUrl}\n`;
  }

  adminText += 
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Source: Website Contact Form\n` +
    `━━━━━━━━━━━━━━━━━━━━━━`;

  const formattedAdminPhone = formatPhoneNumber(whatsappConfig.adminPhoneNumber);
  return sendTextMessage(formattedAdminPhone, adminText);
};

export const sendAdminSentimentAlert = async (customerName, customerPhone, messageText) => {
  const adminText = 
    `⚠️ *ATTENTION: Negative Sentiment Detected* ⚠️\n\n` +
    `Customer *${customerName}* (${customerPhone}) has sent a message with high frustration or negative sentiment. A human sales agent should step in immediately.\n\n` +
    `*Customer Message:* "${messageText}"`;
  
  const formattedAdminPhone = formatPhoneNumber(whatsappConfig.adminPhoneNumber);
  return sendTextMessage(formattedAdminPhone, adminText);
};

const whatsappService = {
  sendMetaMessage,
  sendTextMessage,
  sendTemplateMessage,
  sendImage,
  sendDocument,
  sendLocation,
  sendContact,
  sendInteractiveButtons,
  sendPropertyInquiry,
  sendAppointmentReminder,
  formatPhoneNumber,
  sendCustomerInquiryConfirmation,
  sendAdminInquiryAlert,
  sendAdminSentimentAlert,
  markMessageAsRead,
};

export default whatsappService;
