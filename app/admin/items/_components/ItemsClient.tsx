"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Search, RefreshCw, ImageOff, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import BarcodePrintDialog from "./BarcodePrintDialog"

interface Category { _id: string; name: { en: string } }
interface Item {
  _id: string
  name: { en: string; si: string }
  category: Category | null
  price: number
  costPrice: number
  stockQty: number
  lowStockThreshold: number
  barcode: string
  imageUrl?: string
  barcodeImageUrl?: string
  status: string
  createdAt: string
}

const emptyForm = () => ({
  nameEn: "", nameSi: "", category: "", price: "", costPrice: "",
  stockQty: "0", lowStockThreshold: "5", barcode: "", status: "active",
  image: null as File | null,
})

export default function ItemsClient() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [printItem, setPrintItem] = useState<Item | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: "20" })
    if (statusFilter !== "all") params.set("status", statusFilter)
    else params.set("status", "all")
    if (search) params.set("search", search)
    if (catFilter !== "all") params.set("category", catFilter)
    const res = await fetch(`/api/items?${params}`)
    if (res.ok) {
      const d = await res.json()
      setItems(d.items)
      setPages(d.pages)
      setTotal(d.total ?? d.items.length)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories)
  }, [])

  useEffect(() => { setPage(1); load(1) }, [search, catFilter, statusFilter])

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setPreviewUrl(null); setDialogOpen(true) }
  const openEdit = (item: Item) => {
    setEditing(item)
    setForm({
      nameEn: item.name.en, nameSi: item.name.si,
      category: item.category?._id || "",
      price: String(item.price), costPrice: String(item.costPrice),
      stockQty: String(item.stockQty), lowStockThreshold: String(item.lowStockThreshold),
      barcode: item.barcode, status: item.status, image: null,
    })
    setPreviewUrl(item.imageUrl || null)
    setDialogOpen(true)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setForm((prev) => ({ ...prev, image: f }))
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  const genBarcode = () => setForm((f) => ({ ...f, barcode: `BC${Date.now().toString(36).toUpperCase()}` }))

  const save = async () => {
    if (!form.nameEn || !form.nameSi || !form.category || !form.price || !form.costPrice) {
      toast.error("Fill all required fields"); return
    }
    setSaving(true)
    const fd = new FormData()
    fd.append("name.en", form.nameEn)
    fd.append("name.si", form.nameSi)
    fd.append("category", form.category)
    fd.append("price", form.price)
    fd.append("costPrice", form.costPrice)
    fd.append("stockQty", form.stockQty)
    fd.append("lowStockThreshold", form.lowStockThreshold)
    fd.append("barcode", form.barcode)
    fd.append("status", form.status)
    if (form.image) fd.append("image", form.image)
    const url = editing ? `/api/items/${editing._id}` : "/api/items"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, body: fd })
    if (res.ok) { toast.success(editing ? "Item updated" : "Item created"); setDialogOpen(false); load() }
    else { const e = await res.json(); toast.error(e.error || "Failed") }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/items/${deleteId}`, { method: "DELETE" })
    if (res.ok) { toast.success("Deleted"); load() }
    else toast.error("Failed to delete")
    setDeleteId(null)
  }

  const goPage = (p: number) => { setPage(p); load(p) }

  /* ── Stock status helper ── */
  const stockLabel = (item: Item) => {
    if (item.stockQty === 0) return { label: "Out", cls: "text-destructive font-bold" }
    if (item.stockQty <= item.lowStockThreshold) return { label: `${item.stockQty} ⚠`, cls: "text-amber-600 font-semibold" }
    return { label: String(item.stockQty), cls: "text-foreground" }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Items</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} total`}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id}>{c.name.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground w-12">Img</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-40">Item</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-28 hidden md:table-cell">Category</th>
                <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-24">Price</th>
                <th className="text-right px-3 py-3 font-semibold text-muted-foreground w-16 hidden sm:table-cell">Stock</th>
                <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-28 hidden lg:table-cell">Barcode</th>
                <th className="text-center px-3 py-3 font-semibold text-muted-foreground w-20">Status</th>
                <th className="text-right px-3 py-3 font-semibold text-muted-foreground w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Skeleton rows while loading */}
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-3 py-3"><Skeleton className="size-9 rounded-lg" /></td>
                  <td className="px-3 py-3"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-20" /></td>
                  <td className="px-3 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-3 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-3 py-3 text-right hidden sm:table-cell"><Skeleton className="h-4 w-8 ml-auto" /></td>
                  <td className="px-3 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-3 py-3 text-center"><Skeleton className="h-5 w-14 mx-auto rounded-full" /></td>
                  <td className="px-3 py-3 text-right"><Skeleton className="h-7 w-20 ml-auto rounded-lg" /></td>
                </tr>
              ))}

              {/* Empty state */}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-16 text-center text-muted-foreground">
                    <ImageOff className="size-10 opacity-20 mx-auto mb-3" />
                    <p className="font-medium">No items found</p>
                    {search && <p className="text-xs mt-1">Try a different search</p>}
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && items.map((item) => {
                const stock = stockLabel(item)
                return (
                  <tr key={item._id} className="hover:bg-muted/30 transition-colors group">
                    {/* Thumbnail */}
                    <td className="px-3 py-2.5">
                      <div className="size-9 rounded-lg overflow-hidden border bg-muted shrink-0 flex items-center justify-center">
                        {item.imageUrl
                          ? <Image src={item.imageUrl} alt={item.name.en} width={36} height={36} className="object-cover w-full h-full" />
                          : <ImageOff className="size-4 text-muted-foreground/30" />}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-3 py-2.5">
                      <p className="font-medium leading-tight">{item.name.en}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.name.si}</p>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                      {item.category?.name.en || <span className="text-muted-foreground/40">—</span>}
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2.5 text-right">
                      <p className="font-semibold">Rs.{item.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">cost Rs.{item.costPrice.toLocaleString()}</p>
                    </td>

                    {/* Stock */}
                    <td className={`px-3 py-2.5 text-right hidden sm:table-cell ${stock.cls}`}>
                      {stock.label}
                    </td>

                    {/* Barcode */}
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{item.barcode || "—"}</span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        variant={item.status === "active" ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {item.status === "active" ? "Active" : "Off"}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Print barcode label"
                          onClick={() => setPrintItem(item)}
                        >
                          <Printer className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(item._id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination — inside the card */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {/* Page number chips — show at most 5 */}
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…")
                  acc.push(p); return acc
                }, [])
                .map((p, i) =>
                  p === "…"
                    ? <span key={`dot-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                    : <button
                        key={p}
                        type="button"
                        onClick={() => goPage(p as number)}
                        className={`size-8 rounded-lg text-sm font-medium transition-colors ${
                          p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                )}
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= pages}
                onClick={() => goPage(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Image */}
            <div className="space-y-1.5">
              <Label>Image</Label>
              <div
                className="aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted"
                onClick={() => fileRef.current?.click()}
              >
                {previewUrl
                  ? <Image src={previewUrl} alt="Preview" width={400} height={225} className="object-cover w-full h-full" />
                  : <div className="text-center">
                      <ImageOff className="size-8 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Click to upload image</p>
                    </div>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" aria-label="Upload item image" className="hidden" onChange={handleFile} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Name (English) *</Label>
                <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} placeholder="Product name" />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Name (Sinhala) *</Label>
                <Input value={form.nameSi} onChange={(e) => setForm((f) => ({ ...f, nameSi: e.target.value }))} placeholder="නිෂ්පාදනයේ නම" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Selling Price (Rs.) *</Label>
                <Input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (Rs.) *</Label>
                <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock Qty</Label>
                <Input type="number" min="0" value={form.stockQty} onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Alert</Label>
                <Input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Auto-generated if empty"
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="sm" onClick={genBarcode} title="Generate barcode">
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v ?? "active" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              The item and its images will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode print */}
      <BarcodePrintDialog item={printItem} onClose={() => setPrintItem(null)} />
    </div>
  )
}
