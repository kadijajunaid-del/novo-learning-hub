import { cookies } from "next/headers";
import { getDb } from "./db";
import type { User } from "./types";

const COOKIE = "nn_session";

export async function createSession(userId: string) {
  const store = await cookies();
  const token = Buffer.from(JSON.stringify({ userId, at: Date.now() })).toString("base64url");
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const { userId } = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    const user = (await getDb()).users.find((u) => u.id === userId && u.active);
    return user ?? null;
  } catch {
    return null;
  }
}
