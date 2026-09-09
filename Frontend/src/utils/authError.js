/* =========================================================
   AUTH ERROR PARSER
   Turns an axios error from a login/signup request into a
   friendly message and, when possible, the field it belongs
   to ("id" | "password" | null).
========================================================= */

export const parseAuthError = (err) => {
  // 1. Request never reached the server
  const noResponse = !err?.response;
  if (
    noResponse &&
    (err?.message === "Network Error" ||
      err?.message === "Failed to fetch" ||
      err?.name === "TypeError")
  ) {
    return {
      field: null,
      message:
        "Can't reach the server. Check your internet connection and try again.",
    };
  }
  if (err?.code === "ECONNABORTED" || /timeout/i.test(err?.message || "")) {
    return {
      field: null,
      message: "The server took too long to respond. Please try again.",
    };
  }

  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const code = data.code;
  const serverMsg = typeof data.message === "string" ? data.message : "";

  // 2. Explicit codes from the backend
  switch (code) {
    case "MISSING_CREDENTIALS":
      return { field: null, message: serverMsg || "Enter both your login ID and password." };
    case "ACCOUNT_NOT_FOUND":
      return { field: "id", message: serverMsg || "No account found with that ID." };
    case "INVALID_PASSWORD":
      return { field: "password", message: serverMsg || "Incorrect password." };
    case "ACCOUNT_LOCKED":
      return {
        field: "password",
        message: serverMsg || "Too many failed attempts. Try again in a few minutes.",
      };
    case "ACCOUNT_INACTIVE":
      return {
        field: "id",
        message: serverMsg || "This account is inactive. Contact your administrator.",
      };
    case "VENDOR_LOGIN_DISABLED":
      return {
        field: "id",
        message:
          serverMsg ||
          "This vendor profile is managed by an admin and cannot sign in here.",
      };
    case "SETUP_PENDING":
      return {
        field: null,
        message:
          serverMsg ||
          "Account setup is not finished. Open your invitation email to complete it.",
      };
    case "NO_RESTAURANT":
      return {
        field: null,
        message:
          serverMsg ||
          "Your account isn't linked to a restaurant yet. Contact your administrator.",
      };
    default:
      break;
  }

  // 3. Fall back to HTTP status
  if (status === 400)
    return { field: null, message: serverMsg || "Please check the details you entered." };
  if (status === 401)
    return {
      field: "password",
      message: serverMsg || "The ID or password you entered is incorrect.",
    };
  if (status === 403)
    return { field: null, message: serverMsg || "You don't have access to sign in here." };
  if (status === 404)
    return { field: "id", message: serverMsg || "No account found with that ID." };
  if (status === 429)
    return {
      field: null,
      message: serverMsg || "Too many attempts. Please wait a minute and try again.",
    };
  if (status >= 500)
    return { field: null, message: "Server error. Please try again in a moment." };

  return {
    field: null,
    message: serverMsg || err?.message || "Login failed. Please try again.",
  };
};
