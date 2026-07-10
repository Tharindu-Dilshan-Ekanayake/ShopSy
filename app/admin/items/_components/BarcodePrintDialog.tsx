"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

interface Item {
  _id: string
  name: { en: string; si: string }
  price: number
  barcode: string
  barcodeImageUrl?: string
}

interface Props {
  item: Item | null
  onClose: () => void
}

export default function BarcodePrintDialog({ item, onClose }: Props) {
  if (!item) return null

  const print = () => window.print()

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs mx-4">
        <DialogHeader>
          <DialogTitle>Print Barcode Label</DialogTitle>
        </DialogHeader>

        {/* Label preview — this is what prints */}
        <div
          id="barcode-label"
          className="border rounded-xl p-4 bg-white text-black flex flex-col items-center gap-2 text-center"
        >
          <p className="font-bold text-sm leading-tight">{item.name.en}</p>
          <p className="text-xs text-gray-500">{item.name.si}</p>

          {item.barcodeImageUrl ? (
            <Image
              src={item.barcodeImageUrl}
              alt={`Barcode for ${item.barcode}`}
              width={220}
              height={80}
              className="object-contain w-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
              No barcode image
            </div>
          )}

          <p className="font-mono text-xs tracking-widest">{item.barcode}</p>
          <p className="font-bold text-base">Rs. {item.price.toLocaleString()}</p>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Tip: Set paper size to &ldquo;Label&rdquo; or scale to fit in your print dialog
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="size-4" /> Close
          </Button>
          <Button onClick={print} className="gap-2">
            <Printer className="size-4" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
