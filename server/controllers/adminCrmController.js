import Chat from "../models/Chat.js";
import Customer from "../models/Customer.js";
import Message from "../models/Message.js";
import MessageStatus from "../models/MessageStatus.js";
import Admin from "../models/Admin.js";
import Project from "../models/Project.js";
import CallbackRequest from "../models/CallbackRequest.js";
import BrochureDownload from "../models/BrochureDownload.js";
import Appointment from "../models/Appointment.js";
import catchAsync from "../utils/catchAsync.js";
import whatsappService from "../src/services/whatsappService.js";
import whatsappConfig from "../src/config/whatsappConfig.js";
import { emitToAdmins } from "../src/services/socketService.js";

/**
 * GET /api/admin/crm/conversations
 * Fetch conversation list with status, lead status, search, and role filters
 */
export const getConversations = catchAsync(async (req, res) => {
  const { status, leadStatus, search, unread, assigned, filterType, page = 1, limit = 50 } = req.query;

  const matchQuery = {};

  // Role-based filtering: Executive role can only see their own assigned conversations
  if (req.admin.role === "executive") {
    matchQuery.assignedExecutive = req.admin._id;
  } else if (assigned) {
    if (assigned === "unassigned") {
      matchQuery.assignedExecutive = null;
    } else {
      matchQuery.assignedExecutive = assigned;
    }
  }

  if (leadStatus) {
    matchQuery.leadStatus = leadStatus;
  }

  // Multi-filter queries (Feature 10 & 11)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filterType) {
    if (filterType === "unread") {
      matchQuery.unreadCount = { $gt: 0 };
    } else if (filterType === "today") {
      matchQuery.lastMessageAt = { $gte: today };
    } else if (filterType === "high_priority") {
      matchQuery.priority = { $in: ["High", "Urgent"] };
    } else if (filterType === "appointments") {
      const appts = await Appointment.find({ status: { $in: ["Confirmed", "Rescheduled"] } }).select("customerPhone");
      const phones = appts.map(a => a.customerPhone);
      matchQuery.phone = { $in: phones };
    } else if (filterType === "new") {
      matchQuery.leadStatus = "New";
    } else if (filterType === "interested") {
      matchQuery.leadStatus = "Interested";
    } else if (filterType === "booked_visits") {
      matchQuery.leadStatus = "Booked Visit";
    } else if (filterType === "won") {
      matchQuery.leadStatus = "Won";
    } else if (filterType === "lost") {
      matchQuery.leadStatus = "Lost";
    }
  }

  if (unread === "true") {
    matchQuery.unreadCount = { $gt: 0 };
  }

  // Search filter across customer details, location, tags, and message content (Feature 10 & 11)
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const searchConditions = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { tags: { $in: [searchRegex] } },
      { city: searchRegex },
      { state: searchRegex }
    ];

    // Search message body content
    const matchingMessages = await Message.find({ body: searchRegex, isDeleted: { $ne: true } }).select("chat");
    const chatIds = matchingMessages.map(m => m.chat);
    if (chatIds.length > 0) {
      const chatObjs = await Chat.find({ _id: { $in: chatIds } }).select("customer");
      const customerIdsFromMessages = chatObjs.map(c => c.customer);
      searchConditions.push({ _id: { $in: customerIdsFromMessages } });
    }

    matchQuery.$or = searchConditions;
  }

  const skip = (Number(page) - 1) * Number(limit);

  // 1. Fetch filtered Customers
  const customers = await Customer.find(matchQuery)
    .populate("interestedProject", "title location")
    .populate("assignedExecutive", "name email role");

  const customerIds = customers.map(c => c._id);

  // 2. Fetch linked Chat records
  const chatQuery = { customer: { $in: customerIds } };
  if (status) {
    chatQuery.status = status;
  }

  const chats = await Chat.find(chatQuery);
  const chatCustomerIds = new Set(chats.map(c => c.customer.toString()));

  // 3. Map conversations list and sort by pinned + last message time
  const conversations = customers
    .filter(c => chatCustomerIds.has(c._id.toString()))
    .map(customer => {
      const chat = chats.find(ch => ch.customer.toString() === customer._id.toString());
      return {
        customer,
        chatId: chat._id,
        chatStatus: chat.status,
        startedAt: chat.startedAt,
        closedAt: chat.closedAt,
      };
    })
    .sort((a, b) => {
      // Pinned conversations always bubble to the top
      const pinA = a.customer.pinned ? 1 : 0;
      const pinB = b.customer.pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;

      return new Date(b.customer.lastMessageAt) - new Date(a.customer.lastMessageAt);
    });

  const paginatedList = conversations.slice(skip, skip + Number(limit));

  res.status(200).json({
    success: true,
    total: conversations.length,
    page: Number(page),
    pages: Math.ceil(conversations.length / Number(limit)),
    data: paginatedList,
  });
});

