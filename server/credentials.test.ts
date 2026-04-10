import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dexcomAuth module BEFORE importing credentials
vi.mock("./dexcomAuth", () => ({
  authenticateDexcom: vi.fn(),
  verifyDexcomToken: vi.fn(),
}));

import { testSourceCredentials } from "./credentials";

describe("Credentials - Source Key Normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should recognize 'Dexcom CGM' as dexcom source", async () => {
    const { authenticateDexcom, verifyDexcomToken } = await import("./dexcomAuth");
    
    // Mock successful authentication and verification
    vi.mocked(authenticateDexcom).mockResolvedValueOnce({
      access_token: "test-token",
      refresh_token: "test-refresh",
      expires_in: 3600,
      token_type: "Bearer",
    });
    vi.mocked(verifyDexcomToken).mockResolvedValueOnce(true);

    const result = await testSourceCredentials("Dexcom CGM", {
      username: "test@example.com",
      password: "testpassword",
    });

    expect(result).toBe(true);
    expect(vi.mocked(authenticateDexcom)).toHaveBeenCalledWith("test@example.com", "testpassword");
    expect(vi.mocked(verifyDexcomToken)).toHaveBeenCalledWith("test-token");
  });

  it("should reject Dexcom without username", async () => {
    const result = await testSourceCredentials("Dexcom CGM", {
      password: "testpassword",
    });

    expect(result).toBe(false);
  });

  it("should reject Dexcom without password", async () => {
    const result = await testSourceCredentials("Dexcom CGM", {
      username: "test@example.com",
    });

    expect(result).toBe(false);
  });

  it("should handle authentication failure gracefully", async () => {
    const { authenticateDexcom } = await import("./dexcomAuth");
    
    vi.mocked(authenticateDexcom).mockRejectedValueOnce(
      new Error("Invalid credentials")
    );
    vi.mocked(authenticateDexcom).mockClear();

    const result = await testSourceCredentials("Dexcom CGM", {
      username: "invalid@example.com",
      password: "wrongpassword",
    });

    expect(result).toBe(false);
  });
});
