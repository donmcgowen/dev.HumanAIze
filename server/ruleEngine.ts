import { and, eq, gte } from "drizzle-orm";
import { getDb } from "./db";
import { foodLogs, glucoseReadings, workoutEntries } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getAzureSqlPool } from "./azureDb";

export interface RuleInsight {
  type: "warning" | "tip" | "success";
  title: string;
  message: string;
  rule: "high_carb_spike" | "morning_workout_stability" | "late_night_fasting";
}

type MealRow = { carbsGrams: number; loggedAt: number };
type ReadingRow = { readingAt: number; mgdl: number };
type WorkoutRow = { recordedAt: number };

async function fetchRuleData(
  userId: number,
  since: number
): Promise<{ meals: MealRow[]; readings: ReadingRow[]; workouts: WorkoutRow[] } | null> {
  const db = await getDb();

  if (!db) {
    if (!ENV.azureSqlConnectionString) return null;
    try {
      const pool = await getAzureSqlPool();
      const [mealResult, glucoseResult, workoutResult] = await Promise.all([
        pool.request().input("userId", userId).input("since", since)
          .query<any>("SELECT [carbsGrams], [loggedAt] FROM [dbo].[food_logs] WHERE [userId] = @userId AND [loggedAt] >= @since"),
        pool.request().input("userId", userId).input("since", since)
          .query<any>("SELECT [readingAt], [mgdl] FROM [dbo].[glucose_readings] WHERE [userId] = @userId AND [readingAt] >= @since ORDER BY [readingAt] ASC"),
        pool.request().input("userId", userId).input("since", since)
          .query<any>("SELECT [recordedAt] FROM [dbo].[workout_entries] WHERE [userId] = @userId AND [recordedAt] >= @since"),
      ]);
      return {
        meals: (mealResult.recordset || []).map((r: any) => ({ carbsGrams: Number(r.carbsGrams) || 0, loggedAt: Number(r.loggedAt) })),
        readings: (glucoseResult.recordset || []).map((r: any) => ({ readingAt: Number(r.readingAt), mgdl: Number(r.mgdl) })),
        workouts: (workoutResult.recordset || []).map((r: any) => ({ recordedAt: Number(r.recordedAt) })),
      };
    } catch (error) {
      console.error("[RuleEngine] Error fetching data (Azure SQL):", error);
      return null;
    }
  }

  const [mealRows, readingRows, workoutRows] = await Promise.all([
    db.select({ carbsGrams: foodLogs.carbsGrams, loggedAt: foodLogs.loggedAt })
      .from(foodLogs).where(and(eq(foodLogs.userId, userId), gte(foodLogs.loggedAt, since))),
    db.select({ readingAt: glucoseReadings.readingAt, mgdl: glucoseReadings.mgdl })
      .from(glucoseReadings).where(and(eq(glucoseReadings.userId, userId), gte(glucoseReadings.readingAt, since))).orderBy(glucoseReadings.readingAt),
    db.select({ recordedAt: workoutEntries.recordedAt })
      .from(workoutEntries).where(and(eq(workoutEntries.userId, userId), gte(workoutEntries.recordedAt, since))),
  ]);

  return { meals: mealRows, readings: readingRows, workouts: workoutRows };
}

// Rule 1: High-carb meals (>60g) followed by glucose spike >180 mg/dL within 2 hours
function detectHighCarbSpikes(meals: MealRow[], readings: ReadingRow[]): RuleInsight | null {
  const HIGH_CARB_G = 60;
  const SPIKE_MGDL = 180;
  const WIN_START = 30 * 60 * 1000;
  const WIN_END = 2 * 60 * 60 * 1000;

  const highCarbMeals = meals.filter((m) => m.carbsGrams > HIGH_CARB_G);
  if (highCarbMeals.length === 0) return null;

  let mealsWithReadings = 0;
  let spikesCount = 0;

  for (const meal of highCarbMeals) {
    const window = readings.filter((r) => r.readingAt >= meal.loggedAt + WIN_START && r.readingAt <= meal.loggedAt + WIN_END);
    if (window.length === 0) continue;
    mealsWithReadings++;
    if (Math.max(...window.map((r) => r.mgdl)) > SPIKE_MGDL) spikesCount++;
  }

  if (mealsWithReadings === 0) return null;

  if (spikesCount > 0) {
    return {
      type: "warning",
      title: "High-Carb Meals Spiking Glucose",
      message: `${spikesCount} of ${mealsWithReadings} high-carb meals (>60g) triggered a glucose spike above 180 mg/dL within 2 hours. Try splitting carbs into smaller portions or pairing with protein and fiber.`,
      rule: "high_carb_spike",
    };
  }

  return {
    type: "success",
    title: "Managing High-Carb Meals Well",
    message: `Your high-carb meals (>60g) haven't triggered spikes above 180 mg/dL in the last 14 days. Keep pairing carbs with protein and fiber to maintain this.`,
    rule: "high_carb_spike",
  };
}

