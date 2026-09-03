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

export const sendAdminAccountCredentialsEmail = async ({
  to,
  businessName,
  adminId,
  password,
  planName,
}) => {
  const email = String(to || "").trim();
  if (!email) {
    throw new Error("Recipient email is required");
  }

  const transport = getTransporter();
  const greetingName = businessName || "Admin";
  const subject = "Your admin account is ready";
  const text = [
    "Admin account created successfully",
    "",
    `Hello ${greetingName},`,
    "",
    "Your admin account has been created successfully.",
    `Admin Login ID: ${adminId || "N/A"}`,
    `Password: ${password || "N/A"}`,
    planName ? `Subscription Plan: ${planName}` : "",
    "",
    "You can now log in and start using your admin panel.",
    "",
    "Please change your password after your first login.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="margin:0; padding:36px 18px; background:#f3f7f4; font-family:Arial,Helvetica,sans-serif; color:#111827;">
      <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #dfe7e2; border-radius:24px; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#f3fbf5 0%,#ffffff 52%,#ecfdf3 100%); padding:28px 32px 22px; border-bottom:1px solid #e5e7eb;">
          <div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#ecfdf3; color:#169c52; font-size:12px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
            Admin Signup
          </div>
          <h1 style="margin:18px 0 10px; font-size:38px; line-height:1.08; font-weight:800; color:#111827;">
            Your admin account is ready
          </h1>
          <p style="margin:0; max-width:620px; font-size:16px; line-height:1.7; color:#4b5563;">
            Your restaurant admin account has been created successfully. Use the credentials below to log in.
          </p>
        </div>

        <div style="padding:30px 32px 36px;">
          <p style="margin:0 0 18px; font-size:18px; font-weight:700; color:#111827;">
            Hello ${greetingName},
          </p>

          <div style="margin:0 0 22px; border:1px solid #e5e7eb; border-radius:18px; background:#f8faf9; overflow:hidden;">
            <div style="padding:14px 18px; border-bottom:1px solid #e5e7eb; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#6b7280;">
              Login Credentials
            </div>
            <div style="padding:18px;">
              <p style="margin:0 0 10px; font-size:15px; color:#1f2937;"><strong>Admin Login ID:</strong> ${adminId || "N/A"}</p>
              <p style="margin:0 0 10px; font-size:15px; color:#1f2937;"><strong>Password:</strong> ${password || "N/A"}</p>
              ${
                planName
                  ? `<p style="margin:0; font-size:15px; color:#1f2937;"><strong>Subscription Plan:</strong> ${planName}</p>`
                  : ""
              }
            </div>
          </div>

          <div style="padding:16px 18px; border-radius:16px; background:#fffdf2; border:1px solid #f5e7a7;">
            <p style="margin:0; font-size:14px; line-height:1.7; color:#7c5e10;">
              Please change your password after your first login for better security.
            </p>
          </div>
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

export const sendVendorAccountCredentialsEmail = async ({
  to,
  vendorName,
  vendorId,
  password,
}) => {
  const email = String(to || "").trim();
  if (!email) {
    throw new Error("Recipient email is required");
  }

  const transport = getTransporter();
  const greetingName = vendorName || "Vendor";
  const subject = "Your global vendor account is ready";
  const text = [
    "Global vendor account created successfully",
    "",
    `Hello ${greetingName},`,
    "",
    "Your global vendor account has been created successfully.",
    `Vendor Login ID: ${vendorId || "N/A"}`,
    `Password: ${password || "N/A"}`,
    "",
    "You can now log in and start using your vendor dashboard.",
    "",
    "Please change your password after your first login.",
  ].join("\n");

  const html = `
    <div style="margin:0; padding:36px 18px; background:#f3f7f4; font-family:Arial,Helvetica,sans-serif; color:#111827;">
      <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #dfe7e2; border-radius:24px; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#f3fbf5 0%,#ffffff 52%,#ecfdf3 100%); padding:28px 32px 22px; border-bottom:1px solid #e5e7eb;">
          <div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#ecfdf3; color:#169c52; font-size:12px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
            Global Vendor Signup
          </div>
          <h1 style="margin:18px 0 10px; font-size:38px; line-height:1.08; font-weight:800; color:#111827;">
            Your global vendor account is ready
          </h1>
          <p style="margin:0; max-width:620px; font-size:16px; line-height:1.7; color:#4b5563;">
            Your account has been created successfully. Use the credentials below to log in.
          </p>
        </div>

        <div style="padding:30px 32px 36px;">
          <p style="margin:0 0 18px; font-size:18px; font-weight:700; color:#111827;">
            Hello ${greetingName},
          </p>

          <div style="margin:0 0 22px; border:1px solid #e5e7eb; border-radius:18px; background:#f8faf9; overflow:hidden;">
            <div style="padding:14px 18px; border-bottom:1px solid #e5e7eb; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#6b7280;">
              Login Credentials
            </div>
            <div style="padding:18px;">
              <p style="margin:0 0 10px; font-size:15px; color:#1f2937;"><strong>Vendor Login ID:</strong> ${vendorId || "N/A"}</p>
              <p style="margin:0; font-size:15px; color:#1f2937;"><strong>Password:</strong> ${password || "N/A"}</p>
            </div>
          </div>

          <div style="padding:16px 18px; border-radius:16px; background:#fffdf2; border:1px solid #f5e7a7;">
            <p style="margin:0; font-size:14px; line-height:1.7; color:#7c5e10;">
              Please change your password after your first login for better security.
            </p>
          </div>
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

export const sendPasswordResetOtpEmail = async ({
  to,
  name,
  otp,
  roleLabel,
  expiresInMinutes = 10,
}) => {
  const email = String(to || "").trim();
  if (!email) {
    throw new Error("Recipient email is required");
  }

  const transport = getTransporter();
  const greetingName = name || roleLabel || "User";
  const subject = `${roleLabel || "Account"} password reset OTP`;
  const text = [
    "Password reset OTP",
    "",
    `Hello ${greetingName},`,
    "",
    `Your OTP for password reset is: ${otp}`,
    `This OTP will expire in ${expiresInMinutes} minutes.`,
    "",
    "If you did not request a password reset, please ignore this email.",
  ].join("\n");

  const html = `
    <div style="margin:0; padding:36px 18px; background:#f3f7f4; font-family:Arial,Helvetica,sans-serif; color:#111827;">
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #dfe7e2; border-radius:24px; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#f3fbf5 0%,#ffffff 52%,#ecfdf3 100%); padding:28px 32px 22px; border-bottom:1px solid #e5e7eb;">
          <div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#ecfdf3; color:#169c52; font-size:12px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
            Password Reset
          </div>
          <h1 style="margin:18px 0 10px; font-size:34px; line-height:1.08; font-weight:800; color:#111827;">
            Use this OTP to reset your password
          </h1>
          <p style="margin:0; max-width:560px; font-size:16px; line-height:1.7; color:#4b5563;">
            Enter the OTP below on the reset screen to set a new password for your ${roleLabel || "account"}.
          </p>
        </div>

        <div style="padding:30px 32px 36px;">
          <p style="margin:0 0 18px; font-size:18px; font-weight:700; color:#111827;">
            Hello ${greetingName},
          </p>

          <div style="margin:0 0 24px; padding:22px; border-radius:20px; background:#f8faf9; border:1px solid #e5e7eb; text-align:center;">
            <p style="margin:0 0 10px; font-size:12px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:#6b7280;">
              One Time Password
            </p>
            <p style="margin:0; font-size:36px; font-weight:900; letter-spacing:0.22em; color:#111827;">
              ${otp}
            </p>
          </div>

          <div style="padding:16px 18px; border-radius:16px; background:#fffdf2; border:1px solid #f5e7a7;">
            <p style="margin:0; font-size:14px; line-height:1.7; color:#7c5e10;">
              This OTP will expire in <strong style="color:#5b4307;">${expiresInMinutes} minutes</strong>.
            </p>
          </div>

          <p style="margin:22px 0 0; font-size:14px; line-height:1.7; color:#6b7280;">
            If you did not request a password reset, please ignore this email.
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

export const sendVendorOrderBillEmail = async ({
  to,
  vendorName,
  order,
  billSummary,
  publicBillUrl = "",
  isOrderSheet = false,
}) => {
  const email = String(to || "").trim();
  if (!email) {
    throw new Error("Recipient email is required");
  }

  const transport = getTransporter();
  const greetingName = vendorName || "Vendor";
  const restaurantName = String(order?.restaurant?.name || "Restaurant").trim();
  const orderNo = String(order?.orderNo || "N/A").trim();
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", { hour12: true })
    : "N/A";
  const items = Array.isArray(order?.items) ? order.items : [];
  const totalAmount = Number(billSummary?.totalAmount || order?.totalAmount || 0).toFixed(2);
  const itemsText = items
    .map((item, index) => {
      const quantity = Number(item?.quantity || 0);
      const price = Number(item?.price || 0).toFixed(2);
      const lineTotal = Number(item?.lineTotal || quantity * Number(item?.price || 0)).toFixed(2);
      const unit = String(item?.unit || "").trim();
      return isOrderSheet
        ? `${index + 1}. ${item?.name || "Item"}${unit ? ` (${unit})` : ""} x ${quantity}`
        : `${index + 1}. ${item?.name || "Item"}${unit ? ` (${unit})` : ""} x ${quantity} @ Rs.${price} = Rs.${lineTotal}`;
    })
    .join("\n");

  const documentLabel = isOrderSheet ? "order sheet" : "vendor order bill";
  const subject = `${isOrderSheet ? "Vendor Order Sheet" : "Vendor Order Bill"} ${orderNo}`;
  const text = [
    documentLabel,
    "",
    `Hello ${greetingName},`,
    "",
    `${restaurantName} has placed an order for you.`,
    `Order No: ${orderNo}`,
    `Order Date: ${orderDate}`,
    "",
    "Items:",
    itemsText || "No items",
    "",
    !isOrderSheet ? `Grand Total: Rs.${totalAmount}` : "",
    publicBillUrl ? "" : "",
    !isOrderSheet && publicBillUrl ? `Bill PDF: ${publicBillUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const itemRows = items
    .map((item, index) => {
      const quantity = Number(item?.quantity || 0);
      const price = Number(item?.price || 0).toFixed(2);
      const lineTotal = Number(item?.lineTotal || quantity * Number(item?.price || 0)).toFixed(2);
      return `
        <tr>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827;">${index + 1}</td>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827;">${item?.name || "Item"}</td>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#4b5563;">${item?.unit || "-"}</td>
          <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827; text-align:right;">${quantity}</td>
          ${isOrderSheet ? "" : `<td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827; text-align:right;">Rs.${price}</td><td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:14px; color:#111827; text-align:right;">Rs.${lineTotal}</td>`}
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="margin:0; padding:36px 18px; background:#f3f7f4; font-family:Arial,Helvetica,sans-serif; color:#111827;">
      <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #dfe7e2; border-radius:24px; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.08);">
        <div style="background:linear-gradient(135deg,#f3fbf5 0%,#ffffff 52%,#ecfdf3 100%); padding:28px 32px 22px; border-bottom:1px solid #e5e7eb;">
          <div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#ecfdf3; color:#169c52; font-size:12px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;">
            ${isOrderSheet ? "Vendor Order Sheet" : "Vendor Order Bill"}
          </div>
          <h1 style="margin:18px 0 10px; font-size:34px; line-height:1.08; font-weight:800; color:#111827;">
            New order from ${restaurantName}
          </h1>
          <p style="margin:0; max-width:620px; font-size:16px; line-height:1.7; color:#4b5563;">
            ${isOrderSheet ? "Order details are below." : `Order bill details are below${publicBillUrl ? ", and the PDF bill link is included at the bottom." : "."}`}
          </p>
        </div>

        <div style="padding:30px 32px 36px;">
          <p style="margin:0 0 18px; font-size:18px; font-weight:700; color:#111827;">
            Hello ${greetingName},
          </p>

          <div style="margin:0 0 22px; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
            <div style="padding:16px 18px; border-radius:18px; background:#f8faf9; border:1px solid #e5e7eb;">
              <p style="margin:0 0 6px; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#6b7280;">Order No</p>
              <p style="margin:0; font-size:16px; font-weight:700; color:#111827;">${orderNo}</p>
            </div>
            <div style="padding:16px 18px; border-radius:18px; background:#f8faf9; border:1px solid #e5e7eb;">
              <p style="margin:0 0 6px; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#6b7280;">Order Date</p>
              <p style="margin:0; font-size:16px; font-weight:700; color:#111827;">${orderDate}</p>
            </div>
            ${isOrderSheet ? "" : `<div style="padding:16px 18px; border-radius:18px; background:#ecfdf3; border:1px solid #bbf7d0;">
              <p style="margin:0 0 6px; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#15803d;">Grand Total</p>
              <p style="margin:0; font-size:18px; font-weight:800; color:#166534;">Rs.${totalAmount}</p>
            </div>`}
          </div>

          <div style="margin:0 0 24px; border:1px solid #e5e7eb; border-radius:20px; overflow:hidden;">
            <table style="width:100%; border-collapse:collapse;">
              <thead style="background:#f8fafc;">
                <tr>
                  <th style="padding:12px 14px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">#</th>
                  <th style="padding:12px 14px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Item</th>
                  <th style="padding:12px 14px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Unit</th>
                  <th style="padding:12px 14px; text-align:right; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Qty</th>
                  ${isOrderSheet ? "" : `<th style="padding:12px 14px; text-align:right; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Price</th><th style="padding:12px 14px; text-align:right; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b;">Total</th>`}
                </tr>
              </thead>
              <tbody>
                ${itemRows || `
                  <tr>
                    <td colspan="6" style="padding:18px; text-align:center; font-size:14px; color:#6b7280;">No items found</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>

          ${
            !isOrderSheet && publicBillUrl
              ? `
                <div style="margin:0 0 20px;">
                  <a
                    href="${publicBillUrl}"
                    style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:16px 24px; border-radius:14px; font-size:15px; font-weight:800; box-shadow:0 10px 18px rgba(22,163,74,0.22);"
                  >
                    Open Bill PDF
                  </a>
                </div>
                <p style="margin:0; font-size:13px; line-height:1.7; color:#6b7280; word-break:break-all;">
            ${publicBillUrl}
                </p>
              `
              : `
                <p style="margin:0; font-size:14px; line-height:1.7; color:#6b7280;">
                  Bill details are included in this email.
                </p>
              `
          }
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
