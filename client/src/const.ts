export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the OAuth flow through the backend so the server can generate the correct redirect URI.
export const getLoginUrl = () => "/api/oauth/start";
