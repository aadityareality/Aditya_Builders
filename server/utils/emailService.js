/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Transactional email service module using Resend.com.
 * Automatically falls back to console.log in development if RESEND_API_KEY is missing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import resendClient from "../config/resend.js";

/**
 * sendContactNotificationEmail
 * Sends a notification email to the administrator when a new contact inquiry
 * is submitted on the website.
 *
 * @param {Object} inquiry - The ContactInquiry document from Mongoose
 * @returns {Promise<void>}
 */
export const sendContactNotificationEmail = async (inquiry) => {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFY_EMAIL_TO || "admin@adityabuilders.in";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const hasAttachments = inquiry.attachments && inquiry.attachments.length > 0;

  if (!apiKey || apiKey.trim() === "") {
    console.warn("⚠️  [Email Service] RESEND_API_KEY not configured. Falling back to stub logging.");
    console.log("✉️  [Email Service Stub] New Website Lead details:");
    console.log(`   - To: ${toEmail}`);
    console.log(`   - Subject: New Website Lead: ${inquiry.subject || "No Subject"}`);
    console.log(`   - From: ${inquiry.name} <${inquiry.email}>`);
    console.log(`   - Phone: ${inquiry.phone}`);
    console.log(`   - Message: "${inquiry.message}"`);
    console.log(`   - Source: ${inquiry.source}`);
    if (hasAttachments) {
      console.log("   - Attachments:");
      inquiry.attachments.forEach((att, idx) => {
        console.log(`     [${idx + 1}] ${att.url}`);
      });
    }
    return;
  }

  try {
    let attachmentsHtml = "";
    if (hasAttachments) {
      attachmentsHtml = `
        <div style="background-color: #ffffff; border: 1px solid #e5e4e7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #e8871e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Photo Attachments (${inquiry.attachments.length})</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${inquiry.attachments.map((att, idx) => `
              <div style="font-size: 13px;">
                <a href="${att.url}" target="_blank" style="color: #3b82c4; text-decoration: none; font-weight: bold;">
                  📸 Attachment #${idx + 1} (View Full Image)
                </a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f5a623; border-radius: 12px; background-color: #fffbf5; color: #2e2a26;">
        <div style="text-align: center; border-bottom: 2px solid #f5a623; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #e8871e; margin: 0; font-family: 'Outfit', sans-serif;">Aditya Builders CMS</h2>
          <p style="font-size: 12px; color: #6b625a; margin: 5px 0 0 0;">New Sales Lead Notification</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; width: 120px;">Customer Name:</td>
            <td style="padding: 8px 0; color: #2e2a26;">${inquiry.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a;">Email Address:</td>
            <td style="padding: 8px 0; color: #2e2a26;"><a href="mailto:${inquiry.email}" style="color: #3b82c4; text-decoration: none;">${inquiry.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a;">Phone Number:</td>
            <td style="padding: 8px 0; color: #2e2a26;"><a href="tel:${inquiry.phone}" style="color: #3b82c4; text-decoration: none;">${inquiry.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a;">Inquiry Source:</td>
            <td style="padding: 8px 0; color: #2e2a26;">${inquiry.source}</td>
          </tr>
          ${inquiry.subject ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a;">Subject:</td>
            <td style="padding: 8px 0; color: #2e2a26;">${inquiry.subject}</td>
          </tr>` : ""}
        </table>
        
        <div style="background-color: #ffffff; border: 1px solid #e5e4e7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #e8871e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message Details</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #2e2a26; white-space: pre-wrap;">"${inquiry.message}"</p>
        </div>

        ${attachmentsHtml}
        
        <div style="font-size: 11px; text-align: center; color: #6b625a; border-top: 1px solid #e5e4e7; padding-top: 15px; margin-top: 25px;">
          <p style="margin: 0;">This is an automated message sent from the Aditya Builders Administration portal.</p>
          <p style="margin: 5px 0 0 0;">Bhavnagar, Gujarat • Quality | Trust</p>
        </div>
      </div>
    `;

    const response = await resendClient.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New Lead: ${inquiry.name} (${inquiry.source})`,
      html: htmlContent,
    });

    console.log("📧 [Email Service] Resend notification sent successfully:", response.data?.id || response);
  } catch (error) {
    console.error("❌ [Email Service] Resend email delivery failed:", error.message);
  }
};
