import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { POLICY_TYPES, PolicyApiError, getPolicyByType } from "../utils/policyApi.service.js";

export const getPolicy = async (req, res) => {
  const type = POLICY_TYPES[req.params.slug];

  if (!type) {
    return errorResponse(res, "Policy not found", 404);
  }

  try {
    const policy = await getPolicyByType(type);

    if (!policy) {
      return errorResponse(res, "Policy not found", 404);
    }

    res.set("Cache-Control", "public, max-age=300");
    return successResponse(res, "Policy fetched", policy);
  } catch (err) {
    console.error("Policy fetch failed:", err.message);
    const status = err instanceof PolicyApiError ? err.status : 502;
    const message =
      status === 503 ? "Policy service is not configured" : "Policy is temporarily unavailable";
    return errorResponse(res, message, status);
  }
};
