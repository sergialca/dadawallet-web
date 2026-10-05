const FALLBACK_PATH = "/dashboard";

export function safeRedirectPath(value: string | null | undefined) {
  if (!value) {
    return FALLBACK_PATH;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return FALLBACK_PATH;
  }

  return value;
}
