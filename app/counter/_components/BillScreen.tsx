"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import {
  ScanLine, Search, Plus, Minus, ShoppingCart,
  Printer, CheckCircle2, CreditCard, Banknote, X,
  Package, ChevronRight, Trash2,
} from "lucide-react"
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

interface CartItem extends Item { qty: number }

interface Sale {
  billNumber: number
  items: Array<{ name: string; qty: number; price: number; subtotal: number }>
  total: number
  discount: number
  paymentMethod: string
  createdAt: string
}

/* ─── Qty stepper with large touch targets ─── */
function QtyStepper({
  qty, max, onDec, onInc,
}: { qty: number; max: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center rounded-xl border bg-muted/50 overflow-hidden">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={onDec}
        className="flex items-center justify-center size-9 text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums select-none">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={onInc}
        disabled={qty >= max}
        className="flex items-center justify-center size-9 text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 disabled:opacity-40 transition-colors"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

/* ─── Cart panel (shared by desktop sidebar + mobile sheet) ─── */
function CartPanel({
  cart, cartTotal, onUpdateQty, onRemove, onClear, onCheckout,
}: {
  cart: CartItem[]
  cartTotal: number
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onCheckout: () => void
}) {
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="size-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Cart</p>
            {itemCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors min-h-9 px-2 rounded-lg hover:bg-destructive/8"
          >
            <Trash2 className="size-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Item list */}
      <ScrollArea className="flex-1 bg-muted/20">
        <div className="p-3 space-y-2">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingCart className="size-7 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs mt-0.5 opacity-70">Search or scan to add items</p>
              </div>
            </div>
          )}
          {cart.map((item) => (
            <div key={item._id} className="rounded-2xl border bg-card p-3 shadow-xs">
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name.en}
                    width={44}
                    height={44}
                    className="rounded-xl object-cover size-11 shrink-0 border"
                  />
                ) : (
                  <div className="size-11 rounded-xl bg-muted shrink-0 flex items-center justify-center border">
                    <Package className="size-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{item.name.en}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.name.si}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => onRemove(item._id)}
                      className="min-h-9 min-w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <QtyStepper
                      qty={item.qty}
                      max={item.stockQty}
                      onDec={() => onUpdateQty(item._id, -1)}
                      onInc={() => onUpdateQty(item._id, 1)}
                    />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Rs.{item.price.toLocaleString()} × {item.qty}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        Rs.{(item.price * item.qty).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-3 shrink-0 bg-card">
        {cart.length > 0 && (
          <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-primary/8 border border-primary/15">
            <span className="text-sm font-semibold">Subtotal</span>
            <span className="text-lg font-bold text-primary">Rs. {cartTotal.toLocaleString()}</span>
          </div>
        )}
        <Button
          type="button"
          className="w-full h-13 text-base font-bold gap-2 rounded-xl"
          disabled={cart.length === 0}
          onClick={onCheckout}
        >
          <CheckCircle2 className="size-5" />
          Checkout
          {cart.length > 0 && <ChevronRight className="size-4 ml-auto opacity-70" />}
        </Button>
      </div>
    </div>
  )
}

/* ─── Professional thermal receipt ─── */
function ThermalReceipt({ sale, cashierName }: { sale: Sale; cashierName: string }) {
  const dt = new Date(sale.createdAt)
  const dateStr = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  const timeStr = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  const subtotal = sale.items.reduce((s, i) => s + i.subtotal, 0)

  return (
    <div
      id="receipt"
      className="receipt-font bg-white text-black text-[11px] leading-snug w-full max-w-75 mx-auto select-none"
    >
      {/* Store header */}
      <div className="text-center py-4 border-b-2 border-dashed border-gray-300">
        <p className="font-black text-lg tracking-[0.2em] uppercase">ShopSy</p>
        <p className="text-[9px] text-gray-400 tracking-wider mt-0.5">POINT OF SALE SYSTEM</p>
        <p className="text-[9px] text-gray-400 mt-0.5">shopsy-tau-tan.vercel.app</p>
      </div>

      {/* Bill meta */}
      <div className="py-2 space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-500">Bill No</span>
          <span className="font-bold tracking-wider">#{String(sale.billNumber).padStart(5, "0")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date &amp; Time</span>
          <span>{dateStr} {timeStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cashier</span>
          <span className="font-medium">{cashierName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment</span>
          <span className="font-bold uppercase tracking-wide">{sale.paymentMethod}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="border-t border-dashed border-gray-300 pt-2 pb-1">
        <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
          <span className="flex-1">Item</span>
          <span className="w-7 text-right">Qty</span>
          <span className="w-20 text-right">Amount</span>
        </div>
      </div>
      <div className="border-t border-dashed border-gray-300 mb-1" />

      {/* Items */}
      <div className="space-y-1.5 py-1">
        {sale.items.map((item, i) => (
          <div key={i}>
            <p className="font-medium leading-tight">{item.name}</p>
            <div className="flex justify-between text-gray-500 pl-2 text-[10px]">
              <span>@ Rs.{item.price.toLocaleString()}</span>
              <span className="w-7 text-right">{item.qty}</span>
              <span className="w-20 text-right font-semibold text-black">
                Rs.{item.subtotal.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t-2 border-dashed border-gray-300 mt-2 pt-2 space-y-0.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-500">Subtotal</span>
          <span>Rs. {subtotal.toLocaleString()}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-[10px] text-green-700">
            <span>Discount</span>
            <span>- Rs. {sale.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1.5 border-t border-dashed border-gray-300 mt-1">
          <span>TOTAL</span>
          <span>Rs. {sale.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-3 space-y-0.5 border-t border-dashed border-gray-200 mt-3">
        <p className="font-bold text-[11px]">Thank You for Shopping!</p>
        <p className="text-gray-400 text-[9px]">Please come again</p>
        <p className="text-gray-300 text-[8px] mt-1.5">* * * * * * * * * * * * * * *</p>
        <p className="text-gray-400 text-[8px]">Keep receipt for returns / exchanges</p>
      </div>
    </div>
  )
}

/* ─── Main BillScreen ─── */
export default function BillScreen({
  cashierId: _cashierId,
  cashierName,
}: {
  cashierId: string
  cashierName: string
}) {
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
  const searchRef = useRef<HTMLInputElement>(null)

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const discountAmt = Number(discount) || 0
  const grandTotal = Math.max(0, cartTotal - discountAmt)

  const addToCart = useCallback((item: Item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id)
      if (existing) {
        if (existing.qty >= item.stockQty) { toast.error("No more stock available"); return prev }
        return prev.map((i) => i._id === item._id ? { ...i, qty: i.qty + 1 } : i)
      }
      if (item.stockQty < 1) { toast.error(`${item.name.en} is out of stock`); return prev }
      return [...prev, { ...item, qty: 1 }]
    })
    setSearchResults([])
    setSearchQuery("")
    toast.success("Added to cart", { description: item.name.en, duration: 1800 })
    searchRef.current?.focus()
  }, [])

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i
        const newQty = i.qty + delta
        if (newQty < 1) return i
        if (newQty > i.stockQty) { toast.error("No more stock available"); return i }
        return { ...i, qty: newQty }
      }),
    )
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i._id !== id))

  const searchItems = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }
    const res = await fetch(`/api/items?search=${encodeURIComponent(q)}&status=active&limit=8`)
    if (res.ok) { const d = await res.json(); setSearchResults(d.items) }
  }

  const handleBarcodeScan = async (code: string) => {
    setScanning(false)
    const res = await fetch(`/api/items/barcode/${encodeURIComponent(code)}`)
    if (!res.ok) { toast.error(`Barcode not found: ${code}`); return }
    addToCart(await res.json())
  }

  const openCheckout = () => {
    setCartSheetOpen(false)
    setCheckoutOpen(true)
  }

  const checkout = async () => {
    if (cart.length === 0) return
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
    if (!res.ok) {
      const e = await res.json()
      toast.error(e.error || "Checkout failed")
      setProcessing(false)
      return
    }
    const sale = await res.json()
    setCompletedSale(sale)
    setCart([])
    setDiscount("")
    setCheckoutOpen(false)
    setReceiptOpen(true)
    setProcessing(false)
  }

  const handleNewSale = () => {
    setReceiptOpen(false)
    setCompletedSale(null)
    setPaymentMethod("cash")
    setTimeout(() => searchRef.current?.focus(), 100)
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] overflow-hidden relative">

      {/* ── LEFT: Search + Results ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Search bar */}
        <div className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 border-b bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                className="pl-10 h-12 rounded-2xl text-base sm:text-sm focus:border-primary"
                placeholder="Search items…"
                value={searchQuery}
                onChange={(e) => searchItems(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(""); setSearchResults([]); searchRef.current?.focus() }}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {/* Scan button */}
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="h-12 px-4 rounded-2xl shrink-0 font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all text-sm shadow-sm"
            >
              <ScanLine className="size-5" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </p>
              {searchResults.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/70 bg-card hover:border-primary hover:bg-primary/4 active:scale-[0.98] active:bg-primary/8 transition-all text-left group shadow-xs"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name.en}
                      width={60}
                      height={60}
                      className="size-15 rounded-xl object-cover shrink-0 border"
                    />
                  ) : (
                    <div className="size-15 rounded-xl bg-muted shrink-0 flex items-center justify-center border">
                      <Package className="size-6 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{item.name.en}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.name.si}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-sm font-bold text-primary">
                        Rs. {item.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          item.stockQty === 0
                            ? "bg-red-50 text-red-600"
                            : item.stockQty < 5
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {item.stockQty === 0
                          ? "Out of stock"
                          : item.stockQty < 5
                          ? `Only ${item.stockQty} left`
                          : `${item.stockQty} in stock`}
                      </span>
                    </div>
                  </div>

                  <div className="size-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors">
                    <Plus className="size-5" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {searchResults.length === 0 && searchQuery && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 px-6">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <Search className="size-7 text-muted-foreground/30" />
              </div>
              <div className="text-center text-muted-foreground">
                <p className="font-semibold text-foreground">No items found</p>
                <p className="text-sm mt-1">Try a different name or scan the barcode</p>
              </div>
            </div>
          )}

          {/* Empty / ready state */}
          {searchResults.length === 0 && !searchQuery && (
            <div className="flex flex-col items-center justify-center h-full min-h-80 px-8 gap-6">
              <div className="relative">
                <div className="size-24 rounded-3xl bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
                  <ScanLine className="size-12 text-primary/50" />
                </div>
                <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow">
                  +
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-lg font-bold">Ready to bill</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Search by name or tap <strong>Scan</strong> to read a barcode
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <span className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground rounded-xl px-3 py-2 font-medium">
                  <Search className="size-3.5" /> Type to search
                </span>
                <span className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground rounded-xl px-3 py-2 font-medium">
                  <ScanLine className="size-3.5" /> Tap Scan
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Desktop cart sidebar ── */}
      <div className="hidden lg:flex w-85 shrink-0 border-l flex-col bg-card">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
          onCheckout={openCheckout}
        />
      </div>

      {/* ── Mobile FAB — respects iPhone safe area ── */}
      <button
        type="button"
        onClick={() => setCartSheetOpen(true)}
        className="fab-safe-bottom lg:hidden fixed right-4 z-40 flex items-center gap-2.5 bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/30 px-5 py-3.5 font-bold text-sm active:scale-95 transition-transform"
      >
        <div className="relative">
          <ShoppingCart className="size-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-white text-primary text-[9px] font-black flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        <span>{cartCount > 0 ? `Rs. ${cartTotal.toLocaleString()}` : "Cart"}</span>
      </button>

      {/* ── Mobile Cart Sheet ── */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="bottom" className="h-[88dvh] p-0 flex flex-col rounded-t-3xl overflow-hidden">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>
          <SheetHeader className="px-4 pb-3 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-primary" />
              Shopping Cart
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col border-t">
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

      {/* ── Barcode Scanner ── */}
      <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onScan={handleBarcodeScan} />

      {/* ── Checkout Sheet (slides up from bottom — native feel on mobile) ── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 overflow-hidden max-h-[95dvh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <SheetHeader className="px-5 pb-3 shrink-0">
            <SheetTitle className="text-xl font-bold">
              Checkout
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {cart.length} item type{cart.length !== 1 ? "s" : ""}
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto overscroll-contain border-t">
            <div className="px-5 py-4 space-y-4">
              {/* Item summary */}
              <div className="rounded-2xl border bg-muted/30 divide-y divide-border">
                {cart.map((i) => (
                  <div key={i._id} className="flex justify-between items-center px-3 py-3 text-sm">
                    <span className="text-muted-foreground flex-1 truncate pr-3">
                      {i.name.en}
                      <span className="text-xs ml-1 text-muted-foreground/70">× {i.qty}</span>
                    </span>
                    <span className="font-semibold shrink-0">Rs. {(i.price * i.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Discount (Rs.)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="h-12 rounded-xl text-base"
                  inputMode="numeric"
                />
              </div>

              {/* Payment method */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Payment Method
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["cash", "card"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-[0.97] ${
                        paymentMethod === m
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {m === "cash"
                        ? <Banknote className="size-7" />
                        : <CreditCard className="size-7" />}
                      {m === "cash" ? "Cash" : "Card"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grand total */}
              <div className="rounded-2xl bg-primary text-primary-foreground p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs opacity-75 font-medium">Grand Total</p>
                  {discountAmt > 0 && (
                    <p className="text-sm opacity-60 line-through">Rs. {cartTotal.toLocaleString()}</p>
                  )}
                </div>
                <p className="text-3xl font-black">Rs.{grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <SheetFooter className="px-5 py-4 gap-3 border-t bg-card flex-row">
            <Button
              variant="outline"
              className="flex-1 h-13 rounded-xl font-semibold"
              onClick={() => setCheckoutOpen(false)}
            >
              Back
            </Button>
            <Button
              className="flex-1 h-13 rounded-xl font-bold gap-2 text-base"
              onClick={checkout}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5" />
                  Confirm Sale
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Receipt / Success Dialog ── */}
      {completedSale && (
        <Dialog open={receiptOpen} onOpenChange={(v) => { if (!v) handleNewSale() }}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm p-0 overflow-hidden rounded-3xl gap-0">
            {/* Gradient success header */}
            <div className="bg-linear-to-br from-emerald-500 to-green-600 px-5 pt-6 pb-5 text-center">
              <div className="size-16 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="size-8 text-white" />
              </div>
              <p className="font-black text-white text-xl tracking-tight">Sale Complete!</p>
              <p className="text-emerald-100 text-sm mt-1">
                Bill #{String(completedSale.billNumber).padStart(5, "0")} &bull; Rs. {completedSale.total.toLocaleString()}
              </p>
            </div>

            {/* Receipt preview */}
            <div className="bg-gray-50 px-4 py-3 max-h-[50dvh] overflow-y-auto overscroll-contain">
              <ThermalReceipt sale={completedSale} cashierName={cashierName} />
            </div>

            {/* Action buttons */}
            <div className="px-4 pt-3 pb-4 border-t grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-semibold gap-2 border-2"
                onClick={handleNewSale}
              >
                <X className="size-4" />
                No Print
              </Button>
              <Button
                className="h-12 rounded-2xl font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => window.print()}
              >
                <Printer className="size-5" />
                Print Bill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
