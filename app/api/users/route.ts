import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { requireApiAdmin } from "@/lib/dal"
import { z } from "zod"
import bcrypt from "bcryptjs"

const CreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "counter"]),
})

export async function GET() {
  const { error } = await requireApiAdmin()
  if (error) return error

  await connectDB()
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 })
  return Response.json(users)
}

export async function POST(req: Request) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 })

  const { name, email, password, role } = parsed.data
  await connectDB()

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash, role })
    const { passwordHash: _, ...safe } = user.toObject()
    return Response.json(safe, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) return Response.json({ error: "Email already exists" }, { status: 409 })
    throw e
  }
}
