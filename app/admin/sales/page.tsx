import { Metadata } from "next"
import Link from "next/link"
import { verifyAdmin } from "@/lib/dal"
import { connectDB } from "@/lib/db"
import { Sale } from "@/models/Sale"
import { User } from "@/models/User"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Receipt, Search } from "lucide-react"
import { formatQty } from "@/lib/pricing"

export const metadata: Metadata = { title: "Bill History" }

interface SaleItem {
  name: string
  qty: number
  unit?: string
  price: number
  subtotal: number
}

interface SaleDoc {
  _id: string
  billNumber: number
  items: SaleItem[]
  total: number
  discount: number
  paymentMethod: "cash" | "card"
  cashier: { _id: string; name: string } | null
  createdAt: string
}

interface CashierOption {
  _id: string
  name: string
}

interface PageProps {
  searchParams: { page?: string; cashier?: string; from?: string; to?: string; bill?: string }
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  }
}

export default async function AdminSalesPage({ searchParams }: PageProps) {
  await verifyAdmin()
  const sp = await (searchParams as unknown as Promise<{ page?: string; cashier?: string; from?: string; to?: string; bill?: string }>)
  const page = Math.max(1, Number(sp.page || 1))
  const limit = 10
  const cashierId = sp.cashier || ""
  const from = sp.from || ""
  const to = sp.to || ""
  const billQuery = sp.bill || ""
  const billDigits = billQuery.replace(/\D/g, "")

  await connectDB()

  const filter: Record<string, unknown> = {}
  if (cashierId) filter.cashier = cashierId
  if (from || to) {
    const range: Record<string, Date> = {}
    if (from) range.$gte = new Date(from)
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      range.$lte = end
    }
    filter.createdAt = range
  }
  if (billDigits) {
    filter.$expr = { $regexMatch: { input: { $toString: "$billNumber" }, regex: billDigits } }
  }

  const [sales, total, cashierDocs] = await Promise.all([
    Sale.find(filter).populate("cashier", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean<SaleDoc[]>(),
    Sale.countDocuments(filter),
    User.find({ role: "counter" }).select("name").sort({ name: 1 }).lean<{ _id: unknown; name: string }[]>(),
  ])
  const cashiers: CashierOption[] = cashierDocs.map((u) => ({ _id: String(u._id), name: u.name }))
  const pages = Math.ceil(total / limit)

  const pageHref = (target: number) => {
    const params = new URLSearchParams()
    if (cashierId) params.set("cashier", cashierId)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (billQuery) params.set("bill", billQuery)
    params.set("page", String(target))
    return `?${params.toString()}`
  }

  const hasFilters = cashierId || from || to || billQuery

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bill History</h1>
        <p className="text-sm text-muted-foreground">{total} bill{total !== 1 ? "s" : ""} total</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="bill">Bill #</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="bill"
                  type="text"
                  name="bill"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  defaultValue={billQuery}
                  placeholder="e.g. 1024"
                  className="w-32 pl-8"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="cashier">Cashier</label>
              <select
                id="cashier"
                name="cashier"
                defaultValue={cashierId}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">All cashiers</option>
                {cashiers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="from">From</label>
              <Input id="from" type="date" name="from" defaultValue={from} className="w-36" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor="to">To</label>
              <Input id="to" type="date" name="to" defaultValue={to} className="w-36" />
            </div>
            <Button type="submit" size="sm">Filter</Button>
            {hasFilters && (
              <Link href="/admin/sales" className="text-sm text-muted-foreground hover:underline">
                Clear
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Receipt className="size-12 opacity-20 mb-4" />
          <p className="font-medium">No bills found</p>
          <p className="text-sm">Try adjusting the filters</p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table view */}
          <Card className="hidden md:block py-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => {
                  const { date, time } = fmtDate(sale.createdAt)
                  const itemCount = sale.items.reduce((s, i) => s + i.qty, 0)
                  return (
                    <TableRow key={sale._id}>
                      <TableCell className="font-semibold">#{sale.billNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {date} <span className="text-xs">{time}</span>
                      </TableCell>
                      <TableCell>{sale.cashier?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground" title={sale.items.map((i) => `${i.name} ×${formatQty(i.qty, i.unit || "pcs")}`).join(", ")}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentMethod === "cash" ? "secondary" : "outline"} className="text-xs capitalize">
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-bold text-primary">Rs. {sale.total.toLocaleString()}</p>
                        {sale.discount > 0 && (
                          <p className="text-xs text-muted-foreground">-Rs. {sale.discount.toLocaleString()} disc</p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: card view */}
          <div className="md:hidden space-y-3">
            {sales.map((sale) => {
              const { date, time } = fmtDate(sale.createdAt)
              return (
                <Card key={sale._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">Bill #{sale.billNumber}</span>
                          <Badge variant={sale.paymentMethod === "cash" ? "secondary" : "outline"} className="text-xs capitalize">
                            {sale.paymentMethod}
                          </Badge>
                          {sale.cashier && (
                            <Badge variant="outline" className="text-xs">{sale.cashier.name}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {date} &bull; {time}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {sale.items.map((item, i) => (
                            <span key={i} className="inline-block mr-3">{item.name} ×{formatQty(item.qty, item.unit || "pcs")}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">Rs. {sale.total.toLocaleString()}</p>
                        {sale.discount > 0 && (
                          <p className="text-xs text-muted-foreground">-Rs. {sale.discount.toLocaleString()} disc</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors">
              <ChevronLeft className="size-4" />Prev
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors">
              Next<ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