/**
 * GET /api/admin/crm/conversations/:id/messages
 * Paginated chat messages, marks all incoming as read
 */
export const getChatMessages = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  // Check role restriction
  if (req.admin.role === "executive") {
    const customerObj = await Customer.findById(chat.customer);
    if (!customerObj || customerObj.assignedExecutive?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Conversation is not assigned to you" });
    }
  }

  // Reset unread count for customer
  await Customer.findByIdAndUpdate(chat.customer, { unreadCount: 0 });

  // Update status of incoming messages to 'read'
  const unreadMessages = await Message.find({
    chat: chatId,
    direction: "incoming",
    deliveryStatus: { $ne: "read" }
  });

  if (unreadMessages.length > 0) {
    const idsToUpdate = unreadMessages.map(m => m._id);
    await Message.updateMany(
      { _id: { $in: idsToUpdate } },
      { $set: { deliveryStatus: "read" } }
    );

    // Emit real-time read ticks update event
    emitToAdmins("messages_read", { chatId, updatedIds: idsToUpdate });
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Message.countDocuments({ chat: chatId, isDeleted: { $ne: true } });
  
  const messages = await Message.find({ chat: chatId, isDeleted: { $ne: true } })
    .sort({ timestamp: 1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("sentBy", "name email");

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: messages,
  });
});

/**
 * POST /api/admin/crm/conversations/:id/reply
 * Send manual WhatsApp reply message from CRM Dashboard
 */
export const sendCrmReply = catchAsync(async (req, res) => {
  const { messageType, body } = req.body;
  const chatId = req.params.id;

  if (!messageType || !body) {
    return res.status(400).json({ success: false, message: "messageType and body are required" });
  }

  const chat = await Chat.findById(chatId).populate("customer");
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const customer = chat.customer;

  // Check role restriction
  if (req.admin.role === "executive" && customer.assignedExecutive?.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Conversation is not assigned to you" });
  }

  // Clean and format number
  const formattedPhone = whatsappService.formatPhoneNumber(customer.phone);
  let metaResponse = null;

  // Trigger Meta WhatsApp API based on messageType
  try {
    if (messageType === "text") {
      metaResponse = await whatsappService.sendTextMessage(formattedPhone, body);
    } else if (messageType === "image") {
      metaResponse = await whatsappService.sendImage(formattedPhone, body.url, body.caption || "");
    } else if (messageType === "document") {
      metaResponse = await whatsappService.sendDocument(formattedPhone, body.url, body.filename || "file.pdf", body.caption || "");
    } else if (messageType === "location") {
      metaResponse = await whatsappService.sendLocation(formattedPhone, body.latitude, body.longitude, body.name || "", body.address || "");
    } else if (messageType === "template") {
      metaResponse = await whatsappService.sendTemplateMessage(formattedPhone, body.templateName, body.languageCode || "en_US", body.components || []);
    } else {
      return res.status(400).json({ success: false, message: `Unsupported CRM manual messageType: ${messageType}` });
    }
  } catch (err) {
    console.error("❌ Manual Reply Meta Dispatch Failed:", err.message);
    return res.status(500).json({ success: false, message: `WhatsApp Cloud API error: ${err.message}` });
  }

  const metaMessageId = metaResponse?.messages?.[0]?.id || `msg-out-${Date.now()}`;

  // Save Outgoing Message in MongoDB
  const msgDoc = await Message.create({
    chat: chat._id,
    direction: "outgoing",
    messageType,
    body: messageType === "text" ? body : body,
    metaMessageId,
    deliveryStatus: metaResponse?.mock ? "sent" : "sent",
    sentBy: req.admin._id,
    timestamp: new Date()
  });

  // Update Customer meta preview details
  customer.lastMessage = messageType === "text" ? body : `[Manual Outgoing ${messageType}]`;
  customer.lastMessageAt = new Date();
  customer.lastActiveAt = new Date();
  await customer.save();

  // Auto-transition chat status to Waiting Customer
  chat.status = "Waiting Customer";
  await chat.save();

  // Re-fetch populated message details to send
  const populatedMsg = await Message.findById(msgDoc._id).populate("sentBy", "name email");

  // Broadcast back to connected admins and the specific conversation room
  emitToAdmins("message_new", { chatId: chat._id, message: populatedMsg }, customer.assignedExecutive, chat._id);
  emitToAdmins("chat_status_changed", { chatId: chat._id, status: "Waiting Customer" }, customer.assignedExecutive, chat._id);

  res.status(201).json({ success: true, data: populatedMsg });
});

