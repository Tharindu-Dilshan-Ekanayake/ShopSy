import { connectDB } from "@/lib/db"
import { Category } from "@/models/Category"
import { requireApiAdmin } from "@/lib/dal"

export async function PATCH(req: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await ctx.params
  const body = await req.json()

  await connectDB()
  const category = await Category.findByIdAndUpdate(id, { $set: body }, { new: true })
  if (!category) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(category)
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/categories/[id]">) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await ctx.params
  await connectDB()
  const category = await Category.findByIdAndDelete(id)
  if (!category) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ ok: true })
}
