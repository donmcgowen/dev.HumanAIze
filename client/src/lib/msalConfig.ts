import { Configuration, PopupRequest } from "@azure/msal-browser";

const tenantName = import.meta.env.VITE_AZURE_B2C_TENANT_NAME as string;
const clientId = import.meta.env.VITE_AZURE_B2C_CLIENT_ID as string;
const signUpSignInPolicy = import.meta.env.VITE_AZURE_B2C_POLICY_NAME as string;

const authorityBase = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com`;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `${authorityBase}/${signUpSignInPolicy}`,
    knownAuthorities: [`${tenantName}.b2clogin.com`],
    redirectUri: `${window.location.origin}/auth/b2c/callback`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Scopes requested during sign-in
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "email"],
};

// Used to trigger sign-up specifically
export const signUpRequest: PopupRequest = {
  scopes: ["openid", "profile", "email"],
  extraQueryParameters: { option: "signup" },
};

export const b2cEnabled =
  Boolean(tenantName) && Boolean(clientId) && Boolean(signUpSignInPolicy);
