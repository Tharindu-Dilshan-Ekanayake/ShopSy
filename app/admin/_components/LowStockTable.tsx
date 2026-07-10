import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface LowStockItem {
  _id: string
  name: { en: string }
  stockQty: number
  lowStockThreshold: number
  barcode: string
}

export default function LowStockTable({ items }: { items: LowStockItem[] }) {
  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4" />
          Low Stock Alert ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.name.en}</p>
                <p className="text-xs font-mono text-muted-foreground">{item.barcode}</p>
              </div>
              <div className="text-right">
                <Badge variant="destructive" className="text-xs">{item.stockQty} left</Badge>
                <p className="text-xs text-muted-foreground mt-0.5">min: {item.lowStockThreshold}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
