import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import "@/models/Category" // registers the Category schema so .populate("category") never throws MissingSchemaError on a cold start
import { requireApiAdmin, requireApiSession } from "@/lib/dal"
import { uploadImage, deleteImage } from "@/lib/cloudinary"
import { generateBarcodeImage } from "@/lib/barcode"

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

    const fields = ["category", "price", "unit", "unitSize", "costPrice", "stockQty", "lowStockThreshold", "barcode", "status", "discountType", "discountValue", "discountActive"]
    const numberFields = ["price", "unitSize", "costPrice", "stockQty", "lowStockThreshold", "discountValue"]
    for (const f of fields) {
      const val = formData.get(f)
      if (val === null) continue
      if (numberFields.includes(f)) updates[f] = Number(val)
      else if (f === "discountActive") updates[f] = val === "true"
      else updates[f] = val
    }

    // Regenerate barcode image if barcode code changed
    const newBarcode = formData.get("barcode") as string | null
    if (newBarcode && newBarcode !== existing.barcode) {
      if (existing.barcodeImagePublicId) await deleteImage(existing.barcodeImagePublicId)
      const { url: barcodeImageUrl, publicId: barcodeImagePublicId } = await generateBarcodeImage(newBarcode)
      updates.barcodeImageUrl = barcodeImageUrl
      updates.barcodeImagePublicId = barcodeImagePublicId
    } else if (!existing.barcodeImageUrl && existing.barcode) {
      // Backfill barcode image for items created before this feature
      const { url: barcodeImageUrl, publicId: barcodeImagePublicId } = await generateBarcodeImage(existing.barcode)
      updates.barcodeImageUrl = barcodeImageUrl
      updates.barcodeImagePublicId = barcodeImagePublicId
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
  await Promise.all([
    item.imagePublicId ? deleteImage(item.imagePublicId) : Promise.resolve(),
    item.barcodeImagePublicId ? deleteImage(item.barcodeImagePublicId) : Promise.resolve(),
  ])
  return Response.json({ ok: true })
}
