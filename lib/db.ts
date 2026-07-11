import fs from "fs";
import path from "path";
import type { DB } from "./types";
import { buildSeed } from "./seed";

// Storage backends, in order of preference:
// 1. Upstash Redis (Vercel deployment) — set UPSTASH_REDIS_REST_URL/_TOKEN
//    (or the KV_REST_API_* names Vercel's marketplace integration creates).
// 2. Local JSON file at data/db.json (development on your own machine).
// 3. In-memory (read-only hosts without Redis; data resets between restarts).

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");
const REDIS_KEY = "nn-learning-hub-db";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const useRedis = Boolean(REST_URL && REST_TOKEN);

declare global {
  // eslint-disable-next-line no-var
  var __nnDb: DB | undefined;
}

async function redis(cmd: (string | number)[]): Promise<any> {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

export async function getDb(): Promise<DB> {
  if (useRedis) {
    const raw = await redis(["GET", REDIS_KEY]);
    if (raw) return JSON.parse(raw) as DB;
    const seed = buildSeed();
    await redis(["SET", REDIS_KEY, JSON.stringify(seed)]);
    return seed;
  }
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DB;
    }
    const seed = buildSeed();
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    return seed;
  } catch {
    if (!globalThis.__nnDb) globalThis.__nnDb = buildSeed();
    return globalThis.__nnDb;
  }
}

export async function saveDb(db: DB): Promise<void> {
  if (useRedis) {
    await redis(["SET", REDIS_KEY, JSON.stringify(db)]);
    return;
  }
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch {
    globalThis.__nnDb = db;
  }
}

export function audit(db: DB, actor: string, action: string, detail: string): void {
  db.audit.unshift({
    id: `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    actor,
    action,
    detail,
    at: new Date().toISOString(),
  });
  db.audit = db.audit.slice(0, 200);
}
