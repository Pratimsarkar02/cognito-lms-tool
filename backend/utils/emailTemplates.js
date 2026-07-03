const APP_NAME = "COGNITO";
const SUPPORT_EMAIL = "help.cognito@gmail.com";
const BRAND_COLOR = "#0f766e";
const BRAND_DARK = "#0b3b36";
const BG_COLOR = "#f4f7fb";
const CARD_COLOR = "#ffffff";
const TEXT_COLOR = "#1f2937";
const MUTED_COLOR = "#6b7280";
const BORDER_COLOR = "#e5e7eb";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const stripHtml = (value = "") =>
  String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const truncate = (value = "", max = 160) => {
  const clean = stripHtml(value);
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
};

export const formatDateTimeIST = (date) => {
  if (!date) return "Not specified";
  return new Date(date).toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

const renderRows = (rows = []) =>
  rows
    .filter((row) => row && row.label && row.value !== undefined && row.value !== null && row.value !== "")
    .map(
      (row) => `
        <tr>
          <td style="padding:12px 14px;border:1px solid ${BORDER_COLOR};background:#f9fafb;font-weight:600;color:${TEXT_COLOR};width:180px;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:12px 14px;border:1px solid ${BORDER_COLOR};color:${TEXT_COLOR};">
            ${row.isHtml ? row.value : escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");

const renderBulletList = (items = []) => {
  if (!items.length) return "";
  return `
    <ul style="margin:0;padding-left:20px;color:${TEXT_COLOR};">
      ${items.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
};

const renderBadge = (text, tone = "default") => {
  const tones = {
    success: { bg: "#dcfce7", fg: "#166534" },
    warning: { bg: "#fef3c7", fg: "#92400e" },
    danger: { bg: "#fee2e2", fg: "#991b1b" },
    info: { bg: "#dbeafe", fg: "#1d4ed8" },
    default: { bg: "#e5e7eb", fg: "#374151" },
  };

  const selected = tones[tone] || tones.default;

  return `
    <span style="
      display:inline-block;
      padding:6px 10px;
      border-radius:999px;
      background:${selected.bg};
      color:${selected.fg};
      font-size:12px;
      font-weight:700;
      letter-spacing:0.02em;
    ">
      ${escapeHtml(text)}
    </span>
  `;
};

export const createEmailLayout = ({
  preheader = "",
  eyebrow = APP_NAME,
  title,
  intro,
  badge,
  rows = [],
  sections = [],
  ctaLabel,
  ctaUrl,
  footerNote,
}) => {
  const rowsHtml = renderRows(rows);

  const sectionsHtml = sections
    .map((section) => {
      if (section.type === "list") {
        return `
          <div style="margin:24px 0 0;">
            <h3 style="margin:0 0 12px;font-size:16px;color:${TEXT_COLOR};">${escapeHtml(section.title || "")}</h3>
            ${renderBulletList(section.items || [])}
          </div>
        `;
      }

      if (section.type === "text") {
        return `
          <div style="margin:24px 0 0;">
            ${section.title ? `<h3 style="margin:0 0 12px;font-size:16px;color:${TEXT_COLOR};">${escapeHtml(section.title)}</h3>` : ""}
            <p style="margin:0;color:${TEXT_COLOR};line-height:1.7;">${escapeHtml(section.text || "")}</p>
          </div>
        `;
      }

      if (section.type === "html") {
        return `
          <div style="margin:24px 0 0;">
            ${section.title ? `<h3 style="margin:0 0 12px;font-size:16px;color:${TEXT_COLOR};">${escapeHtml(section.title)}</h3>` : ""}
            ${section.html || ""}
          </div>
        `;
      }

      return "";
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title || APP_NAME)}</title>
      </head>
      <body style="margin:0;padding:0;background:${BG_COLOR};font-family:Arial,Helvetica,sans-serif;color:${TEXT_COLOR};">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${escapeHtml(preheader)}
        </div>

        <div style="padding:32px 16px;background:${BG_COLOR};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;margin:0 auto;">
            <tr>
              <td style="padding:0;">
                <div style="background:linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_DARK});border-radius:20px 20px 0 0;padding:28px 32px;color:#ffffff;">
                  <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">
                    ${escapeHtml(eyebrow)}
                  </p>
                  <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:700;">
                    ${escapeHtml(title)}
                  </h1>
                </div>

                <div style="background:${CARD_COLOR};border:1px solid ${BORDER_COLOR};border-top:none;border-radius:0 0 20px 20px;padding:32px;">
                  ${
                    badge
                      ? `<div style="margin:0 0 20px;">${renderBadge(badge.text, badge.tone)}</div>`
                      : ""
                  }

                  <p style="margin:0;color:${TEXT_COLOR};font-size:16px;line-height:1.8;">
                    ${escapeHtml(intro)}
                  </p>

                  ${
                    rowsHtml
                      ? `
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;border-collapse:collapse;border-radius:12px;overflow:hidden;">
                          ${rowsHtml}
                        </table>
                      `
                      : ""
                  }

                  ${sectionsHtml}

                  ${
                    ctaLabel && ctaUrl
                      ? `
                        <div style="margin:28px 0 0;">
                          <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="
                            display:inline-block;
                            padding:14px 22px;
                            background:${BRAND_COLOR};
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:12px;
                            font-weight:700;
                          ">
                            ${escapeHtml(ctaLabel)}
                          </a>
                        </div>
                      `
                      : ""
                  }

                  <div style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${BORDER_COLOR};">
                    <p style="margin:0 0 10px;color:${MUTED_COLOR};font-size:14px;line-height:1.7;">
                      ${escapeHtml(footerNote || `Need help? Contact ${SUPPORT_EMAIL}.`)}
                    </p>
                    <p style="margin:0;color:${MUTED_COLOR};font-size:13px;">
                      Best regards,<br />
                      The ${APP_NAME} Team
                    </p>
                  </div>
                </div>

                <p style="margin:16px 0 0;text-align:center;color:${MUTED_COLOR};font-size:12px;">
                  © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};

export const buildWelcomeEmail = ({ firstName, email, role }) => ({
  subject: "Welcome to COGNITO - Your account is ready",
  html: createEmailLayout({
    preheader: "Welcome to COGNITO. Your account has been created successfully.",
    eyebrow: "Account",
    title: `Welcome, ${firstName}!`,
    intro: "Your COGNITO account has been created successfully. You can now sign in and start using the platform.",
    badge: { text: "Account Created", tone: "success" },
    rows: [
      { label: "Name", value: firstName },
      { label: "Email", value: email },
      { label: "Role", value: role },
    ],
    sections: [
      {
        type: "list",
        title: "Next steps",
        items: [
          "Sign in to your dashboard.",
          "Verify your email if prompted.",
          "Complete your profile and start using the platform.",
        ],
      },
    ],
  }),
});

export const buildVerifyOtpEmail = ({ firstName, otp }) => ({
  subject: "Verify your COGNITO email address",
  html: createEmailLayout({
    preheader: "Use this OTP to verify your COGNITO email address.",
    eyebrow: "Email Verification",
    title: "Verify your email",
    intro: `Hi ${firstName}, use the OTP below to verify your email address and complete your account setup.`,
    badge: { text: "OTP Verification", tone: "info" },
    rows: [{ label: "Verification OTP", value: otp }],
    sections: [
      {
        type: "text",
        text: "If you did not request this verification, you can safely ignore this email.",
      },
    ],
  }),
});

export const buildResetOtpEmail = ({ firstName, otp }) => ({
  subject: "Reset your COGNITO password",
  html: createEmailLayout({
    preheader: "Use this OTP to reset your COGNITO password.",
    eyebrow: "Password Reset",
    title: "Reset password request",
    intro: `Hi ${firstName}, we received a request to reset your password. Use the OTP below to continue.`,
    badge: { text: "Password Reset", tone: "warning" },
    rows: [{ label: "Reset OTP", value: otp }],
    sections: [
      {
        type: "text",
        text: "If you did not request a password reset, please ignore this email and keep your account secure.",
      },
    ],
  }),
});

export const buildExamCreatedEmail = ({ creatorName, exam }) => ({
  subject: `Exam created - ${exam.title}`,
  html: createEmailLayout({
    preheader: `Your exam "${exam.title}" has been created successfully.`,
    eyebrow: "Exam",
    title: "Exam created successfully",
    intro: `Hi ${creatorName}, your exam has been created and is currently saved in the system.`,
    badge: { text: "Draft Ready", tone: "success" },
    rows: [
      { label: "Title", value: exam.title },
      { label: "Description", value: truncate(exam.description, 180) },
      { label: "Start Time", value: `${formatDateTimeIST(exam.startTime)} IST` },
      { label: "End Time", value: `${formatDateTimeIST(exam.endTime)} IST` },
      { label: "Duration", value: `${exam.duration} minutes` },
      { label: "Max Attempts", value: exam.maxAttempts === 0 ? "Unlimited" : String(exam.maxAttempts) },
      { label: "Question Shuffling", value: exam.isShuffleQuestions ? "Enabled" : "Disabled" },
      {
        label: "Negative Marking",
        value: exam.isNegativeMarking ? `${exam.negativeMarkingPercentage}% penalty` : "Disabled",
      },
      { label: "Status", value: "Draft" },
    ],
    sections: [
      {
        type: "list",
        title: "Recommended next steps",
        items: [
          "Add questions to the exam.",
          "Review time and marking settings.",
          "Publish the exam when it is ready for students.",
        ],
      },
    ],
  }),
});

export const buildExamUpdatedEmail = ({ creatorName, exam, changes = [] }) => ({
  subject: `Exam updated - ${exam.title}`,
  html: createEmailLayout({
    preheader: `Your exam "${exam.title}" has been updated.`,
    eyebrow: "Exam",
    title: "Exam updated successfully",
    intro: `Hi ${creatorName}, your exam details were updated successfully.`,
    badge: { text: "Changes Saved", tone: "info" },
    rows: [
      { label: "Title", value: exam.title },
      { label: "Description", value: truncate(exam.description, 180) },
      { label: "Start Time", value: `${formatDateTimeIST(exam.startTime)} IST` },
      { label: "End Time", value: `${formatDateTimeIST(exam.endTime)} IST` },
      { label: "Duration", value: `${exam.duration} minutes` },
      { label: "Max Attempts", value: exam.maxAttempts === 0 ? "Unlimited" : String(exam.maxAttempts) },
      { label: "Status", value: exam.status === "published" ? "Published" : "Draft" },
      { label: "Updated On", value: `${formatDateTimeIST(new Date())} IST` },
    ],
    sections: changes.length
      ? [{ type: "list", title: "What changed", items: changes }]
      : [{ type: "text", text: "The exam was updated successfully and all changes have been saved." }],
  }),
});

export const buildExamDeletedEmail = ({ creatorName, exam }) => ({
  subject: `Exam deleted - ${exam.title}`,
  html: createEmailLayout({
    preheader: `Your exam "${exam.title}" has been deleted.`,
    eyebrow: "Exam",
    title: "Exam deleted",
    intro: `Hi ${creatorName}, this email confirms that your exam has been permanently deleted from the system.`,
    badge: { text: "Deleted", tone: "danger" },
    rows: [
      { label: "Title", value: exam.title },
      { label: "Description", value: truncate(exam.description, 180) },
      { label: "Start Time", value: `${formatDateTimeIST(exam.startTime)} IST` },
      { label: "End Time", value: `${formatDateTimeIST(exam.endTime)} IST` },
      { label: "Duration", value: `${exam.duration} minutes` },
      { label: "Previous Status", value: exam.status === "published" ? "Published" : "Draft" },
      { label: "Deleted On", value: `${formatDateTimeIST(new Date())} IST` },
    ],
    sections: [
      {
        type: "text",
        text: "This action is permanent and cannot be undone. If needed, the exam must be recreated from scratch.",
      },
    ],
  }),
});

export const buildQuestionsAddedEmail = ({
  creatorName,
  examTitle,
  questionCount,
  totalNewMarks,
  totalQuestions,
  totalMarks,
  examStatus,
}) => ({
  subject: `Questions added - ${examTitle}`,
  html: createEmailLayout({
    preheader: `You added ${questionCount} question(s) to ${examTitle}.`,
    eyebrow: "Question Bank",
    title: "Questions added successfully",
    intro: `Hi ${creatorName}, your new questions have been added to the exam successfully.`,
    badge: { text: `${questionCount} Question(s) Added`, tone: "success" },
    rows: [
      { label: "Exam Title", value: examTitle },
      { label: "Questions Added", value: String(questionCount) },
      { label: "Marks Added", value: String(totalNewMarks) },
      { label: "Total Questions", value: String(totalQuestions) },
      { label: "Total Marks", value: String(totalMarks) },
      { label: "Exam Status", value: examStatus === "published" ? "Published" : "Draft" },
      { label: "Added On", value: `${formatDateTimeIST(new Date())} IST` },
    ],
    sections: [
      {
        type: "list",
        title: "Suggested next steps",
        items: [
          "Review the new questions for correctness.",
          "Check mark distribution and instructions.",
          "Publish or update the exam when ready.",
        ],
      },
    ],
  }),
});

export const buildQuestionUpdatedEmail = ({
  creatorName,
  examTitle,
  questionType,
  marks,
  questionText,
}) => ({
  subject: `Question updated - ${examTitle}`,
  html: createEmailLayout({
    preheader: `A question was updated in ${examTitle}.`,
    eyebrow: "Question Bank",
    title: "Question updated successfully",
    intro: `Hi ${creatorName}, your question update has been saved successfully.`,
    badge: { text: "Question Updated", tone: "info" },
    rows: [
      { label: "Exam Title", value: examTitle },
      { label: "Question Type", value: String(questionType).toUpperCase() },
      { label: "Marks", value: String(marks) },
      { label: "Question Preview", value: truncate(questionText, 220) },
      { label: "Updated On", value: `${formatDateTimeIST(new Date())} IST` },
    ],
  }),
});

// --- Notification: distinguish first publish vs re-publish from archive ---
export const buildNotificationPublishedEmail = ({
  recipientName,
  notification,
  recipientRole,
  isRepublish = false,
}) => ({
  subject: isRepublish
    ? `Notification re-published - ${notification.title}`
    : `New notification - ${notification.title}`,
  html: createEmailLayout({
    preheader: isRepublish
      ? `A notification has been re-published for ${recipientRole}.`
      : `A new notification has been published for ${recipientRole}.`,
    eyebrow: "Notification",
    title: notification.title,
    intro: isRepublish
      ? `Hi ${recipientName}, a previously archived notification has been re-published and is visible again on COGNITO.`
      : `Hi ${recipientName}, a new notification has been published for your role on COGNITO.`,
    badge: isRepublish
      ? { text: "Re-published", tone: "warning" }
      : { text: "Published", tone: "info" },
    rows: [
      { label: "Category", value: notification.category || "announcement" },
      {
        label: "Audience",
        value: Array.isArray(notification.targetRoles)
          ? notification.targetRoles.join(", ")
          : recipientRole,
      },
      {
        label: isRepublish ? "Re-published On" : "Published On",
        value: `${formatDateTimeIST(new Date())} IST`,
      },
      {
        label: "Event Date",
        value: notification.eventDate
          ? `${formatDateTimeIST(notification.eventDate)} IST`
          : "Not specified",
      },
      { label: "Link", value: notification.externalLink || "No external link provided" },
    ],
    sections: [
      {
        type: "text",
        title: "Message",
        text: truncate(notification.description, 500),
      },
    ],
  }),
});

// --- Results: generated / re-generated (goes to the creator, not students) ---
export const buildResultsGeneratedEmail = ({
  creatorName,
  examTitle,
  studentCount,
  isRegenerate = false,
}) => ({
  subject: isRegenerate
    ? `Results re-generated - ${examTitle}`
    : `Results generated - ${examTitle}`,
  html: createEmailLayout({
    preheader: isRegenerate
      ? `Results were re-generated for ${examTitle}.`
      : `Results were generated for ${examTitle}.`,
    eyebrow: "Results",
    title: isRegenerate ? "Results re-generated" : "Results generated",
    intro: `Hi ${creatorName}, ${
      isRegenerate ? "results have been re-generated" : "results have been generated"
    } for your exam and are ready for review before publishing.`,
    badge: { text: isRegenerate ? "Re-generated" : "Generated", tone: "info" },
    rows: [
      { label: "Exam Title", value: examTitle },
      { label: "Students Processed", value: String(studentCount) },
      { label: "Status", value: "Pending Review (Not Published)" },
      { label: isRegenerate ? "Re-generated On" : "Generated On", value: `${formatDateTimeIST(new Date())} IST` },
    ],
    sections: [
      {
        type: "list",
        title: "Next steps",
        items: [
          "Review individual student scores.",
          "Publish results when ready for students to view.",
        ],
      },
    ],
  }),
});

// buildResultsPublishedEmail already exists — reused as-is for each student on publish.

export const buildResultsPublishedEmail = ({
  recipientName,
  examTitle,
  totalMarks,
  percentage,
  marksObtained,
  isPassed,
}) => ({
  subject: `Results published - ${examTitle}`,
  html: createEmailLayout({
    preheader: `Your result for ${examTitle} is now available.`,
    eyebrow: "Results",
    title: "Your result is now available",
    intro: `Hi ${recipientName}, the results for your exam have been published and are now visible in COGNITO.`,
    badge: { text: isPassed ? "Passed" : "Published", tone: isPassed ? "success" : "warning" },
    rows: [
      { label: "Exam Title", value: examTitle },
      { label: "Marks Obtained", value: String(marksObtained) },
      { label: "Total Marks", value: String(totalMarks) },
      { label: "Percentage", value: `${Number(percentage || 0).toFixed(2)}%` },
      { label: "Status", value: isPassed ? "Pass" : "Needs Review" },
      { label: "Published On", value: `${formatDateTimeIST(new Date())} IST` },
    ],
  }),
});