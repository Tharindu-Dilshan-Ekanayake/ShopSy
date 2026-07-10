import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { requireApiAdmin } from "@/lib/dal"
import { z } from "zod"
import bcrypt from "bcryptjs"

const PatchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["admin", "counter"]).optional(),
  password: z.string().min(6).optional(),
})

export async function PATCH(req: Request, ctx: RouteContext<"/api/users/[id]">) {
  const { error, session } = await requireApiAdmin()
  if (error) return error

  const { id } = await ctx.params
  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive
  if (parsed.data.role) updates.role = parsed.data.role
  if (parsed.data.password) updates.passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await connectDB()
  const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select("-passwordHash")
  if (!user) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(user)
}
