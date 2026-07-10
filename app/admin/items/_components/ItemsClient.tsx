"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, Search, RefreshCw, ImageOff, Printer } from "lucide-react"
import { toast } from "sonner"
import BarcodePrintDialog from "./BarcodePrintDialog"

interface Category { _id: string; name: { en: string } }
interface Item { _id: string; name: { en: string; si: string }; category: Category | null; price: number; costPrice: number; stockQty: number; lowStockThreshold: number; barcode: string; imageUrl?: string; barcodeImageUrl?: string; status: string; createdAt: string }

const emptyForm = () => ({ nameEn: "", nameSi: "", category: "", price: "", costPrice: "", stockQty: "0", lowStockThreshold: "5", barcode: "", status: "active", image: null as File | null })

export default function ItemsClient() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
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
    const params = new URLSearchParams({ page: String(p), limit: "20", status: "all" })
    if (search) params.set("search", search)
    if (catFilter !== "all") params.set("category", catFilter)
    const res = await fetch(`/api/items?${params}`)
    if (res.ok) { const d = await res.json(); setItems(d.items); setPages(d.pages) }
    setLoading(false)
  }

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories)
  }, [])

  useEffect(() => { setPage(1); load(1) }, [search, catFilter])

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setPreviewUrl(null); setDialogOpen(true) }
  const openEdit = (item: Item) => {
    setEditing(item)
    setForm({ nameEn: item.name.en, nameSi: item.name.si, category: item.category?._id || "", price: String(item.price), costPrice: String(item.costPrice), stockQty: String(item.stockQty), lowStockThreshold: String(item.lowStockThreshold), barcode: item.barcode, status: item.status, image: null })
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
    if (!form.nameEn || !form.nameSi || !form.category || !form.price || !form.costPrice) { toast.error("Fill all required fields"); return }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Items</h1>
          <p className="text-sm text-muted-foreground">{items.length} shown</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="size-4" />Add Item</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search items or barcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name.en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-3 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
          </div>
        ))}
        {!loading && items.map((item) => (
          <div key={item._id} className="rounded-xl border bg-card overflow-hidden group relative">
            {/* Image */}
            <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name.en} width={300} height={169} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
              ) : (
                <ImageOff className="size-8 text-muted-foreground/40" />
              )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-1">
              <div className="flex items-start justify-between gap-1">
                <p className="font-medium text-sm leading-tight">{item.name.en}</p>
                <Badge variant={item.status === "active" ? "outline" : "secondary"} className="text-xs shrink-0">
                  {item.status === "active" ? "Active" : "Off"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.category?.name.en || "—"}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-sm">Rs. {item.price.toLocaleString()}</span>
                <span className={`text-xs font-medium ${item.stockQty <= item.lowStockThreshold ? "text-destructive" : "text-muted-foreground"}`}>
                  Stock: {item.stockQty}
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground">{item.barcode}</p>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="secondary" size="icon-sm" title="Print barcode" onClick={() => setPrintItem(item)}><Printer className="size-3.5" /></Button>
              <Button variant="secondary" size="icon-sm" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
              <Button variant="secondary" size="icon-sm" className="text-destructive" onClick={() => setDeleteId(item._id)}><Trash2 className="size-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1) }}>Prev</Button>
          <span className="text-sm text-muted-foreground py-1 px-3">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => { setPage(page + 1); load(page + 1) }}>Next</Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
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
                  : <div className="text-center"><ImageOff className="size-8 text-muted-foreground/40 mx-auto mb-1" /><p className="text-xs text-muted-foreground">Click to upload image</p></div>
                }
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
                <SelectContent>{categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name.en}</SelectItem>)}</SelectContent>
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
                <Input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="Auto-generated if empty" className="font-mono" />
                <Button type="button" variant="outline" size="sm" onClick={genBarcode} title="Generate"><RefreshCw className="size-4" /></Button>
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

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>The item and its image will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode print dialog */}
      <BarcodePrintDialog item={printItem} onClose={() => setPrintItem(null)} />
    </div>
  )
}
