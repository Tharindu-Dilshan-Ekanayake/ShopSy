import { connectDB } from "@/lib/db"
import { Sale } from "@/models/Sale"
import { requireApiAdmin } from "@/lib/dal"

export async function GET(req: Request) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const range = (searchParams.get("range") || "daily") as "daily" | "weekly" | "monthly"

  await connectDB()

  const now = new Date()

  if (range === "daily") {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])

    const topItems = await Sale.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.name", qty: { $sum: "$items.qty" }, revenue: { $sum: "$items.subtotal" } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ])

    return Response.json({ range, data, topItems })
  }

  if (range === "weekly") {
    const start = new Date(now)
    start.setDate(start.getDate() - 27)
    start.setHours(0, 0, 0, 0)

    const data = await Sale.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    return Response.json({ range, data, topItems: [] })
  }

  // Monthly
  const start = new Date(now)
  start.setMonth(start.getMonth() - 11)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const data = await Sale.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])
  return Response.json({ range, data, topItems: [] })
}
