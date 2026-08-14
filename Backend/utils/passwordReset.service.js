import bcrypt from "bcryptjs";
import PasswordResetOtp from "../models/PasswordResetOtp.model.js";
import { isMailerConfigured, sendPasswordResetOtpEmail } from "./mailer.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const createOtpValue = () => String(Math.floor(100000 + Math.random() * 900000));

export const requestPasswordResetOtp = async ({
  accountType,
  accountId,
  email,
  name,
  roleLabel,
}) => {
  if (!isMailerConfigured()) {
    throw new Error("SMTP is not configured. Add SMTP settings to send OTP emails.");
  }

  const otp = createOtpValue();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await PasswordResetOtp.updateMany(
    {
      accountType,
      accountId,
      consumedAt: null,
    },
    {
      $set: {
        consumedAt: new Date(),
      },
    }
  );

  await PasswordResetOtp.create({
    accountType,
    accountId,
    email,
    otpHash,
    expiresAt,
  });

  await sendPasswordResetOtpEmail({
    to: email,
    name,
    otp,
    roleLabel,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  });

  return {
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

export const resetPasswordWithOtp = async ({
  accountType,
  email,
  otp,
  newPassword,
  accountModel,
  accountQuery = null,
  passwordField = "password",
}) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const enteredOtp = String(otp || "").trim();
  const password = String(newPassword || "");

  if (!normalizedEmail || !enteredOtp || !password) {
    throw new Error("Email, OTP, and new password are required");
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    );
  }

  const lookupQuery = accountQuery || { email: normalizedEmail };
  const account = await accountModel.findOne(lookupQuery).select(`+${passwordField}`);
  if (!account) {
    throw new Error("Account not found");
  }

  const resetRecord = await PasswordResetOtp.findOne({
    accountType,
    accountId: account._id,
    email: normalizedEmail,
    consumedAt: null,
  }).select("+otpHash");

  if (!resetRecord) {
    throw new Error("No active OTP request found for this email");
  }

  if (resetRecord.expiresAt <= new Date()) {
    resetRecord.consumedAt = new Date();
    await resetRecord.save();
    throw new Error("OTP expired. Please request a new OTP");
  }

  if (resetRecord.attempts >= OTP_MAX_ATTEMPTS) {
    resetRecord.consumedAt = new Date();
    await resetRecord.save();
    throw new Error("Too many incorrect OTP attempts. Please request a new OTP");
  }

  const isMatch = await bcrypt.compare(enteredOtp, resetRecord.otpHash);
  if (!isMatch) {
    resetRecord.attempts += 1;
    await resetRecord.save();
    throw new Error("Invalid OTP");
  }

  account[passwordField] = password;
  await account.save();

  resetRecord.consumedAt = new Date();
  await resetRecord.save();

  return account;
};
