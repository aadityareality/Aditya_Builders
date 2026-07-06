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

  if (!apiKey || apiKey.trim() === "" || apiKey === "re_development_dummy_key") {
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
    // ─── 1. Build Clickable Image Thumbnail Links for HTML Body ────────────────
    let attachmentsHtml = "";
    if (hasAttachments) {
      attachmentsHtml = `
        <div style="background-color: #ffffff; border: 1px solid #f0e6db; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #e8871e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans-serif;">Photo Attachments (${inquiry.attachments.length})</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">
            ${inquiry.attachments.map((att, idx) => `
              <div style="text-align: center; border: 1px solid #f0e6db; border-radius: 6px; padding: 6px; background-color: #fffbf5;">
                <a href="${att.url}" target="_blank" style="text-decoration: none;">
                  <img src="${att.url}" alt="Attachment ${idx + 1}" style="width: 80px; height: 80px; object-cover; border-radius: 4px; border: 1px solid #f0e6db;" />
                  <span style="display: block; font-size: 9px; color: #3b82c4; font-weight: bold; margin-top: 4px;">View Full Image</span>
                </a>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // ─── 2. Attempt Base64 Fetching for True Native Email Attachments ──────────
    const emailAttachments = [];
    if (hasAttachments) {
      let totalBytes = 0;
      for (const att of inquiry.attachments) {
        try {
          const response = await fetch(att.url);
          if (!response.ok) throw new Error(`HTTP status ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const size = buffer.length;
          totalBytes += size;

          // Under 10MB limit (common provider constraint)
          if (totalBytes < 10 * 1024 * 1024) {
            const filename = att.publicId ? att.publicId.split("/").pop() : `attachment-${Date.now()}`;
            const ext = att.url.split(".").pop().split("?")[0] || "jpg";
            emailAttachments.push({
              content: buffer.toString("base64"),
              filename: `${filename}.${ext}`,
            });
          } else {
            console.log("⚠️  [Email Service] Combined attachments size exceeds 10MB limit, skipping remaining native email attachments.");
            break;
          }
        } catch (fetchErr) {
          console.warn(`⚠️  [Email Service] Failed to fetch/encode attachment image ${att.url}:`, fetchErr.message);
        }
      }
    }

    // ─── 3. Construct Gold/Cream Styled Email Template ────────────────────────
    const projectTitle = inquiry.interestedProject?.title || "";
    const subjectTitle = projectTitle ? `Lead: ${inquiry.name} — ${projectTitle}` : `Lead: ${inquiry.name} — General Inquiry`;

    const htmlContent = `
      <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f5a623; border-radius: 16px; background-color: #fffbf5; color: #2e2a26;">
        <div style="text-align: center; border-bottom: 2px solid #f5a623; padding-bottom: 20px; margin-bottom: 25px;">
          <h2 style="color: #e8871e; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Aditya Builders Portal</h2>
          <p style="font-size: 11px; color: #6b625a; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold; tracking-widest;">New Sales Lead Notification</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; width: 130px; border-bottom: 1px solid #f0e6db;">Lead Name:</td>
            <td style="padding: 8px 0; color: #2e2a26; border-bottom: 1px solid #f0e6db; font-weight: bold;">${inquiry.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Email Address:</td>
            <td style="padding: 8px 0; color: #2e2a26; border-bottom: 1px solid #f0e6db;"><a href="mailto:${inquiry.email}" style="color: #e8871e; text-decoration: none; font-weight: bold;">${inquiry.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Phone Number:</td>
            <td style="padding: 8px 0; color: #2e2a26; border-bottom: 1px solid #f0e6db;"><a href="tel:${inquiry.phone}" style="color: #e8871e; text-decoration: none; font-weight: bold;">${inquiry.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Source:</td>
            <td style="padding: 8px 0; color: #2e2a26; border-bottom: 1px solid #f0e6db;">${inquiry.source}</td>
          </tr>
          ${projectTitle ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Project Interest:</td>
            <td style="padding: 8px 0; color: #e8871e; border-bottom: 1px solid #f0e6db; font-weight: bold;">${projectTitle}</td>
          </tr>` : ""}
        </table>
        
        <div style="background-color: #ffffff; border: 1px solid #f0e6db; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #e8871e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans-serif;">Message Text</h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #2e2a26; white-space: pre-wrap;">"${inquiry.message}"</p>
        </div>

        ${attachmentsHtml}
        
        <div style="background-color: #f5a623; color: #ffffff; border-radius: 8px; padding: 12px; text-align: center; font-weight: bold; font-size: 13px; margin-top: 10px;">
          ⚠️ Action Required: Please contact this customer immediately to follow up on this lead.
        </div>
        
        <div style="font-size: 11px; text-align: center; color: #6b625a; border-top: 1px solid #f0e6db; padding-top: 15px; margin-top: 25px;">
          <p style="margin: 0;">This is an automated message sent from the Aditya Builders CMS panel.</p>
          <p style="margin: 5px 0 0 0;">Bhavnagar, Gujarat • Quality | Trust</p>
        </div>
      </div>
    `;

    // ─── 4. Dispatch Email via Resend Client ─────────────────────────────────
    const sendData = {
      from: fromEmail,
      to: toEmail,
      subject: `🏠 Lead Alert: ${inquiry.name} (${projectTitle || "General Inquiry"})`,
      html: htmlContent,
    };

    if (emailAttachments.length > 0) {
      sendData.attachments = emailAttachments;
    }

    const response = await resendClient.emails.send(sendData);
    console.log("📧 [Email Service] Resend lead alert dispatched successfully:", response.data?.id || response);
  } catch (error) {
    console.error("❌ [Email Service] Resend email delivery failed:", error.message);
  }
};

/**
 * sendCallbackNotificationEmail
 * Dispatches callback requests alerts to the sales team inbox via Resend.
 */
export const sendCallbackNotificationEmail = async (callback) => {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFY_EMAIL_TO || "admin@adityabuilders.in";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey || apiKey.trim() === "" || apiKey === "re_development_dummy_key") {
    console.warn("⚠️  [Email Service] RESEND_API_KEY not configured. Falling back to stub logging.");
    console.log("✉️  [Email Service Stub] New Callback Request details:");
    console.log(`   - To: ${toEmail}`);
    console.log(`   - Name: ${callback.name}`);
    console.log(`   - Phone: ${callback.phone}`);
    console.log(`   - Preferred Time: ${callback.preferredTime}`);
    if (callback.relatedProject) {
      console.log(`   - Project Ref ID: ${callback.relatedProject}`);
    }
    return;
  }

  try {
    const projectTitle = callback.relatedProject?.title || "";
    const htmlContent = `
      <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f5a623; border-radius: 16px; background-color: #fffbf5; color: #2e2a26;">
        <div style="text-align: center; border-bottom: 2px solid #f5a623; padding-bottom: 20px; margin-bottom: 25px;">
          <h2 style="color: #e8871e; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Aditya Builders Portal</h2>
          <p style="font-size: 11px; color: #6b625a; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold; tracking-widest;">New Callback Request</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; width: 150px; border-bottom: 1px solid #f0e6db;">Customer Name:</td>
            <td style="padding: 8px 0; color: #2e2a26; border-bottom: 1px solid #f0e6db; font-weight: bold;">${callback.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Phone Number:</td>
            <td style="padding: 8px 0; color: #e8871e; border-bottom: 1px solid #f0e6db; font-weight: bold;"><a href="tel:${callback.phone}" style="color: #e8871e; text-decoration: none;">${callback.phone}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Preferred Call Time:</td>
            <td style="padding: 8px 0; color: #2e2a26; border-bottom: 1px solid #f0e6db;">${callback.preferredTime}</td>
          </tr>
          ${projectTitle ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b625a; border-bottom: 1px solid #f0e6db;">Project Interest:</td>
            <td style="padding: 8px 0; color: #e8871e; border-bottom: 1px solid #f0e6db; font-weight: bold;">${projectTitle}</td>
          </tr>` : ""}
        </table>
        
        <div style="background-color: #f5a623; color: #ffffff; border-radius: 8px; padding: 12px; text-align: center; font-weight: bold; font-size: 13px; margin-top: 10px;">
          📞 Action Required: Please call this number back as soon as possible.
        </div>
        
        <div style="font-size: 11px; text-align: center; color: #6b625a; border-top: 1px solid #f0e6db; padding-top: 15px; margin-top: 25px;">
          <p style="margin: 0;">This is an automated callback alert from the Aditya Builders CMS panel.</p>
          <p style="margin: 5px 0 0 0;">Bhavnagar, Gujarat • Quality | Trust</p>
        </div>
      </div>
    `;

    await resendClient.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `📞 Callback Lead: ${callback.name} (${projectTitle || "No project specified"})`,
      html: htmlContent,
    });
    console.log("📧 [Email Service] Resend callback alert dispatched successfully");
  } catch (error) {
    console.error("❌ [Email Service] Resend callback email delivery failed:", error.message);
  }
};