// Rule 2: Days with morning workouts (5am–10am) have lower glucose variance
function assessMorningWorkoutStability(workouts: WorkoutRow[], readings: ReadingRow[]): RuleInsight | null {
  const hourOf = (ts: number) => Math.floor((ts % 86400000) / 3600000);
  const dayOf = (ts: number) => Math.floor(ts / 86400000);

  const morningWorkoutDays = new Set(
    workouts.filter((w) => { const h = hourOf(w.recordedAt); return h >= 5 && h < 10; }).map((w) => dayOf(w.recordedAt))
  );

  if (morningWorkoutDays.size === 0) return null;

  const glucoseByDay: Record<number, number[]> = {};
  for (const r of readings) {
    const d = dayOf(r.readingAt);
    if (!glucoseByDay[d]) glucoseByDay[d] = [];
    glucoseByDay[d].push(r.mgdl);
  }

  const workoutVariances: number[] = [];
  const restVariances: number[] = [];

  for (const [dayStr, vals] of Object.entries(glucoseByDay)) {
    if (vals.length < 2) continue;
    const variance = Math.max(...vals) - Math.min(...vals);
    (morningWorkoutDays.has(Number(dayStr)) ? workoutVariances : restVariances).push(variance);
  }

  if (workoutVariances.length === 0 || restVariances.length === 0) return null;

  const avgWorkout = workoutVariances.reduce((a, b) => a + b, 0) / workoutVariances.length;
  const avgRest = restVariances.reduce((a, b) => a + b, 0) / restVariances.length;

  if (avgWorkout < avgRest * 0.85) {
    const pct = Math.round(((avgRest - avgWorkout) / avgRest) * 100);
    return {
      type: "success",
      title: "Morning Workouts Stabilize Your Glucose",
      message: `Your glucose variation is ${pct}% lower on days with a morning workout compared to rest days. Keep scheduling exercise before 10 AM for best results.`,
      rule: "morning_workout_stability",
    };
  }

  return null;
}

// Rule 3: Late-night eating (after 8pm) correlates with higher next-morning fasting glucose
function assessLateNightFasting(meals: MealRow[], readings: ReadingRow[]): RuleInsight | null {
  const hourOf = (ts: number) => Math.floor((ts % 86400000) / 3600000);
  const dayOf = (ts: number) => Math.floor(ts / 86400000);

  const lateNightMealDays = new Set(
    meals.filter((m) => hourOf(m.loggedAt) >= 20).map((m) => dayOf(m.loggedAt))
  );

  if (lateNightMealDays.size === 0) return null;

  const fastingByDay: Record<number, number> = {};
  for (const r of readings) {
    const h = hourOf(r.readingAt);
    if (h >= 5 && h < 9) {
      const d = dayOf(r.readingAt);
      if (!(d in fastingByDay)) fastingByDay[d] = r.mgdl;
    }
  }

  const fastingDays = Object.keys(fastingByDay).map(Number);
  if (fastingDays.length < 3) return null;

  const afterLateNight: number[] = [];
  const afterNormal: number[] = [];

  for (const day of fastingDays) {
    (lateNightMealDays.has(day - 1) ? afterLateNight : afterNormal).push(fastingByDay[day]);
  }

  if (afterLateNight.length === 0 || afterNormal.length === 0) return null;

  const avgLate = afterLateNight.reduce((a, b) => a + b, 0) / afterLateNight.length;
  const avgNormal = afterNormal.reduce((a, b) => a + b, 0) / afterNormal.length;

  if (avgLate > avgNormal + 10) {
    const diff = Math.round(avgLate - avgNormal);
    return {
      type: "warning",
      title: "Late-Night Eating Raises Fasting Glucose",
      message: `Your fasting glucose is ${diff} mg/dL higher after late-night meals (after 8 PM). Try finishing eating by 8 PM for better overnight glucose control.`,
      rule: "late_night_fasting",
    };
  }

  return null;
}

export async function computeRuleInsights(userId: number, days: number = 14): Promise<RuleInsight[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const data = await fetchRuleData(userId, since);
  if (!data) return [];

  const { meals, readings, workouts } = data;

  return [
    detectHighCarbSpikes(meals, readings),
    assessMorningWorkoutStability(workouts, readings),
    assessLateNightFasting(meals, readings),
  ].filter((i): i is RuleInsight => i !== null);
}
