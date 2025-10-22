const STORAGE_PREFIX = "magna-hoteles";

const withPrefix = (key: string) => `${STORAGE_PREFIX}:${key}`;

const safeWindow = typeof window !== "undefined" ? window : undefined;

export const storage = {
  get<T>(key: string): T | null {
    if (!safeWindow) return null;
    try {
      const value = safeWindow.localStorage.getItem(withPrefix(key));
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("storage.get error", error);
      return null;
    }
  },
  set<T>(key: string, value: T) {
    if (!safeWindow) return;
    safeWindow.localStorage.setItem(withPrefix(key), JSON.stringify(value));
  },
  remove(key: string) {
    if (!safeWindow) return;
    safeWindow.localStorage.removeItem(withPrefix(key));
  },
};
