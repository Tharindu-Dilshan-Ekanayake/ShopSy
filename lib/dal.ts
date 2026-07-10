import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { getSession, type SessionPayload } from "./session"

/** For Server Components / layouts — redirects on failure */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session?.userId) redirect("/login")
  return session
})

export const verifyAdmin = cache(async (): Promise<SessionPayload> => {
  const session = await verifySession()
  if (session.role !== "admin") redirect("/counter")
  return session
})

/** For Route Handlers — returns null on failure (no redirect) */
export async function getApiSession(): Promise<SessionPayload | null> {
  return getSession()
}

export async function requireApiSession() {
  const session = await getSession()
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }), session: null }
  return { error: null, session }
}

export async function requireApiAdmin() {
  const session = await getSession()
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }), session: null }
  if (session.role !== "admin") return { error: Response.json({ error: "Forbidden" }, { status: 403 }), session: null }
  return { error: null, session }
}
