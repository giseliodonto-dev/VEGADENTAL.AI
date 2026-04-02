const FALLBACK_PUBLISHED_ORIGIN = "https://vegadental.com.br";

function normalizeOrigin(url: string) {
  return url.replace(/\/+$/, "");
}

export function getPublicAppOrigin() {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }
  const currentOrigin = window.location.origin;
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.endsWith(".lovableproject.com");
  return isPreviewHost
    ? FALLBACK_PUBLISHED_ORIGIN
    : normalizeOrigin(currentOrigin);
}
const FALLBACK_PUBLISHED_ORIGIN = "https://vegadental-com-br.lovable.app";

function normalizeOrigin(url: string) {
  return url.replace(/\/+$/, "");
}

export function getPublicAppOrigin() {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }
  const currentOrigin = window.location.origin;
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.endsWith(".lovableproject.com") ||
    window.location.hostname.includes("lovable.dev");
  return isPreviewHost
    ? FALLBACK_PUBLISHED_ORIGIN
    : normalizeOrigin(currentOrigin);

const FALLBACK_PUBLISHED_ORIGIN = "https://vegadental-com-br.lovable.app";

function normalizeOrigin(url: string) {
  return url.replace(/\/+$/, "");
}

export function getPublicAppOrigin() {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }
  const currentOrigin = window.location.origin;
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.endsWith(".lovableproject.com") ||
    window.location.hostname.includes("lovable.dev");
  return isPreviewHost
    ? FALLBACK_PUBLISHED_ORIGIN
    : normalizeOrigin(currentOrigin);
}