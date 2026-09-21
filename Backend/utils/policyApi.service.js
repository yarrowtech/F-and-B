const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;
const POLICY_TTL_MS = Number(process.env.POLICY_CACHE_TTL_MS || 5 * 60 * 1000);
const REQUEST_TIMEOUT_MS = 10 * 1000;

export const POLICY_TYPES = {
  "privacy-policy": "PRIVACY_POLICY",
  "terms-and-conditions": "TERMS_AND_CONDITIONS",
};

let tokenCache = null;
let tokenRequest = null;
let policyCache = null;
let policyRequest = null;

export class PolicyApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

// Env is read lazily: server.js calls dotenv.config() after its imports are evaluated.
const getConfig = () => {
  const baseUrl = (process.env.EFNBMMS_POLICY_API_URL || "").replace(/\/$/, "");
  const clientId = process.env.EFNBMMS_POLICY_CLIENT_ID;
  const clientSecret = process.env.EFNBMMS_POLICY_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new PolicyApiError("Policy service is not configured", 503);
  }

  return { baseUrl, clientId, clientSecret };
};

const requestToken = async () => {
  const { baseUrl, clientId, clientSecret } = getConfig();

  const res = await fetch(`${baseUrl}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = await res.json().catch(() => null);
  const token = body?.data?.access_token;

  if (!res.ok || !token) {
    throw new PolicyApiError(`Policy API token request failed (${res.status})`);
  }

  const expiresInMs = Number(body.data.expires_in || 3600) * 1000;
  tokenCache = { token, expiresAt: Date.now() + expiresInMs - TOKEN_REFRESH_MARGIN_MS };
  return token;
};

const getToken = async () => {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;

  tokenRequest ||= requestToken().finally(() => {
    tokenRequest = null;
  });
  return tokenRequest;
};

const fetchPolicyList = async (isRetry = false) => {
  const { baseUrl } = getConfig();
  const token = await getToken();

  const res = await fetch(`${baseUrl}/policies?limit=100`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 401 && !isRetry) {
    tokenCache = null;
    return fetchPolicyList(true);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(body?.data?.items)) {
    throw new PolicyApiError(`Policy API request failed (${res.status})`);
  }

  return body.data.items;
};

const toPublicPolicy = (item) => {
  const version = item.currentVersion || {};

  return {
    type: item.type,
    title: version.title || item.title,
    summary: version.summary || item.description || "",
    versionNumber: version.versionNumber ?? null,
    effectiveDate: version.effectiveDate || item.effectiveDate || null,
    publishedAt: version.publishedAt || item.publishedAt || null,
    updatedAt: item.updatedAt || null,
    content: version.content || "",
  };
};

const loadPolicies = async () => {
  const items = await fetchPolicyList();
  const byType = new Map();

  for (const item of items) {
    if (item.status === "PUBLISHED" && item.currentVersion?.content && !byType.has(item.type)) {
      byType.set(item.type, toPublicPolicy(item));
    }
  }

  policyCache = { byType, expiresAt: Date.now() + POLICY_TTL_MS };
  return policyCache;
};

export const getPolicyByType = async (type) => {
  let cache = policyCache;

  if (!cache || cache.expiresAt <= Date.now()) {
    policyRequest ||= loadPolicies().finally(() => {
      policyRequest = null;
    });

    try {
      cache = await policyRequest;
    } catch (err) {
      // Keep serving the last known copy of a legal document if the upstream is briefly down.
      if (!policyCache) throw err;
      console.error("Policy API refresh failed, serving stale copy:", err.message);
      cache = policyCache;
    }
  }

  return cache.byType.get(type) || null;
};
