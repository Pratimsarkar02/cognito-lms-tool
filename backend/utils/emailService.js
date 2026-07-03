import transporter from "../config/nodemailer.js";

const EMAIL_CATEGORY_STATUS = {
  auth_welcome: true,
  auth_verify_otp: true,
  auth_reset_otp: true,
  exam_created: true,
  exam_updated: true,
  exam_deleted: true,
  question_added: true,
  question_updated: true,
  notification_published: true,
  results_published: true,
};

export const isEmailCategoryEnabled = async (category) => {
  // Central switch point for future DB/user preference logic.
  // Later you can replace this with:
  // 1. system setting check
  // 2. user preference check
  // 3. category-specific allow/block
  return EMAIL_CATEGORY_STATUS[category] !== false;
};

export const sendSystemEmail = async ({
  to,
  subject,
  html,
  category = "general",
  force = false,
}) => {
  try {
    if (!to || !subject || !html) {
      console.log(`[Email] Skipped "${category}" — missing to/subject/html`);
      return { skipped: true, reason: "missing_payload" };
    }

    if (!force) {
      const enabled = await isEmailCategoryEnabled(category);
      if (!enabled) {
        console.log(`[Email] Skipped "${category}" — category disabled`);
        return { skipped: true, reason: "category_disabled" };
      }
    }

    const recipients = Array.isArray(to) ? [...new Set(to.filter(Boolean))] : [to].filter(Boolean);

    if (!recipients.length) {
      console.log(`[Email] Skipped "${category}" — no valid recipients`);
      return { skipped: true, reason: "no_recipients" };
    }

    const info = await transporter.sendMail({
      from: process.env.SENDER_MAIL,
      to: recipients.join(","),
      subject,
      html,
    });

    console.log(`[Email] Sent "${category}" to ${recipients.length} recipient(s)`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Email] Failed "${category}":`, error.message);
    return { success: false, error };
  }
};