/**
 * PATCH /api/admin/crm/customers/:id
 * Edit Customer lead status or assigned executive
 */
export const updateCustomer = catchAsync(async (req, res) => {
  const { name, email, leadStatus, assignedExecutive, pinned, priority, budget, city, state, dealValue, nextFollowUpDate } = req.body;
  const customerId = req.params.id;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer profile not found" });
  }

  // Role validation: executive can only edit their assigned profiles
  if (req.admin.role === "executive" && customer.assignedExecutive?.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Profile not assigned to you" });
  }

  if (name !== undefined) customer.name = name;
  if (email !== undefined) customer.email = email;
  if (leadStatus !== undefined) customer.leadStatus = leadStatus;
  if (pinned !== undefined) customer.pinned = pinned;
  if (priority !== undefined) customer.priority = priority;
  if (budget !== undefined) customer.budget = budget;
  if (city !== undefined) customer.city = city;
  if (state !== undefined) customer.state = state;
  if (dealValue !== undefined) customer.dealValue = dealValue;
  if (nextFollowUpDate !== undefined) customer.nextFollowUpDate = nextFollowUpDate;

  if (assignedExecutive !== undefined) {
    if (req.admin.role === "executive") {
      return res.status(403).json({ success: false, message: "Executives cannot reassign profiles" });
    }
    if (req.admin.role !== "superadmin" && req.admin.role !== "manager") {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to assign leads" });
    }
    customer.assignedExecutive = assignedExecutive === "" ? null : assignedExecutive;
  }

  await customer.save();
  
  const populatedCustomer = await Customer.findById(customer._id)
    .populate("interestedProject", "title location")
    .populate("assignedExecutive", "name email role");

  // Emit refresh room profile alerts
  emitToAdmins("customer_updated", { customer: populatedCustomer }, customer.assignedExecutive);

  res.status(200).json({ success: true, data: populatedCustomer });
});

/**
 * POST /api/admin/crm/customers/:id/notes
 * Add internal admin note to Customer record
 */
export const addCustomerNote = catchAsync(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: "Note text is required" });
  }

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  // Permission check for executives
  if (req.admin.role === "executive" && customer.assignedExecutive?.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Profile not assigned to you" });
  }

  customer.internalNotes.push({
    text,
    createdBy: req.admin._id,
    createdAt: new Date()
  });

  await customer.save();

  const updatedCustomer = await Customer.findById(customer._id)
    .populate("internalNotes.createdBy", "name email");

  const newNote = updatedCustomer.internalNotes[updatedCustomer.internalNotes.length - 1];

  res.status(201).json({ success: true, data: newNote });
});

/**
 * PUT /api/admin/crm/customers/:id/tags
 * Replace Customer tag elements array
 */
export const updateCustomerTags = catchAsync(async (req, res) => {
  const { tags } = req.body;
  if (!Array.isArray(tags)) {
    return res.status(400).json({ success: false, message: "tags must be an array of strings" });
  }

  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  // Permission check for executives
  if (req.admin.role === "executive" && customer.assignedExecutive?.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Profile not assigned to you" });
  }

  customer.tags = tags.map(t => t.trim()).filter(Boolean);
  await customer.save();

  res.status(200).json({ success: true, tags: customer.tags });
});

/**
 * PATCH /api/admin/crm/conversations/:id/status
 * Toggle/Close/Archive conversation thread status
 */
export const updateChatStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!["Open", "Assigned", "Waiting Customer", "Closed", "Spam", "Blocked", "Resolved"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid chat status" });
  }

  const chat = await Chat.findById(req.params.id).populate("customer");
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  // Permission check for executives
  if (req.admin.role === "executive" && chat.customer?.assignedExecutive?.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Conversation not assigned to you" });
  }

  chat.status = status;
  if (status === "Closed") {
    chat.closedAt = new Date();
  } else {
    chat.closedAt = null;
  }
  await chat.save();

  emitToAdmins("chat_status_changed", { chatId: chat._id, status }, chat.customer.assignedExecutive, chat._id);

  res.status(200).json({ success: true, data: chat });
});

