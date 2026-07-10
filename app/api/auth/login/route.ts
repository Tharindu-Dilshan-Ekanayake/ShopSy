import { z } from "zod"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { createSession } from "@/lib/session"

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ email: parsed.data.email, isActive: true })
    if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 })

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 })

    await createSession({ userId: user._id.toString(), role: user.role, name: user.name })

    return Response.json({ role: user.role, name: user.name })
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}
