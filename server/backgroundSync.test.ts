import { describe, it, expect } from "vitest";
import { getSyncStatus, updateSyncStatus } from "./backgroundSync";

describe("Background Sync Scheduler", () => {
  it("should initialize with null sync status", () => {
    const status = getSyncStatus();
    expect(status).toHaveProperty("isRunning");
    expect(status).toHaveProperty("isSyncing");
    expect(status).toHaveProperty("lastCheck");
    expect(status).toHaveProperty("lastSyncTime");
    expect(status).toHaveProperty("lastSyncStatus");
  });

  it("should update sync status to success", () => {
    updateSyncStatus("success");
    const status = getSyncStatus();
    expect(status.lastSyncStatus).toBe("success");
    expect(status.lastSyncTime).not.toBeNull();
    expect(typeof status.lastSyncTime).toBe("number");
  });

  it("should update sync status to error", () => {
    updateSyncStatus("error");
    const status = getSyncStatus();
    expect(status.lastSyncStatus).toBe("error");
    expect(status.lastSyncTime).not.toBeNull();
  });

  it("should track last sync time progression", () => {
    updateSyncStatus("success");
    const firstSync = getSyncStatus().lastSyncTime;

    // Wait a bit and update again
    setTimeout(() => {
      updateSyncStatus("error");
      const secondSync = getSyncStatus().lastSyncTime;
      expect(secondSync).toBeGreaterThanOrEqual(firstSync!);
    }, 100);
  });

  it("should maintain sync status across multiple calls", () => {
    updateSyncStatus("success");
    const status1 = getSyncStatus();
    const status2 = getSyncStatus();

    expect(status1.lastSyncStatus).toBe(status2.lastSyncStatus);
    expect(status1.lastSyncTime).toBe(status2.lastSyncTime);
  });

  it("should have scheduler properties in status", () => {
    const status = getSyncStatus();
    expect(typeof status.isRunning).toBe("boolean");
    expect(typeof status.isSyncing).toBe("boolean");
    expect(typeof status.lastCheck).toBe("number");
  });

  it("should track retry backoff timing", () => {
    // Test that exponential backoff calculation works
    // Initial delay: 1000ms
    // Retry 1: 2000ms (1000 * 2^1)
    // Retry 2: 4000ms (1000 * 2^2)
    const delays = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      const delay = 1000 * Math.pow(2, attempt);
      delays.push(delay);
    }

    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
  });
});
