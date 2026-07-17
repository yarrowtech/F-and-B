import nodemailer from "nodemailer";

let transporter;

const getMailerConfig = () => {
  const smtpHost = String(process.env.SMTP_HOST || "").trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure =
    String(process.env.SMTP_SECURE || "false").trim() === "true";
  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").trim();
  const mailFrom = String(
    process.env.MAIL_FROM || process.env.FROM_EMAIL || smtpUser || ""
  ).trim();

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    mailFrom,
  };
};

const isMailerConfigured = () => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, mailFrom } = getMailerConfig();
  return Boolean(smtpHost && smtpPort && smtpUser && smtpPass && mailFrom);
};

const getTransporter = () => {
  if (!isMailerConfigured()) {
    throw new Error("SMTP is not fully configured");
  }

  if (!transporter) {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } =
      getMailerConfig();
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return transporter;
};

export const sendVendorInvitationEmail = async ({
  to,
  vendorName,
  vendorId,
  invitationLink,
  expiresAt,
}) => {
  const email = String(to || "").trim();
  if (!email) {
    throw new Error("Recipient email is required");
  }

  const transport = getTransporter();
  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleString("en-IN", { hour12: true })
    : "the next few days";
  const greetingName = vendorName || "Vendor";

  const subject = "Complete your vendor account setup";
  const text = [
    "Vendor account invitation",
    "",
    `Hello ${greetingName},`,
    "",
    vendorId
      ? `Your vendor account has been created with ID ${vendorId}.`
      : "Your vendor account has been created.",
    "",
    "Click the button below to complete your setup and create your password:",
    invitationLink,
    "",
    `This link will expire on ${expiryText}.`,
    "",
    "If you did not expect this invitation, please ignore this email.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="margin:0; padding:36px 18px; background:#f3f7f4; font-family:Arial,Helvetica,sans-serif; color:#111827;">
      <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #dfe7e2; border-radius:24px; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#f3fbf5 0%,#ffffff 52%,#ecfdf3 100%); padding:28px 32px 22px; border-bottom:1px solid #e5e7eb;">
          <div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#ecfdf3; color:#169c52; font-size:12px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
            Vendor Invitation
          </div>
          <h1 style="margin:18px 0 10px; font-size:38px; line-height:1.08; font-weight:800; color:#111827;">
            Complete your vendor account setup
          </h1>
          <p style="margin:0; max-width:620px; font-size:16px; line-height:1.7; color:#4b5563;">
            Your account is ready. Finish setup, create your password, and start using the vendor portal.
          </p>
        </div>

        <div style="padding:30px 32px 36px;">
          <p style="margin:0 0 18px; font-size:18px; font-weight:700; color:#111827;">
            Hello ${greetingName},
          </p>

          <div style="margin:0 0 24px; font-size:17px; line-height:1.8; color:#1f2937;">
            <p style="margin:0 0 14px;">
              ${
                vendorId
                  ? `Your vendor account has been created with ID <strong style="color:#111827;">${vendorId}</strong>.`
                  : "Your vendor account has been created successfully."
              }
            </p>
            <p style="margin:0;">
              Click the button below to complete your setup and create your password.
            </p>
          </div>

          <div style="margin:0 0 26px;">
            <a
              href="${invitationLink}"
              style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:18px 30px; border-radius:14px; font-size:16px; font-weight:800; box-shadow:0 10px 18px rgba(22,163,74,0.22);"
            >
              Complete Vendor Setup
            </a>
          </div>

          <div style="margin:0 0 22px; border:1px solid #e5e7eb; border-radius:18px; background:#f8faf9; overflow:hidden;">
            <div style="padding:14px 18px; border-bottom:1px solid #e5e7eb; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#6b7280;">
              Setup Link
            </div>
            <div style="padding:16px 18px; font-size:14px; line-height:1.8; color:#334155; word-break:break-all;">
              ${invitationLink}
            </div>
          </div>

          <div style="margin:0 0 22px; padding:16px 18px; border-radius:16px; background:#fffdf2; border:1px solid #f5e7a7;">
            <p style="margin:0; font-size:14px; line-height:1.7; color:#7c5e10;">
              This link will expire on <strong style="color:#5b4307;">${expiryText}</strong>.
            </p>
          </div>

          <p style="margin:0; font-size:14px; line-height:1.7; color:#6b7280;">
            If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
  const { mailFrom } = getMailerConfig();

  return transport.sendMail({
    from: mailFrom,
    to: email,
    subject,
    text,
    html,
  });
};

export { isMailerConfigured };
