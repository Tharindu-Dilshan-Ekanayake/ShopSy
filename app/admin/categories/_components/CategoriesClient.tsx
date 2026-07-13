"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

const PAGE_SIZE = 10

interface Category {
  _id: string
  name: { en: string; si: string }
  slug: string
  createdAt: string
}

const empty = { en: "", si: "" }

export default function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ en: "", si: "" })
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/categories")
    if (res.ok) setCategories(await res.json())
    setLoading(false)
  }

  useEffect(() => { queueMicrotask(() => load()) }, [])

  const pages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const pagedCategories = categories.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true) }
  const openEdit = (cat: Category) => { setEditing(cat); setForm({ en: cat.name.en, si: cat.name.si }); setDialogOpen(true) }

  const save = async () => {
    if (!form.en.trim() || !form.si.trim()) { toast.error("Both name fields required"); return }
    setSaving(true)
    const url = editing ? `/api/categories/${editing._id}` : "/api/categories"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: { en: form.en, si: form.si } }) })
    if (res.ok) {
      toast.success(editing ? "Category updated" : "Category created")
      setDialogOpen(false)
      if (!editing) setPage(1)
      load()
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed")
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/categories/${deleteId}`, { method: "DELETE" })
    if (res.ok) { toast.success("Deleted"); load() }
    else toast.error("Failed to delete")
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} total</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="size-4" />Add Category</Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (SI)</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}
              </TableRow>
            ))}
            {!loading && categories.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No categories yet</TableCell></TableRow>
            )}
            {!loading && pagedCategories.map((cat) => (
              <TableRow key={cat._id}>
                <TableCell className="font-medium">{cat.name.en}</TableCell>
                <TableCell>{cat.name.si}</TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono">{cat.slug}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{new Date(cat.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cat)}><Pencil className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(cat._id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">Page {safePage} of {pages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">{safePage} / {pages}</span>
              <Button variant="outline" size="icon-sm" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name (English)</Label>
              <Input value={form.en} onChange={(e) => setForm((f) => ({ ...f, en: e.target.value }))} placeholder="e.g. Electronics" />
            </div>
            <div className="space-y-1.5">
              <Label>Name (Sinhala)</Label>
              <Input value={form.si} onChange={(e) => setForm((f) => ({ ...f, si: e.target.value }))} placeholder="e.g. ඉලෙක්ට්‍රොනික" />
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
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Items in this category will lose their category reference.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
