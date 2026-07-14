import Appointment from "../../models/Appointment.js";
import BrochureDownload from "../../models/BrochureDownload.js";
import CallbackRequest from "../../models/CallbackRequest.js";
import Message from "../../models/Message.js";
import Customer from "../../models/Customer.js";

/**
 * Automatically scores and updates a Customer's lead status based on their actions.
 * @param {string} customerId - Mongoose ObjectId of the Customer.
 * @param {Object} memory - Current ConversationMemory document (optional).
 */
export const updateLeadScore = async (customerId, memory = null) => {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return null;

    let score = 0;
    const reasons = [];

    // 1. Budget Mentioned (+20 points)
    const budgetVal = customer.budget || (memory && memory.budgetMentioned);
    if (budgetVal && budgetVal.trim().length > 0) {
      score += 20;
      reasons.push("Budget provided");
    }

    // 2. Timeline Urgency (+15 points)
    // Urgency checked from priority or intent tags
    if (customer.priority === "Urgent" || customer.priority === "High") {
      score += 15;
      reasons.push("High timeline urgency");
    }

    // 3. Interest Level / Engagement (+10 points)
    if (customer.leadStatus === "Interested" || customer.stage === "Engaged") {
      score += 10;
      reasons.push("Active customer interest");
    }

    // 4. Appointments Booked (+20 points)
    const appointments = await Appointment.find({ customerPhone: customer.phone });
    if (appointments.length > 0) {
      score += 20;
      reasons.push(`Appointment booked (${appointments.length})`);
      
      // 5. Site Visit Completed (+15 points)
      const hasCompletedVisit = appointments.some(apt => apt.status === "Completed");
      if (hasCompletedVisit) {
        score += 15;
        reasons.push("Site visit completed");
      }
    }

    // 6. Conversation Length (+10 points)
    // Find messages count in Chat matching customer
    const msgCount = await Message.countDocuments({
      chat: { $in: await mongooseChatIdsForCustomer(customerId) }
    });
    if (msgCount >= 10) {
      score += 10;
      reasons.push("High conversation length");
    } else if (msgCount >= 4) {
      score += 5;
      reasons.push("Medium conversation length");
    }

    // 7. Project(s) viewed (+10 points)
    const viewedCount = memory?.projectsViewed?.length || 0;
    if (viewedCount > 0) {
      score += 10;
      reasons.push(`Projects viewed (${viewedCount})`);
    }

    // 8. Brochure Downloaded (+15 points)
    const brochures = await BrochureDownload.find({ customerPhone: customer.phone });
    if (brochures.length > 0) {
      score += 15;
      reasons.push("Brochure downloaded");
    }

    // 9. Callback Requested (+15 points)
    const callbacks = await CallbackRequest.find({ customerPhone: customer.phone });
    if (callbacks.length > 0) {
      score += 15;
      reasons.push("Callback requested");
    }

    // Cap the score at 100
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    customer.leadScore = score;

    // Map score to Priority and LeadStatus
    // Labels mapping:
    // >= 75: Hot Lead + Very High / Urgent Priority
    // >= 40: Warm Lead + Medium/High Priority
    // < 40: Cold Lead + Low/Medium Priority
    let statusLabel = "Cold";
    let priorityLabel = "Medium";

    if (score >= 75) {
      statusLabel = "Hot";
      priorityLabel = "High";
      if (score >= 90) priorityLabel = "Urgent";
    } else if (score >= 40) {
      statusLabel = "Warm";
      priorityLabel = "Medium";
      if (score >= 60) priorityLabel = "High";
    } else {
      statusLabel = "Cold";
      priorityLabel = "Low";
    }

    // Save score metrics on the customer
    customer.leadStatus = statusLabel;
    customer.priority = priorityLabel;
    
    // Set custom score labels and reasons in customer tags or metadata
    // Check if we should update stage
    if (appointments.length > 0) {
      customer.stage = "Site Visit Booked";
    } else if (msgCount > 2) {
      customer.stage = "Engaged";
    }

    await customer.save();
    console.log(`📊 Lead scored: Name=${customer.name}, Phone=${customer.phone}, Score=${score}, Status=${statusLabel}`);
    return { score, statusLabel, reasons };
  } catch (error) {
    console.error("❌ Lead qualification failed:", error.message);
    return null;
  }
};

// Helper to resolve Chat ids for a customer
async function mongooseChatIdsForCustomer(customerId) {
  try {
    const Chat = mongoose.model("Chat");
    const chats = await Chat.find({ customer: customerId }).select("_id");
    return chats.map(c => c._id);
  } catch {
    return [];
  }
}
import mongoose from "mongoose";
