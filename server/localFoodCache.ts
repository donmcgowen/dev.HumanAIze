import { promises as fs } from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), ".food-cache.json");
const CACHE_TTL_DAYS = 90;

interface CachedFoodEntry {
  name: string;
  description: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize?: string;
}

interface CacheRecord {
  query: string;
  results: CachedFoodEntry[];
  cachedAt: number; // unix ms
  expiresAt: number; // unix ms
}

type CacheStore = Record<string, CacheRecord>;

async function readCache(): Promise<CacheStore> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

async function writeCache(store: CacheStore): Promise<void> {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[LocalFoodCache] Failed to write cache:", err);
  }
}

export async function getLocalCachedFood(query: string): Promise<CachedFoodEntry[] | null> {
  const store = await readCache();
  const key = query.toLowerCase().trim();
  const record = store[key];
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    // Expired — remove it
    delete store[key];
    await writeCache(store);
    return null;
  }
  console.log(`[LocalFoodCache] Cache hit for "${query}" (${record.results.length} results)`);
  return record.results;
}

export async function saveLocalCachedFood(query: string, results: CachedFoodEntry[]): Promise<void> {
  const store = await readCache();
  const key = query.toLowerCase().trim();
  const now = Date.now();
  store[key] = {
    query: key,
    results,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
  await writeCache(store);
  console.log(`[LocalFoodCache] Saved ${results.length} results for "${query}"`);
}

export async function clearLocalCachedFood(query: string): Promise<void> {
  const store = await readCache();
  delete store[query.toLowerCase().trim()];
  await writeCache(store);
}