/**
 * DELETE /api/admin/crm/conversations/:id
 * Delete Chat thread and all messaging histories
 */
export const deleteChatThread = catchAsync(async (req, res) => {
  const chat = await Chat.findById(req.params.id).populate("customer");
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Forbidden: Only Super Admins do have permission to delete threads" });
  }

  // Delete all messages logs
  await Message.deleteMany({ chat: chat._id });

  // Delete Chat thread
  await Chat.findByIdAndDelete(chat._id);

  // Delete linked customer records or clear customer lastMessage states
  if (chat.customer) {
    await Customer.findByIdAndUpdate(chat.customer._id, {
      lastMessage: "[Chat thread deleted]",
      unreadCount: 0
    });
  }

  emitToAdmins("chat_deleted", { chatId: chat._id }, chat.customer?.assignedExecutive, chat._id);

  res.status(200).json({ success: true, message: "Conversation history purged successfully" });
});

/**
 * DELETE /api/admin/crm/conversations/:id/messages/:messageId
 * Soft-delete an individual message
 */
export const deleteMessage = catchAsync(async (req, res) => {
  const { id: chatId, messageId } = req.params;

  if (req.admin.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Forbidden: Only Super Admins can delete messages" });
  }

  const msg = await Message.findOne({ _id: messageId, chat: chatId });
  if (!msg) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }

  msg.isDeleted = true;
  await msg.save();

  // Broadcast deletion update
  emitToAdmins("message_deleted", { chatId, messageId }, null, chatId);

  res.status(200).json({ success: true, message: "Message soft-deleted successfully" });
});

/**
 * GET /api/admin/crm/conversations/:id/export
 * Export Chat history thread as structured file (JSON or CSV)
 */
