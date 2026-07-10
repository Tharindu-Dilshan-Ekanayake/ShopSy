import { verifySession } from "@/lib/dal"
import { connectDB } from "@/lib/db"
import { Sale } from "@/models/Sale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react"

export const metadata = { title: "Bill History" }

interface SaleItem {
  name: string
  qty: number
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
  createdAt: string
}

interface PageProps {
  searchParams: { page?: string }
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const session = await verifySession()
  const sp = await (searchParams as unknown as Promise<{ page?: string }>)
  const page = Math.max(1, Number(sp.page || 1))
  const limit = 20

  await connectDB()

  const filter: Record<string, unknown> = { cashier: session.userId }
  const [sales, total] = await Promise.all([
    Sale.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean<SaleDoc[]>(),
    Sale.countDocuments(filter),
  ])
  const pages = Math.ceil(total / limit)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/counter" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Bill History</h1>
          <p className="text-sm text-muted-foreground">{total} bill{total !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Receipt className="size-12 opacity-20 mb-4" />
          <p className="font-medium">No bills yet</p>
          <p className="text-sm">Bills you create will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <Card key={sale._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">Bill #{sale.billNumber}</span>
                      <Badge variant={sale.paymentMethod === "cash" ? "secondary" : "outline"} className="text-xs capitalize">
                        {sale.paymentMethod}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {sale.items.map((item, i) => (
                        <span key={i} className="inline-block mr-3">{item.name} ×{item.qty}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold text-primary">Rs. {sale.total.toLocaleString()}</p>
                    {sale.discount > 0 && (
                      <p className="text-xs text-muted-foreground">-Rs. {sale.discount.toLocaleString()} disc</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={`?page=${page - 1}`} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors">
              <ChevronLeft className="size-4" />Prev
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          {page < pages && (
            <Link href={`?page=${page + 1}`} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition-colors">
              Next<ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
