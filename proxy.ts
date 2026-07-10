import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"

const PUBLIC_PATHS = ["/", "/login"]
const ADMIN_PATHS = ["/admin"]
const COUNTER_PATHS = ["/counter"]

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static files and API routes handled by their own handlers
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get("session")?.value
  const session = await decrypt(token)

  const isPublic = PUBLIC_PATHS.includes(pathname)
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isCounter = COUNTER_PATHS.some((p) => pathname.startsWith(p))

  // Unauthenticated — redirect to login for protected routes
  if (!session && (isAdmin || isCounter)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Authenticated on login page — redirect to their home
  if (session && pathname === "/login") {
    const dest = session.role === "admin" ? "/admin" : "/counter"
    return NextResponse.redirect(new URL(dest, req.nextUrl))
  }

  // Counter role trying to access admin
  if (session && isAdmin && session.role !== "admin") {
    return NextResponse.redirect(new URL("/counter", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