export const exportChatHistory = catchAsync(async (req, res) => {
  const { format = "json" } = req.query;

  // Permissions check
  if (req.admin.role !== "superadmin" && req.admin.role !== "manager") {
    return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to export chat history" });
  }

  const chat = await Chat.findById(req.params.id).populate("customer");
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const messages = await Message.find({ chat: chat._id, isDeleted: { $ne: true } })
    .sort({ timestamp: 1 })
    .populate("sentBy", "name");

  if (format === "html") {
    const messageListHtml = messages.map(m => {
      const isOutgoing = m.direction === "outgoing";
      const sender = isOutgoing ? (m.sentBy?.name || "Automated Bot") : chat.customer.name;
      const content = typeof m.body === "object" ? JSON.stringify(m.body) : m.body;
      const dateStr = m.timestamp.toLocaleString();
      return `
        <div class="msg ${isOutgoing ? 'outgoing' : 'incoming'}">
          <div class="sender">${sender} (${m.direction})</div>
          <div>${content}</div>
          <div class="time">${dateStr}</div>
        </div>
      `;
    }).join("\n");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Chat Transcript - ${chat.customer.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; line-height: 1.5; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-bottom: 20px; }
          .meta { margin-bottom: 30px; font-size: 14px; background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef; }
          .msg { margin-bottom: 15px; padding: 12px 15px; border-radius: 6px; border: 1px solid #e9ecef; max-width: 80%; }
          .incoming { background: #e3f2fd; border-color: #bbdefb; margin-right: auto; }
          .outgoing { background: #f1f8e9; border-color: #dcedc8; margin-left: auto; }
          .sender { font-weight: bold; font-size: 13px; margin-bottom: 5px; color: #555; }
          .time { font-size: 11px; color: #888; margin-top: 5px; text-align: right; }
          button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
          button:hover { background: #0056b3; }
          @media print {
            body { padding: 0; }
            button { display: none; }
            .msg { max-width: 100%; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>WhatsApp Conversation Transcript</h2>
          <button onclick="window.print()">Print PDF</button>
        </div>
        <div class="meta">
          <strong>Customer Name:</strong> ${chat.customer.name}<br>
          <strong>Phone Number:</strong> ${chat.customer.phone}<br>
          <strong>Status:</strong> ${chat.status}<br>
          <strong>Exported On:</strong> ${new Date().toLocaleString()}
        </div>
        <div class="chat-container">
          ${messageListHtml}
        </div>
      </body>
      </html>
    `;

    res.header("Content-Type", "text/html");
    return res.send(htmlContent);
  }

  if (format === "csv") {
    const csvHeaders = ["Timestamp", "Direction", "Sender", "Type", "Content"];
    const rows = messages.map(m => {
      const sender = m.direction === "outgoing" ? (m.sentBy?.name || "Automated Bot") : chat.customer.name;
      const content = typeof m.body === "object" ? JSON.stringify(m.body) : m.body;
      return [
        m.timestamp.toISOString(),
        m.direction,
        sender,
        m.messageType,
        content
      ];
    });

    const csvContent = [
      csvHeaders.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`Chat_Export_${chat.customer.phone}.csv`);
    return res.send(csvContent);
  }

  // Default: JSON export
  res.status(200).json({
    success: true,
    customer: chat.customer,
    chat,
    messages
  });
});

/**
 * GET /api/admin/crm/analytics
 * CRM Performance metric calculators (Response times, volume statistics)
 */
export const getCrmAnalytics = catchAsync(async (req, res) => {
  // Permissions check: only superadmin and manager can view analytics
  if (req.admin.role !== "superadmin" && req.admin.role !== "manager") {
    return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to view CRM analytics" });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(todayStart);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);
  monthStart.setHours(0, 0, 0, 0);

  // 1. Message Volume counts
  const todayMessages = await Message.countDocuments({ createdAt: { $gte: todayStart } });
  const yesterdayMessages = await Message.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd } });
  const weekMessages = await Message.countDocuments({ createdAt: { $gte: weekStart } });
  const monthMessages = await Message.countDocuments({ createdAt: { $gte: monthStart } });
  
  // 2. Conversation statuses totals
  const totalConversations = await Chat.countDocuments();
  const openConversations = await Chat.countDocuments({ status: "Open" });
  const pendingConversations = await Chat.countDocuments({ status: "Pending" });
  const closedConversations = await Chat.countDocuments({ status: "Closed" });

  const totalCustomers = await Customer.countDocuments();
  const unreadChats = await Customer.countDocuments({ unreadCount: { $gt: 0 } });

  // 3. Response time calculation
  const messagesThisWeek = await Message.find({ createdAt: { $gte: weekStart } }).sort({ timestamp: 1 });
  
  const chatMessagesMap = {};
  messagesThisWeek.forEach(m => {
    if (!chatMessagesMap[m.chat]) chatMessagesMap[m.chat] = [];
    chatMessagesMap[m.chat].push(m);
  });

  let totalResponseDiffMs = 0;
  let responseCount = 0;

  Object.keys(chatMessagesMap).forEach(chatId => {
    const list = chatMessagesMap[chatId];
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].direction === "incoming" && list[i + 1].direction === "outgoing") {
        const diff = new Date(list[i + 1].timestamp) - new Date(list[i].timestamp);
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
          totalResponseDiffMs += diff;
          responseCount++;
        }
      }
    }
  });

  const avgResponseTimeMins = responseCount > 0 ? Math.round((totalResponseDiffMs / responseCount) / (1000 * 60)) : 0;

  // 4. Project-wise Leads
  const projectLeads = await Customer.aggregate([
    { $match: { interestedProject: { $ne: null } } },
    { $group: { _id: "$interestedProject", count: { $sum: 1 } } }
  ]);
  const projectLeadsPopulated = await Project.populate(projectLeads, { path: "_id", select: "title" });
  const formattedProjectLeads = projectLeadsPopulated.map(p => ({
    projectName: p._id?.title || "Unknown",
    count: p.count
  }));

  // 5. Conversion Rate
  const totalLeads = await Customer.countDocuments();
  const wonLeads = await Customer.countDocuments({ leadStatus: "Won" });
  const conversionRate = totalLeads > 0 ? parseFloat(((wonLeads / totalLeads) * 100).toFixed(2)) : 0;

  // 6. Appointments, Callbacks, Brochure downloads
  const appointmentsCount = await Appointment.countDocuments();
  const callbacksCount = await CallbackRequest.countDocuments();
  const brochureDownloadsCount = await BrochureDownload.countDocuments();

  // 7. Revenue total from dealValue
  const revenueObj = await Customer.aggregate([
    { $match: { leadStatus: "Won", dealValue: { $ne: null } } },
    { $group: { _id: null, totalRevenue: { $sum: "$dealValue" } } }
  ]);
  const totalRevenue = revenueObj[0]?.totalRevenue || 0;

  // 8. Top Sales Executives Performance
  const executivePerformance = await Customer.aggregate([
    { $match: { assignedExecutive: { $ne: null } } },
    { $group: {
        _id: "$assignedExecutive",
        totalLeads: { $sum: 1 },
        wonLeads: {
          $sum: { $cond: [{ $eq: ["$leadStatus", "Won"] }, 1, 0] }
        }
      }
    },
    { $sort: { wonLeads: -1 } }
  ]);
  const executivePerformancePopulated = await Admin.populate(executivePerformance, { path: "_id", select: "name email" });
  const topExecutives = executivePerformancePopulated.map(exec => ({
    name: exec._id?.name || "Unassigned",
    totalLeads: exec.totalLeads,
    wonLeads: exec.wonLeads,
    conversionRate: exec.totalLeads > 0 ? parseFloat(((exec.wonLeads / exec.totalLeads) * 100).toFixed(2)) : 0
  }));

  // 9. Fetch all executives lists
  const executives = await Admin.find({ role: { $in: ["superadmin", "editor", "executive", "manager", "support"] } }).select("name email role");

  res.status(200).json({
    success: true,
    data: {
      todayMessages,
      yesterdayMessages,
      weekMessages,
      monthMessages,
      totalConversations,
      openConversations,
      pendingConversations,
      closedConversations,
      totalCustomers,
      unreadChats,
      avgResponseTimeMins,
      projectLeads: formattedProjectLeads,
      conversionRate,
      appointmentsCount,
      callbacksCount,
      brochureDownloadsCount,
      totalRevenue,
      topExecutives,
      executives
    }
  });
});

/**
 * POST /api/admin/crm/broadcast
 * Send promotional WhatsApp message to multiple selected customers
 */
export const sendCrmBroadcast = catchAsync(async (req, res) => {
  const { customerIds, messageType, body } = req.body;

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return res.status(400).json({ success: false, message: "customerIds array is required" });
  }

  if (!messageType || !body) {
    return res.status(400).json({ success: false, message: "messageType and body are required" });
  }

  // Permissions validation (Only superadmin and manager can send campaigns)
  if (req.admin.role !== "superadmin" && req.admin.role !== "manager") {
    return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to send campaigns" });
  }

  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  for (const customerId of customerIds) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        failureCount++;
        errors.push(`Customer ${customerId} not found`);
        continue;
      }

      // Format number
      const formattedPhone = whatsappService.formatPhoneNumber(customer.phone);
      let metaResponse = null;

      // Send via WhatsApp Service
      if (messageType === "text") {
        metaResponse = await whatsappService.sendTextMessage(formattedPhone, body);
      } else if (messageType === "image") {
        metaResponse = await whatsappService.sendImage(formattedPhone, body.url, body.caption || "");
      } else if (messageType === "document") {
        metaResponse = await whatsappService.sendDocument(formattedPhone, body.url, body.filename || "file.pdf", body.caption || "");
      } else if (messageType === "location") {
        metaResponse = await whatsappService.sendLocation(formattedPhone, body.latitude, body.longitude, body.name || "", body.address || "");
      } else if (messageType === "template") {
        metaResponse = await whatsappService.sendTemplateMessage(formattedPhone, body.templateName, body.languageCode || "en_US", body.components || []);
      } else {
        failureCount++;
        errors.push(`Unsupported messageType: ${messageType}`);
        continue;
      }

      const metaMessageId = metaResponse?.messages?.[0]?.id || `broadcast-${Date.now()}-${customer._id}`;

      // Upsert Chat thread for logs
      let chat = await Chat.findOne({ customer: customer._id });
      if (!chat) {
        chat = await Chat.create({ customer: customer._id, status: "Open" });
      }

      // Save Outgoing Message logs
      const msgDoc = await Message.create({
        chat: chat._id,
        direction: "outgoing",
        messageType,
        body: messageType === "text" ? body : body,
        metaMessageId,
        deliveryStatus: "sent",
        sentBy: req.admin._id,
        timestamp: new Date()
      });

      // Update customer preview details
      customer.lastMessage = messageType === "text" ? body : `[Promotional ${messageType}]`;
      customer.lastMessageAt = new Date();
      customer.lastActiveAt = new Date();
      await customer.save();

      // Emit new message update to active dashboard sessions
      const populatedMsg = await Message.findById(msgDoc._id).populate("sentBy", "name email");
      emitToAdmins("message_new", { chatId: chat._id, message: populatedMsg }, customer.assignedExecutive, chat._id);

      successCount++;
    } catch (err) {
      console.error(`❌ Broadcast dispatch failed for customer ${customerId}:`, err.message);
      failureCount++;
      errors.push(`Customer ${customerId} error: ${err.message}`);
    }
  }

  res.status(200).json({
    success: true,
    data: {
      total: customerIds.length,
      successCount,
      failureCount,
      errors
    }
  });
});
