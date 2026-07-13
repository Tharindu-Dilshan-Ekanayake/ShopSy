"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
import { effectivePrice, unitPrice, formatQty, formatUnitLabel, UNIT_LABELS, type ItemUnit, type DiscountType } from "@/lib/pricing"
import { cloudinaryThumb } from "@/lib/cloudinaryUrl"

interface Item {
  _id: string
  name: { en: string; si: string }
  price: number
  unit: ItemUnit
  unitSize: number
  discountType: DiscountType
  discountValue: number
  discountActive: boolean
  stockQty: number
  barcode: string
  imageUrl?: string
}

interface CartItem extends Item { qty: number }

interface Sale {
  billNumber: number
  items: Array<{ name: string; qty: number; unit?: string; unitSize?: number; price: number; subtotal: number }>
  total: number
  discount: number
  paymentMethod: string
  createdAt: string
}

/* ─── Piece-based qty: simple +/- stepper (whole units) ─── */
function QtyStepper({
  qty, max, onChange,
}: { qty: number; max: number; onChange: (qty: number) => void }) {
  return (
    <div className="flex items-center rounded-xl border bg-muted/50 overflow-hidden">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(qty - 1)}
        className="flex items-center justify-center size-9 text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums select-none">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= max}
        className="flex items-center justify-center size-9 text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 disabled:opacity-40 transition-colors"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

/* ─── Weight/volume qty: manual entry only — the whole point is typing an exact
   measured amount (e.g. 250 for 250g), not stepping by an arbitrary increment ─── */
function QtyManualInput({
  qty, max, unit, onChange,
}: { qty: number; max: number; unit: ItemUnit; onChange: (qty: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border bg-muted/50 px-2.5 h-9">
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={0}
        value={qty}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(0, v)))
        }}
        className="w-16 text-sm font-bold tabular-nums bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-xs font-medium text-muted-foreground">{UNIT_LABELS[unit]}</span>
    </div>
  )
}

