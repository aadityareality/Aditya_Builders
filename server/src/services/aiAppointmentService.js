import Appointment from "../../models/Appointment.js";
import Project from "../../models/Project.js";

/**
 * Returns available slots for a project on a given date by checking conflicts.
 */
export const getAvailableSlots = async (projectId, dateStr) => {
  const defaultSlots = ["10:30 AM", "11:30 AM", "3:00 PM", "4:30 PM"];
  try {
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return defaultSlots;

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filter = {
      preferredDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Confirmed", "Rescheduled"] }
    };

    if (projectId) {
      filter.project = projectId;
    }

    const booked = await Appointment.find(filter).select("preferredTime");
    const bookedTimes = booked.map(b => b.preferredTime.trim());

    return defaultSlots.filter(slot => !bookedTimes.includes(slot));
  } catch (err) {
    console.error("⚠️ Error checking available slots:", err.message);
    return defaultSlots;
  }
};

/**
 * Attempts to automatically book a site visit appointment parsed from AI NLU context.
 */
export const bookAppointmentViaAi = async (customer, projectTitle, dateStr, timeStr) => {
  try {
    // 1. Resolve Project
    let project = null;
    let projName = "";
    if (projectTitle) {
      project = await Project.findOne({ 
        title: { $regex: projectTitle, $options: "i" }, 
        isActive: true 
      });
      if (project) {
        projName = project.title;
      }
    }

    // 2. Parse Date
    let preferredDate = null;
    if (dateStr) {
      // Direct string parse or relative parsing
      preferredDate = new Date(dateStr);
    }
    
    if (!preferredDate || isNaN(preferredDate.getTime())) {
      // Default to tomorrow if parsing failed
      preferredDate = new Date();
      preferredDate.setDate(preferredDate.getDate() + 1);
    }

    // Normalize date (discard hours/mins for storage boundary comparison)
    preferredDate.setHours(12, 0, 0, 0); 

    const preferredTime = timeStr || "10:30 AM";

    // 3. Double-Booking Database Validation (Unique constraint check)
    const startOfDay = new Date(preferredDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(preferredDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictQuery = {
      preferredDate: { $gte: startOfDay, $lte: endOfDay },
      preferredTime: preferredTime,
      status: { $in: ["Confirmed", "Rescheduled"] }
    };
    if (project) {
      conflictQuery.project = project._id;
    }

    const existingConflict = await Appointment.findOne(conflictQuery);
    if (existingConflict) {
      return { 
        success: false, 
        message: `Sorry, the slot at ${preferredTime} on ${preferredDate.toLocaleDateString()} is already booked. Please suggest another time.` 
      };
    }

    // 4. Create and Save Appointment
    const appointment = new Appointment({
      customerName: customer.name || "WhatsApp Client",
      customerPhone: customer.phone,
      project: project ? project._id : null,
      projectName: projName,
      preferredDate,
      preferredTime,
      numberOfVisitors: 1,
      notes: "Booked automatically via WhatsApp AI Assistant",
      status: "Confirmed"
    });

    await appointment.save();
    
    // Update customer stage
    customer.stage = "Site Visit Booked";
    await customer.save();

    console.log(`✅ AI Appointment Booked: Phone=${customer.phone}, Ref=${appointment.referenceId}`);
    return {
      success: true,
      appointment,
      message: `Great! Your site visit is confirmed for *${projName || "Aaditya Builders Project"}* on *${preferredDate.toDateString()}* at *${preferredTime}*. Reference ID: *${appointment.referenceId}*.`
    };
  } catch (err) {
    console.error("❌ bookAppointmentViaAi error:", err.message);
    return { success: false, message: "Internal booking error. Please try again." };
  }
};
