import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import { Sale } from "@/models/Sale"
import { Notification } from "@/models/Notification"
import { requireApiSession } from "@/lib/dal"
import { z } from "zod"

const LineItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  qty: z.number().positive(),
  unit: z.string().default("pcs"),
  unitSize: z.number().positive().default(1),
  price: z.number().positive(),
})

const SaleSchema = z.object({
  items: z.array(LineItemSchema).min(1),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(["cash", "card"]),
})

export async function GET(req: Request) {
  const { error, session } = await requireApiSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = 20
  const cashierId = searchParams.get("cashier") || ""
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (session!.role === "counter") filter.cashier = new mongoose.Types.ObjectId(session!.userId)
  else if (cashierId) filter.cashier = new mongoose.Types.ObjectId(cashierId)

  if (from || to) {
    filter.createdAt = {}
    if (from) (filter.createdAt as Record<string, unknown>).$gte = new Date(from)
    if (to) (filter.createdAt as Record<string, unknown>).$lte = new Date(to)
  }

  const [sales, total] = await Promise.all([
    Sale.find(filter).populate("cashier", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Sale.countDocuments(filter),
  ])

  return Response.json({ sales, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const { error, session } = await requireApiSession()
  if (error) return error

  const body = await req.json()
  const parsed = SaleSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })

  await connectDB()

  const { items, discount, paymentMethod } = parsed.data
  const decremented: Array<{ id: string; qty: number }> = []

  // Atomic stock decrement for each line item
  for (const line of items) {
    const updated = await Item.findOneAndUpdate(
      { _id: line.itemId, stockQty: { $gte: line.qty }, status: "active" },
      { $inc: { stockQty: -line.qty } },
      { new: true }
    )
    if (!updated) {
      // Roll back already decremented items
      for (const done of decremented) {
        await Item.findByIdAndUpdate(done.id, { $inc: { stockQty: done.qty } })
      }
      return Response.json({ error: `Insufficient stock for item ${line.name}` }, { status: 409 })
    }
    decremented.push({ id: line.itemId, qty: line.qty })

    // Trigger low-stock notification if threshold crossed
    if (updated.stockQty < updated.lowStockThreshold) {
      await Notification.updateOne(
        { item: updated._id, isRead: false },
        { $setOnInsert: { type: "low-stock", item: updated._id, message: `Low stock: ${updated.name.en} (${updated.stockQty} left)` } },
        { upsert: true }
      )
    }
  }

  // Get next bill number
  const counter = await mongoose.connection.collection("_counters").findOneAndUpdate(
    { _id: { $eq: "billNumber" } } as object,
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  )
  const billNumber = (counter as unknown as { seq: number }).seq

  const subtotals = items.map((l) => ({ ...l, subtotal: l.qty * l.price }))
  const total = subtotals.reduce((s, l) => s + l.subtotal, 0) - discount

  const sale = await Sale.create({
    billNumber,
    items: subtotals.map((l) => ({ item: l.itemId, name: l.name, qty: l.qty, unit: l.unit, unitSize: l.unitSize, price: l.price, subtotal: l.subtotal })),
    total,
    discount,
    paymentMethod,
    cashier: session!.userId,
  })

  return Response.json(sale, { status: 201 })
}
