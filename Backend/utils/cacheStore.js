const maxEntries = Number(process.env.CACHE_MAX_ENTRIES || 500);
const store = new Map();

const now = () => Date.now();

const pruneExpired = () => {
  const currentTime = now();

  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= currentTime) {
      store.delete(key);
    }
  }
};

const pruneOldest = () => {
  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) return;
    store.delete(oldestKey);
  }
};

export const getCacheEntry = (key) => {
  const entry = store.get(key);

  if (!entry) return null;

  if (entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }

  return entry;
};

export const setCacheEntry = (key, entry) => {
  pruneExpired();
  store.set(key, entry);
  pruneOldest();
};

export const invalidateCacheNamespace = (namespace) => {
  for (const key of store.keys()) {
    if (key.startsWith(`${namespace}:`)) {
      store.delete(key);
    }
  }
};

export const invalidateCacheNamespaces = (namespaces = []) => {
  namespaces.forEach(invalidateCacheNamespace);
};

export const clearCache = () => {
  store.clear();
};
