const DEFAULT_API_URL = "https://codesecurex.onrender.com/api";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export function getApiUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
  const baseUrl = rawUrl.replace(/\/+$/, "");
  const apiUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

  if (typeof window === "undefined") return apiUrl;

  try {
    const pageHost = window.location.hostname;
    const configuredHost = new URL(apiUrl).hostname;
    const isDeployedPage = !LOCAL_HOSTS.has(pageHost);
    const isLocalApi = LOCAL_HOSTS.has(configuredHost);

    return isDeployedPage && isLocalApi ? DEFAULT_API_URL : apiUrl;
  } catch {
    return DEFAULT_API_URL;
  }
}
