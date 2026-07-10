import { Metadata } from "next"
import { connectDB } from "@/lib/db"
import { Sale } from "@/models/Sale"
import { Item } from "@/models/Item"
import { Notification } from "@/models/Notification"
import { verifyAdmin } from "@/lib/dal"
import { TrendingUp, Package, Bell, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardCharts from "./_components/DashboardCharts"
import LowStockTable from "./_components/LowStockTable"

export const metadata: Metadata = { title: "Dashboard" }

async function getStats() {
  await connectDB()
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const [todaySales, lowStockItems, unreadNotifs, weekSales] = await Promise.all([
    Sale.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }]),
    Item.find({ status: "active", $expr: { $lte: ["$stockQty", "$lowStockThreshold"] } }).populate("category", "name").limit(10).lean(),
    Notification.countDocuments({ isRead: false }),
    Sale.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ])

  return {
    todayTotal: todaySales[0]?.total ?? 0,
    todayCount: todaySales[0]?.count ?? 0,
    lowStockCount: lowStockItems.length,
    unreadNotifs,
    lowStockItems,
    weekSales,
  }
}

export default async function AdminDashboard() {
  await verifyAdmin()
  const stats = await getStats()

  const kpis = [
    { label: "Today's Sales", value: `Rs. ${stats.todayTotal.toLocaleString()}`, sub: `${stats.todayCount} transactions`, icon: TrendingUp, color: "text-primary" },
    { label: "Low Stock Items", value: String(stats.lowStockCount), sub: "Below threshold", icon: Package, color: "text-destructive" },
    { label: "Unread Alerts", value: String(stats.unreadNotifs), sub: "Notifications", icon: Bell, color: "text-amber-500" },
    { label: "Total Sales (7d)", value: `Rs. ${stats.weekSales.reduce((s: number, d: { total: number }) => s + d.total, 0).toLocaleString()}`, sub: "Last 7 days", icon: ShoppingBag, color: "text-emerald-500" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`size-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts initialData={stats.weekSales} />

      {/* Low Stock */}
      {stats.lowStockItems.length > 0 && <LowStockTable items={stats.lowStockItems as Parameters<typeof LowStockTable>[0]["items"]} />}
    </div>
  )
}