/* ─── Cart panel (shared by desktop sidebar + mobile sheet) ─── */
function CartPanel({
  cart, cartTotal, onUpdateQty, onRemove, onClear, onCheckout,
}: {
  cart: CartItem[]
  cartTotal: number
  onUpdateQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onCheckout: () => void
}) {
  const itemCount = cart.reduce((s, i) => s + ((i.unit || "pcs") === "pcs" ? i.qty : 1), 0)

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
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4 text-muted-foreground px-8">
            <div className="size-20 rounded-3xl bg-muted flex items-center justify-center">
              <ShoppingCart className="size-9 opacity-30" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-foreground">Cart is empty</p>
              <p className="text-sm opacity-70">Search above or tap the scan button to add items</p>
            </div>
          </div>
        ) : (
        <div className="p-3 space-y-2">
          {cart.map((item) => (
            <div key={item._id} className="rounded-2xl border bg-card p-3 shadow-xs">
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <Image
                    src={cloudinaryThumb(item.imageUrl, 88)!}
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
                    {(item.unit || "pcs") === "pcs" ? (
                      <QtyStepper
                        qty={item.qty}
                        max={item.stockQty}
                        onChange={(qty) => onUpdateQty(item._id, qty)}
                      />
                    ) : (
                      <QtyManualInput
                        qty={item.qty}
                        max={item.stockQty}
                        unit={item.unit}
                        onChange={(qty) => onUpdateQty(item._id, qty)}
                      />
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Rs.{effectivePrice(item).toLocaleString()}/{formatUnitLabel(item.unitSize, item.unit || "pcs")}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        Rs.{(unitPrice(item) * item.qty).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
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
              <span>@ Rs.{item.price.toLocaleString()}/{UNIT_LABELS[(item.unit as ItemUnit) || "pcs"]}</span>
              <span className="w-10 text-right">{formatQty(item.qty, item.unit || "pcs")}</span>
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
  const [searchFocused, setSearchFocused] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [discount, setDiscount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const cartTotal = cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0)
  const discountAmt = Number(discount) || 0
  const grandTotal = Math.max(0, cartTotal - discountAmt)

  const addToCart = useCallback((item: Item) => {
    const increment = item.unit === "pcs" || !item.unit ? 1 : (item.unitSize || 1)
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id)
      if (existing) {
        if (existing.qty >= item.stockQty) { toast.error("No more stock available"); return prev }
        return prev.map((i) => i._id === item._id ? { ...i, qty: i.qty + increment } : i)
      }
      if (item.stockQty < increment) { toast.error(`${item.name.en} is out of stock`); return prev }
      return [...prev, { ...item, qty: increment }]
    })
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchAbortRef.current?.abort()
    setSearchResults([])
    setSearchQuery("")
    toast.success("Added to cart", { description: item.name.en, duration: 1800 })
    searchRef.current?.focus()
  }, [])

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i
        if (qty <= 0) return i
        if (qty > i.stockQty) { toast.error("No more stock available"); return i }
        return { ...i, qty }
      }),
    )
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i._id !== id))

  const searchAbortRef = useRef<AbortController | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = async (q: string) => {
    searchAbortRef.current?.abort()
    const controller = new AbortController()
    // eslint-disable-next-line react-hooks/immutability -- standard abort-controller ref pattern
    searchAbortRef.current = controller
    try {
      // populate=0: this dropdown never renders category, skip the extra lookup
      const res = await fetch(`/api/items?search=${encodeURIComponent(q)}&status=active&limit=8&populate=0`, { signal: controller.signal })
      if (res.ok) { const d = await res.json(); setSearchResults(d.items) }
      else toast.error("Search failed — check your connection and try again")
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("Search failed — check your connection and try again")
    }
  }

  // Debounced so typing doesn't fire a query per keystroke; AbortController above
  // guarantees a slower earlier request can never overwrite fresher results.
  const searchItems = (q: string) => {
    setSearchQuery(q)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (!q.trim()) { setSearchResults([]); searchAbortRef.current?.abort(); return }
    // eslint-disable-next-line react-hooks/immutability -- standard debounce-timer ref pattern
    searchDebounceRef.current = setTimeout(() => runSearch(q), 250)
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchAbortRef.current?.abort()
    }
  }, [])

  const handleBarcodeScan = async (code: string) => {
    setScanning(false)
    const res = await fetch(`/api/items/barcode/${encodeURIComponent(code)}`)
    if (!res.ok) { toast.error(`Barcode not found: ${code}`); return }
    addToCart(await res.json())
  }

  const openCheckout = () => setCheckoutOpen(true)

  const checkout = async () => {
    if (cart.length === 0) return
    setProcessing(true)
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ itemId: i._id, name: i.name.en, qty: i.qty, unit: i.unit || "pcs", unitSize: i.unitSize || 1, price: unitPrice(i) })),
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
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-hidden relative">

      {/* ── Compact search + scan bar (adding items is a small, optional step) ── */}
      <div className="relative shrink-0 border-b bg-background/95 backdrop-blur-sm z-30">
        <div className="relative max-w-2xl mx-auto">
        <div className="px-3 py-2.5 sm:px-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              className="pl-10 pr-9 h-11 rounded-xl text-base sm:text-sm focus:border-primary"
              placeholder="Search items to add…"
              value={searchQuery}
              onChange={(e) => searchItems(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.length > 0) {
                  e.preventDefault()
                  addToCart(searchResults[0])
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchQuery(""); setSearchResults([]); searchRef.current?.focus() }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {/* Scan button — optional shortcut, kept small */}
          <button
            type="button"
            onClick={() => setScanning(true)}
            aria-label="Scan barcode"
            title="Scan barcode"
            className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
          >
            <ScanLine className="size-5" />
          </button>
        </div>

        {/* Search results — small dropdown overlay, doesn't take main space */}
        {searchFocused && searchQuery && (
          <div className="absolute inset-x-3 sm:inset-x-4 top-full mt-1.5 rounded-2xl border bg-card shadow-lg max-h-[60vh] overflow-y-auto overscroll-contain">
            {searchResults.length > 0 ? (
              <div className="p-2 space-y-1">
                {searchResults.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 active:bg-primary/8 transition-colors text-left group"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={cloudinaryThumb(item.imageUrl, 88)!}
                        alt={item.name.en}
                        width={44}
                        height={44}
                        className="size-11 rounded-lg object-cover shrink-0 border"
                      />
                    ) : (
                      <div className="size-11 rounded-lg bg-muted shrink-0 flex items-center justify-center border">
                        <Package className="size-5 text-muted-foreground/40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{item.name.en}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.discountActive && item.discountValue > 0 ? (
                          <span className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-primary">
                              Rs. {effectivePrice(item).toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              Rs. {item.price.toLocaleString()}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            Rs. {item.price.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">/{formatUnitLabel(item.unitSize, item.unit || "pcs")}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
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
                            ? `${item.stockQty} left`
                            : `${item.stockQty} in stock`}
                        </span>
                      </div>
                    </div>

                    <div className="size-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors">
                      <Plus className="size-4" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-6 gap-2 text-muted-foreground">
                <Search className="size-6 opacity-30" />
                <p className="text-sm font-medium text-foreground">No items found</p>
                <p className="text-xs">Try a different name or scan the barcode</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ── Cart — the main event, always front and center ── */}
      <div className="flex-1 min-w-0 overflow-hidden flex justify-center">
        <div className="w-full max-w-2xl h-full">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClear={() => setCart([])}
          onCheckout={openCheckout}
        />
        </div>
      </div>

      {/* ── Barcode Scanner ── */}
      <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onScan={handleBarcodeScan} />

      {/* ── Checkout Sheet (slides up from bottom — native feel on mobile) ── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 overflow-hidden max-h-[95dvh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          <SheetHeader className="px-5 pb-3 shrink-0 max-w-2xl mx-auto w-full">
            <SheetTitle className="text-xl font-bold">
              Checkout
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {cart.length} item type{cart.length !== 1 ? "s" : ""}
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto overscroll-contain border-t">
            <div className="px-5 py-4 space-y-4 max-w-2xl mx-auto">
              {/* Item summary */}
              <div className="rounded-2xl border bg-muted/30 divide-y divide-border">
                {cart.map((i) => (
                  <div key={i._id} className="flex justify-between items-center px-3 py-3 text-sm">
                    <span className="text-muted-foreground flex-1 truncate pr-3">
                      {i.name.en}
                      <span className="text-xs ml-1 text-muted-foreground/70">× {formatQty(i.qty, i.unit || "pcs")}</span>
                    </span>
                    <span className="font-semibold shrink-0">Rs. {(unitPrice(i) * i.qty).toLocaleString()}</span>
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

          <SheetFooter className="px-5 py-4 gap-3 border-t bg-card flex-row max-w-2xl mx-auto w-full">
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
