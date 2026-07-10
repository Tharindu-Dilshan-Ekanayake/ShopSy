import type { Metadata } from "next"
import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import { Category } from "@/models/Category"
import { getLocale } from "@/lib/i18n"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ImageOff, Search } from "lucide-react"
import LocaleToggle from "./_components/LocaleToggle"

export const metadata: Metadata = { title: "Store" }

interface PageProps {
  searchParams: { page?: string; category?: string; search?: string }
}

interface ItemDoc {
  _id: string
  name: { en: string; si: string }
  price: number
  stockQty: number
  imageUrl?: string
  category?: { _id: string; name: { en: string; si: string } }
}

interface CategoryDoc {
  _id: string
  name: { en: string; si: string }
  slug: string
}

const labels = {
  en: { all: "All", noProducts: "No products found", clearSearch: "Clear search", inStock: "In Stock", outOfStock: "Out of Stock", searchPlaceholder: "Search products…", previous: "Previous", next: "Next", staffLogin: "Staff Login" },
  si: { all: "සියල්ල", noProducts: "නිෂ්පාදන හමු නොවිණි", clearSearch: "සෙවීම ඉවත් කරන්න", inStock: "තොගයේ ඇත", outOfStock: "තොගය නැත", searchPlaceholder: "නිෂ්පාදන සොයන්න…", previous: "පෙර", next: "ඊළඟ", staffLogin: "කාර්ය මණ්ඩල පිවිසුම" },
}

export default async function StorePage({ searchParams }: PageProps) {
  const sp = await (searchParams as unknown as Promise<{ page?: string; category?: string; search?: string }>)
  const page = Math.max(1, Number(sp.page || 1))
  const categorySlug = sp.category || ""
  const search = sp.search || ""
  const limit = 16

  const locale = await getLocale()
  const t = labels[locale]

  await connectDB()

  const [categories, categoryDoc] = await Promise.all([
    Category.find().sort({ createdAt: 1 }).lean<CategoryDoc[]>(),
    categorySlug ? Category.findOne({ slug: categorySlug }).lean<CategoryDoc>() : Promise.resolve(null),
  ])

  const filter: Record<string, unknown> = { status: "active" }
  if (categoryDoc) filter.category = categoryDoc._id
  if (search) filter.$or = [
    { "name.en": { $regex: search, $options: "i" } },
    { "name.si": { $regex: search, $options: "i" } },
  ]

  const [items, total] = await Promise.all([
    Item.find(filter).populate("category", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean<ItemDoc[]>(),
    Item.countDocuments(filter),
  ])

  const pages = Math.ceil(total / limit)

  return (
    <main className="min-h-screen bg-linear-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">S</div>
            <span className="font-semibold text-lg hidden sm:block">ShopSy</span>
          </div>

          {/* Search */}
          <form className="flex-1 max-w-md" method="GET" action="/">
            {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                name="search"
                defaultValue={search}
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <LocaleToggle current={locale} />
            <Link href="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">{t.staffLogin}</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            href={search ? `/?search=${encodeURIComponent(search)}` : "/"}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${!categorySlug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary hover:text-primary"}`}
          >
            {t.all}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/?category=${cat.slug}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${categorySlug === cat.slug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary hover:text-primary"}`}
            >
              {cat.name[locale]}
            </Link>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {total === 0 ? t.noProducts : `${total} ${locale === "si" ? "නිෂ්පාදන" : `product${total !== 1 ? "s" : ""}`}${search ? (locale === "si" ? ` "${search}" සඳහා` : ` for "${search}"`) : ""}`}
        </p>

        {/* Product grid */}
        {items.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            <ImageOff className="size-12 opacity-20 mx-auto mb-4" />
            <p className="font-medium">{t.noProducts}</p>
            {search && (
              <Link href="/" className="text-primary text-sm hover:underline mt-2 inline-block">{t.clearSearch}</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => (
              <div key={item._id} className="rounded-xl border border-border bg-card overflow-hidden group hover:border-primary/50 hover:shadow-sm transition-all">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name[locale]} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{item.name[locale]}</p>
                  {item.category && (
                    <p className="text-xs text-muted-foreground">{item.category.name[locale]}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-primary">Rs. {item.price.toLocaleString()}</span>
                    <Badge variant={item.stockQty > 0 ? "secondary" : "destructive"} className="text-xs">
                      {item.stockQty > 0 ? t.inStock : t.outOfStock}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
              >
                {t.previous}
              </Link>
            )}
            <span className="text-sm text-muted-foreground px-3">{page} / {pages}</span>
            {page < pages && (
              <Link
                href={`/?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
              >
                {t.next}
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
