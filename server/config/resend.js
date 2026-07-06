import { Resend } from "resend";

/**
 * Initialises the Resend SDK client.
 * The client is exported for use in email utility functions (to be built in a later phase).
 * From-address and recipient are pulled from environment variables at send time.
 *
 * Usage (later phase):
 *   import resendClient from "../config/resend.js";
 *   await resendClient.emails.send({ from, to, subject, html });
 */
const resendClient = new Resend(process.env.RESEND_API_KEY);

console.log("📧 Resend client initialised");

export default resendClient;
