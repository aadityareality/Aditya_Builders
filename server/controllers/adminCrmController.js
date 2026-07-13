import Chat from "../models/Chat.js";
import Customer from "../models/Customer.js";
import Message from "../models/Message.js";
import MessageStatus from "../models/MessageStatus.js";
import Admin from "../models/Admin.js";
import Project from "../models/Project.js";
import catchAsync from "../utils/catchAsync.js";
import whatsappService from "../src/services/whatsappService.js";
import whatsappConfig from "../src/config/whatsappConfig.js";
import { emitToAdmins } from "../src/services/socketService.js";

/**
 * GET /api/admin/crm/conversations
 * Fetch conversation list with status, lead status, search, and role filters
 */
export const getConversations = catchAsync(async (req, res) => {
  const { status, leadStatus, search, unread, assigned, page = 1, limit = 50 } = req.query;

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

  if (unread === "true") {
    matchQuery.unreadCount = { $gt: 0 };
  }

  // Search filter across customer details or linked project/reference ID
  if (search) {
    const searchRegex = new RegExp(search, "i");
    matchQuery.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { tags: { $in: [searchRegex] } }
    ];
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
  const total = await Message.countDocuments({ chat: chatId });
  
  const messages = await Message.find({ chat: chatId })
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

  // Re-fetch populated message details to send
  const populatedMsg = await Message.findById(msgDoc._id).populate("sentBy", "name email");

  // Broadcast back to connected admins
  emitToAdmins("message_new", { chatId: chat._id, message: populatedMsg }, customer.assignedExecutive);

  res.status(201).json({ success: true, data: populatedMsg });
});

/**
 * PATCH /api/admin/crm/customers/:id
 * Edit Customer lead status or assigned executive
 */
export const updateCustomer = catchAsync(async (req, res) => {
  const { name, email, leadStatus, assignedExecutive, pinned } = req.body;
  const customerId = req.params.id;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer profile not found" });
  }

  // Prevent executives from editing assignments or overriding status arbitrarily
  if (req.admin.role === "executive" && customer.assignedExecutive?.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Profile not assigned to you" });
  }

  if (name !== undefined) customer.name = name;
  if (email !== undefined) customer.email = email;
  if (leadStatus !== undefined) customer.leadStatus = leadStatus;
  if (pinned !== undefined) customer.pinned = pinned;

  if (assignedExecutive !== undefined) {
    if (req.admin.role === "executive") {
      return res.status(403).json({ success: false, message: "Executives cannot reassign profiles" });
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

  customer.internalNotes.push({
    text,
    createdBy: req.admin._id,
    createdAt: new Date()
  });

  await customer.save();

  const updatedCustomer = await Customer.findById(customer._id)
    .populate("internalNotes.createdBy", "name email");

  // Get newly added note
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
  if (!["Open", "Closed", "Pending", "Archived"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid chat status" });
  }

  const chat = await Chat.findById(req.params.id).populate("customer");
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  chat.status = status;
  if (status === "Closed") {
    chat.closedAt = new Date();
  } else {
    chat.closedAt = null;
  }
  await chat.save();

  emitToAdmins("chat_status_changed", { chatId: chat._id, status }, chat.customer.assignedExecutive);

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

  if (req.admin.role === "executive") {
    return res.status(403).json({ success: false, message: "Executives do not have permission to delete threads" });
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

  emitToAdmins("chat_deleted", { chatId: chat._id }, chat.customer?.assignedExecutive);

  res.status(200).json({ success: true, message: "Conversation history purged successfully" });
});

/**
 * GET /api/admin/crm/conversations/:id/export
 * Export Chat history thread as structured file (JSON or CSV)
 */
export const exportChatHistory = catchAsync(async (req, res) => {
  const { format = "json" } = req.query;
  const chat = await Chat.findById(req.params.id).populate("customer");
  if (!chat) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const messages = await Message.find({ chat: chat._id })
    .sort({ timestamp: 1 })
    .populate("sentBy", "name");

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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // 1. Message Volume counts
  const todayMessages = await Message.countDocuments({ createdAt: { $gte: todayStart } });
  const weekMessages = await Message.countDocuments({ createdAt: { $gte: weekStart } });
  
  // 2. Conversation statuses totals
  const totalConversations = await Chat.countDocuments();
  const openConversations = await Chat.countDocuments({ status: "Open" });
  const pendingConversations = await Chat.countDocuments({ status: "Pending" });
  const closedConversations = await Chat.countDocuments({ status: "Closed" });

  const totalCustomers = await Customer.countDocuments();
  const unreadChats = await Customer.countDocuments({ unreadCount: { $gt: 0 } });

  // 3. Response time calculation
  // Fetch messages from this week to calculate average first response time
  const messagesThisWeek = await Message.find({ createdAt: { $gte: weekStart } }).sort({ timestamp: 1 });
  
  // Group by chat
  const chatMessagesMap = {};
  messagesThisWeek.forEach(m => {
    if (!chatMessagesMap[m.chat]) chatMessagesMap[m.chat] = [];
    chatMessagesMap[m.chat].push(m);
  });

  let totalResponseDiffMs = 0;
  let responseCount = 0;

  Object.keys(chatMessagesMap).forEach(chatId => {
    const list = chatMessagesMap[chatId];
    // Find pairs of incoming messages followed by outgoing message responses
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].direction === "incoming" && list[i + 1].direction === "outgoing") {
        const diff = new Date(list[i + 1].timestamp) - new Date(list[i].timestamp);
        // Only count sensible replies (e.g. less than 24 hours response time to avoid skewed numbers)
        if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
          totalResponseDiffMs += diff;
          responseCount++;
        }
      }
    }
  });

  const avgResponseTimeMins = responseCount > 0 ? Math.round((totalResponseDiffMs / responseCount) / (1000 * 60)) : 0;

  // 4. Fetch executives lists to return
  const executives = await Admin.find({ role: { $in: ["superadmin", "editor", "executive", "manager"] } }).select("name email role");

  res.status(200).json({
    success: true,
    data: {
      todayMessages,
      weekMessages,
      totalConversations,
      openConversations,
      pendingConversations,
      closedConversations,
      totalCustomers,
      unreadChats,
      avgResponseTimeMins,
      executives
    }
  });
});
