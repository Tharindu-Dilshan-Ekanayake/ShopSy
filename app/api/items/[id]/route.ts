import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import { requireApiAdmin, requireApiSession } from "@/lib/dal"
import { uploadImage, deleteImage } from "@/lib/cloudinary"

export async function GET(_req: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { error } = await requireApiSession()
  if (error) return error

  const { id } = await ctx.params
  await connectDB()
  const item = await Item.findById(id).populate("category", "name slug")
  if (!item) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(item)
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await ctx.params
  await connectDB()
  const existing = await Item.findById(id)
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const contentType = req.headers.get("content-type") || ""
  let updates: Record<string, unknown> = {}
  let imageUrl: string | undefined
  let imagePublicId: string | undefined

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null

    if (imageFile && imageFile.size > 0) {
      if (existing.imagePublicId) await deleteImage(existing.imagePublicId)
      const result = await uploadImage(imageFile)
      imageUrl = result.secure_url
      imagePublicId = result.public_id
    }

    const nameEn = formData.get("name.en") as string
    const nameSi = formData.get("name.si") as string
    if (nameEn && nameSi) updates.name = { en: nameEn, si: nameSi }

    const fields = ["category", "price", "costPrice", "stockQty", "lowStockThreshold", "barcode", "status"]
    for (const f of fields) {
      const val = formData.get(f)
      if (val !== null) updates[f] = ["price", "costPrice", "stockQty", "lowStockThreshold"].includes(f) ? Number(val) : val
    }
  } else {
    updates = await req.json()
  }

  if (imageUrl) { updates.imageUrl = imageUrl; updates.imagePublicId = imagePublicId }

  const item = await Item.findByIdAndUpdate(id, { $set: updates }, { new: true }).populate("category", "name slug")
  return Response.json(item)
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/items/[id]">) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await ctx.params
  await connectDB()
  const item = await Item.findByIdAndDelete(id)
  if (!item) return Response.json({ error: "Not found" }, { status: 404 })
  if (item.imagePublicId) await deleteImage(item.imagePublicId)
  return Response.json({ ok: true })
}
