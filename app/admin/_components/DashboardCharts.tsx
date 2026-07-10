"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface DataPoint { _id: string; total: number; count: number }
interface TopItem { _id: string; qty: number; revenue: number }

const fmt = (v: number) => `Rs. ${v.toLocaleString()}`
const shortDate = (d: string) => { const [,m,day] = d.split("-"); return `${day}/${m}` }

export default function DashboardCharts({ initialData }: { initialData: DataPoint[] }) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily")
  const [data, setData] = useState<DataPoint[]>(initialData)
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async (r: "daily" | "weekly" | "monthly") => {
    setLoading(true)
    const res = await fetch(`/api/sales/analytics?range=${r}`)
    if (res.ok) { const d = await res.json(); setData(d.data); setTopItems(d.topItems || []) }
    setLoading(false)
  }

  useEffect(() => { load(range) }, [range])

  const chartData = data.map((d) => ({
    name: range === "daily" ? shortDate(d._id) : d._id,
    Sales: d.total,
    Orders: d.count,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sales chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sales Overview</CardTitle>
            <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <TabsList className="h-7 text-xs">
                <TabsTrigger value="daily" className="text-xs px-2">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="Sales" fill="oklch(0.49 0.22 264)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Items (7 Days)</CardTitle></CardHeader>
        <CardContent>
          {topItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item._id} className="flex items-center gap-3">
                  <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item._id}</p>
                    <p className="text-xs text-muted-foreground">{item.qty} sold · Rs. {item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
