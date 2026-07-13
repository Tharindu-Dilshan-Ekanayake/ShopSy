import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import { requireApiAdmin, requireApiSession } from "@/lib/dal"
import { uploadImage } from "@/lib/cloudinary"
import { generateBarcodeImage } from "@/lib/barcode"

export async function GET(req: Request) {
  const { error } = await requireApiSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(48, Number(searchParams.get("limit") || 12))
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || ""
  const status = searchParams.get("status") || "active"
  const publicView = searchParams.get("public") === "1"

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (search) filter.$or = [
    { "name.en": { $regex: search, $options: "i" } },
    { "name.si": { $regex: search, $options: "i" } },
    { barcode: { $regex: search, $options: "i" } },
  ]
  if (category) filter.category = category
  if (!publicView) {
    if (status && status !== "all") filter.status = status
  } else {
    filter.status = "active"
  }

  const [items, total] = await Promise.all([
    Item.find(filter).populate("category", "name slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Item.countDocuments(filter),
  ])

  return Response.json({ items, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const formData = await req.formData()
  const name = { en: formData.get("name.en") as string, si: formData.get("name.si") as string }
  const category = formData.get("category") as string
  const price = Number(formData.get("price"))
  const unit = (formData.get("unit") as string) || "pcs"
  const unitSize = Number(formData.get("unitSize") || 1)
  const costPrice = Number(formData.get("costPrice"))
  const stockQty = Number(formData.get("stockQty") || 0)
  const lowStockThreshold = Number(formData.get("lowStockThreshold") || 5)
  const barcode = (formData.get("barcode") as string) || `BC${Date.now().toString(36).toUpperCase()}`
  const status = (formData.get("status") as string) || "active"
  const discountType = (formData.get("discountType") as string) || "percentage"
  const discountValue = Number(formData.get("discountValue") || 0)
  const discountActive = formData.get("discountActive") === "true"
  const imageFile = formData.get("image") as File | null

  if (!name.en || !name.si || !category || !price || !costPrice) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  let imageUrl: string | undefined
  let imagePublicId: string | undefined

  if (imageFile && imageFile.size > 0) {
    const result = await uploadImage(imageFile)
    imageUrl = result.secure_url
    imagePublicId = result.public_id
  }

  // Always generate a barcode image and upload to Cloudinary
  const { url: barcodeImageUrl, publicId: barcodeImagePublicId } = await generateBarcodeImage(barcode)

  await connectDB()
  try {
    const item = await Item.create({ name, category, price, unit, unitSize, costPrice, stockQty, lowStockThreshold, barcode, imageUrl, imagePublicId, barcodeImageUrl, barcodeImagePublicId, status, discountType, discountValue, discountActive })
    return Response.json(item, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) return Response.json({ error: "Barcode already exists" }, { status: 409 })
    throw e
  }
}
