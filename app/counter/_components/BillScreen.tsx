"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScanLine, Search, Plus, Minus, Trash2, ShoppingCart, Printer, CheckCircle2, ImageOff } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import BarcodeScanner from "./BarcodeScanner"

interface Item {
  _id: string
  name: { en: string; si: string }
  price: number
  stockQty: number
  barcode: string
  imageUrl?: string
}

interface CartItem extends Item {
  qty: number
}

interface Sale {
  billNumber: number
  items: Array<{ name: string; qty: number; price: number; subtotal: number }>
  total: number
  discount: number
  paymentMethod: string
  createdAt: string
}

function CartPanel({
  cart,
  cartTotal,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
}: {
  cart: CartItem[]
  cartTotal: number
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onCheckout: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-12 flex items-center justify-between px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-primary" />
          <span className="font-semibold text-sm">Cart ({cart.length})</span>
        </div>
        {cart.length > 0 && (
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={onClear}>Clear</button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {cart.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Cart is empty</p>
          )}
          {cart.map((item) => (
            <div key={item._id} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate">{item.name.en}</p>
                <p className="text-xs text-primary">Rs. {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="outline" size="icon-xs" onClick={() => onUpdateQty(item._id, -1)}><Minus className="size-3" /></Button>
                <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                <Button type="button" variant="outline" size="icon-xs" onClick={() => onUpdateQty(item._id, 1)}><Plus className="size-3" /></Button>
                <Button type="button" variant="ghost" size="icon-xs" className="text-destructive ml-1" onClick={() => onRemove(item._id)}><Trash2 className="size-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t space-y-3 bg-card shrink-0">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">Rs. {cartTotal.toLocaleString()}</span>
        </div>
        <Button
          type="button"
          className="w-full h-12 text-base font-semibold gap-2"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          <CheckCircle2 className="size-5" />
          Checkout
        </Button>
      </div>
    </div>
  )
}

export default function BillScreen({ cashierId, cashierName }: { cashierId: string; cashierName: string }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Item[]>([])
  const [scanning, setScanning] = useState(false)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [discount, setDiscount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const discountAmt = Number(discount) || 0
  const grandTotal = Math.max(0, cartTotal - discountAmt)

  const addToCart = useCallback((item: Item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id)
      if (existing) {
        if (existing.qty >= item.stockQty) { toast.error("Insufficient stock"); return prev }
        return prev.map((i) => i._id === item._id ? { ...i, qty: i.qty + 1 } : i)
      }
      if (item.stockQty < 1) { toast.error("Out of stock"); return prev }
      return [...prev, { ...item, qty: 1 }]
    })
    setSearchResults([])
    setSearchQuery("")
    toast.success(`Added: ${item.name.en}`)
  }, [])

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i._id !== id) return i
      const newQty = i.qty + delta
      if (newQty < 1) return i
      if (newQty > i.stockQty) { toast.error("Insufficient stock"); return i }
      return { ...i, qty: newQty }
    }))
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i._id !== id))

  const searchItems = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    const res = await fetch(`/api/items?search=${encodeURIComponent(q)}&status=active&limit=6`)
    if (res.ok) { const d = await res.json(); setSearchResults(d.items) }
  }

  const handleBarcodeScan = async (code: string) => {
    setScanning(false)
    const res = await fetch(`/api/items/barcode/${encodeURIComponent(code)}`)
    if (!res.ok) { toast.error("Item not found for barcode: " + code); return }
    addToCart(await res.json())
  }

  const openCheckout = () => { setCartSheetOpen(false); setCheckoutOpen(true) }

  const checkout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return }
    setProcessing(true)
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ itemId: i._id, name: i.name.en, qty: i.qty, price: i.price })),
        discount: discountAmt,
        paymentMethod,
      }),
    })
    if (!res.ok) { const e = await res.json(); toast.error(e.error || "Checkout failed"); setProcessing(false); return }
    const sale = await res.json()
    setCompletedSale(sale)
    setCart([])
    setDiscount("")
    setCheckoutOpen(false)
    setReceiptOpen(true)
    setProcessing(false)
  }

  const printReceipt = () => window.print()

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden relative">
      {/* Left — Item search (full width on mobile, flex-1 on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 gap-3 overflow-hidden">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9 h-11"
              placeholder="Search item name or barcode…"
              value={searchQuery}
              onChange={(e) => searchItems(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="lg"
            className="gap-2 shrink-0 h-11 px-4"
            onClick={() => setScanning(true)}
          >
            <ScanLine className="size-5" />
            <span className="hidden sm:inline">Scan</span>
          </Button>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {searchResults.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className="text-left rounded-xl border bg-card p-2 sm:p-3 hover:border-primary hover:bg-primary/5 transition-colors active:scale-95"
                >
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name.en} width={80} height={80} className="rounded-lg object-cover w-full aspect-square mb-2" />
                  ) : (
                    <div className="rounded-lg bg-muted w-full aspect-square mb-2 flex items-center justify-center">
                      <ImageOff className="size-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <p className="text-xs sm:text-sm font-medium leading-tight truncate">{item.name.en}</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">Rs. {item.price.toLocaleString()}</p>
                  <p className={`text-xs mt-0.5 ${item.stockQty < 5 ? "text-destructive" : "text-muted-foreground"}`}>
                    Stock: {item.stockQty}
                  </p>
                </button>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No items found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {searchResults.length === 0 && !searchQuery && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <ScanLine className="size-16 opacity-20" />
              <div className="text-center">
                <p className="font-medium">Ready to bill</p>
                <p className="text-sm">Scan a barcode or search for an item</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart (desktop: fixed sidebar; mobile: hidden, accessed via FAB) */}
      <div className="hidden lg:flex w-80 shrink-0 border-l bg-card flex-col">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
          onCheckout={openCheckout}
        />
      </div>

      {/* Mobile FAB — cart button */}
      <button
        type="button"
        onClick={() => setCartSheetOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-lg px-4 py-3 font-semibold text-sm active:scale-95 transition-transform"
      >
        <ShoppingCart className="size-5" />
        {cartCount > 0 && (
          <>
            <span>{cartCount}</span>
            <span className="text-primary-foreground/80">·</span>
            <span>Rs. {cartTotal.toLocaleString()}</span>
          </>
        )}
        {cartCount === 0 && <span>Cart</span>}
      </button>

      {/* Mobile Cart Sheet */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-0 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-primary" />
              Cart
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <CartPanel
              cart={cart}
              cartTotal={cartTotal}
              onUpdateQty={updateQty}
              onRemove={removeFromCart}
              onClear={() => setCart([])}
              onCheckout={openCheckout}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Barcode Scanner modal */}
      <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onScan={handleBarcodeScan} />

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader><DialogTitle>Checkout</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((i) => (
                <div key={i._id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{i.name.en} × {i.qty}</span>
                  <span>Rs. {(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <Separator />

            <div className="space-y-1.5">
              <Label>Discount (Rs.)</Label>
              <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod((v ?? "cash") as "cash" | "card")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total</span>
              <span className="text-primary">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Back</Button>
            <Button onClick={checkout} disabled={processing} className="gap-2">
              {processing ? "Processing…" : <><CheckCircle2 className="size-4" />Confirm</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {completedSale && (
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary"><CheckCircle2 className="size-5" />Sale Complete!</DialogTitle>
            </DialogHeader>

            <div id="receipt" className="border rounded-lg p-4 font-mono text-xs space-y-1 bg-white text-black">
              <div className="text-center font-bold text-sm mb-2">ShopSy POS</div>
              <div className="text-center mb-2">Bill #{completedSale.billNumber}</div>
              <div>{new Date(completedSale.createdAt).toLocaleString()}</div>
              <div>Cashier: {cashierName}</div>
              <Separator className="my-2" />
              {completedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="truncate flex-1 pr-2">{item.name} ×{item.qty}</span>
                  <span>Rs.{item.subtotal.toLocaleString()}</span>
                </div>
              ))}
              <Separator className="my-2" />
              {completedSale.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-Rs.{completedSale.discount.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold"><span>TOTAL</span><span>Rs.{completedSale.total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Payment</span><span className="capitalize">{completedSale.paymentMethod}</span></div>
              <div className="text-center mt-3">Thank you!</div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>Close</Button>
              <Button onClick={printReceipt} className="gap-2"><Printer className="size-4" />Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
