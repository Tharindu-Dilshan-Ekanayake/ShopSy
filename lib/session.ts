import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)
const EXPIRES_IN = 7 * 24 * 60 * 60 * 1000 // 7 days

export type SessionPayload = {
  userId: string
  role: "admin" | "counter"
  name: string
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET)
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ["HS256"] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await encrypt(payload)
  const expiresAt = new Date(Date.now() + EXPIRES_IN)
  const store = await cookies()
  store.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession() {
  const store = await cookies()
  store.delete("session")
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get("session")?.value
  return decrypt(token)
}
