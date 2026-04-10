#!/usr/bin/env node
/**
 * Cleanup script to remove unwanted pre-configured sources from all users
 * Keeps only: Dexcom (provider), custom_app, and user-created custom sources
 * Deletes: Fitbit, Oura, Apple Health, Google Fit, Glooko, MyFitnessPal, Cronometer
 */

import { drizzle } from "drizzle-orm/mysql2";
import { inArray } from "drizzle-orm";
import {
  healthSources,
  glucoseReadings,
  activitySamples,
  sleepSessions,
  nutritionLogs,
  syncJobs,
} from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const providersToDelete = [
  "fitbit",
  "oura",
  "apple_health",
  "google_fit",
  "glooko",
  "myfitnesspal",
  "cronometer",
];

async function cleanup() {
  console.log("🧹 Starting cleanup of unwanted sources...");
  console.log(`Providers to delete: ${providersToDelete.join(", ")}`);

  try {
    // First, get all source IDs to delete
    const sourcesToDelete = await db
      .select({ id: healthSources.id })
      .from(healthSources)
      .where(inArray(healthSources.provider, providersToDelete));

    const sourceIds = sourcesToDelete.map((s) => s.id);
    console.log(`Found ${sourceIds.length} sources to delete`);

    if (sourceIds.length === 0) {
      console.log("✅ No unwanted sources found. Nothing to cleanup.");
      return;
    }

    // Delete related data in order (respecting foreign key constraints)
    console.log("Deleting related data...");

    const glucoseCount = await db
      .delete(glucoseReadings)
      .where(inArray(glucoseReadings.sourceId, sourceIds));
    console.log(`  - Deleted ${glucoseCount.rowsAffected || 0} glucose readings`);

    const activityCount = await db
      .delete(activitySamples)
      .where(inArray(activitySamples.sourceId, sourceIds));
    console.log(`  - Deleted ${activityCount.rowsAffected || 0} activity samples`);

    const sleepCount = await db
      .delete(sleepSessions)
      .where(inArray(sleepSessions.sourceId, sourceIds));
    console.log(`  - Deleted ${sleepCount.rowsAffected || 0} sleep sessions`);

    const nutritionCount = await db
      .delete(nutritionLogs)
      .where(inArray(nutritionLogs.sourceId, sourceIds));
    console.log(`  - Deleted ${nutritionCount.rowsAffected || 0} nutrition logs`);

    const syncCount = await db
      .delete(syncJobs)
      .where(inArray(syncJobs.sourceId, sourceIds));
    console.log(`  - Deleted ${syncCount.rowsAffected || 0} sync jobs`);

    // Finally, delete the sources themselves
    const sourcesCount = await db
      .delete(healthSources)
      .where(inArray(healthSources.id, sourceIds));
    console.log(`  - Deleted ${sourcesCount.rowsAffected || 0} sources`);

    console.log("✅ Cleanup complete!");
    console.log("📝 Remaining sources: Dexcom (provider) and custom_app only");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
