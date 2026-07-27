/** API base URL. In dev/docker set via VITE_API_URL. */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:4000";

export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
