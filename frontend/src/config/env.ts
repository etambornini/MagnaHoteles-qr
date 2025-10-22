type ViteEnv = {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEFAULT_HOTEL_SLUG?: string;
};

const rawEnv = import.meta.env as unknown as ViteEnv;

const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
const fallbackBaseUrl = browserOrigin ? `${browserOrigin.replace(/\/$/, "")}/api` : "";
const apiBaseUrl = rawEnv.VITE_API_BASE_URL ?? fallbackBaseUrl;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable");
}

const assetsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

export const env = {
  apiBaseUrl,
  assetsBaseUrl,
  defaultHotelSlug: rawEnv.VITE_DEFAULT_HOTEL_SLUG ?? "",
};
