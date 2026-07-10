import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import { requireApiSession } from "@/lib/dal"

export async function GET(_req: Request, ctx: RouteContext<"/api/items/barcode/[code]">) {
  const { error } = await requireApiSession()
  if (error) return error

  const { code } = await ctx.params
  await connectDB()
  const item = await Item.findOne({ barcode: code, status: "active" }).populate("category", "name")
  if (!item) return Response.json({ error: "Item not found" }, { status: 404 })
  return Response.json(item)
}
