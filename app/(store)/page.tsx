import type { Metadata } from "next"
import { connectDB } from "@/lib/db"
import { Item } from "@/models/Item"
import { Category } from "@/models/Category"
import { getLocale } from "@/lib/i18n"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ImageOff, Search, Sparkles, Layers, ChevronLeft, ChevronRight } from "lucide-react"
import LocaleToggle from "./_components/LocaleToggle"
import BG from "../../assests/BG.webp"
import BrandLogo from "../../components/BrandLogo"

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
  en: {
    all: "All", noProducts: "No products found", clearSearch: "Clear search", inStock: "In Stock", outOfStock: "Out of Stock",
    searchPlaceholder: "Search products…", previous: "Previous", next: "Next", staffLogin: "Staff Login",
    heroTag: "Fresh stock, updated daily", heroTitle: "Everything your home needs, in one place",
    heroSubtitle: "Browse our full range of products with real-time stock — pick up in store, no waiting around.",
  },
  si: {
    all: "සියල්ල", noProducts: "නිෂ්පාදන හමු නොවිණි", clearSearch: "සෙවීම ඉවත් කරන්න", inStock: "තොගයේ ඇත", outOfStock: "තොගය නැත",
    searchPlaceholder: "නිෂ්පාදන සොයන්න…", previous: "පෙර", next: "ඊළඟ", staffLogin: "කාර්ය මණ්ඩල පිවිසුම",
    heroTag: "දිනපතා අලුත් වන තොගය", heroTitle: "ඔබේ නිවසට අවශ්‍ය සියල්ල, එක් තැනකින්",
    heroSubtitle: "සියලුම නිෂ්පාදන තත්‍ය කාලීන තොග තත්ත්වය සමඟ බලන්න — කඩයෙන්ම රැගෙන යන්න.",
  },
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <BrandLogo
            href="/"
            label="ShopSy"
            className="shrink-0"
            variant="professional"
            labelClassName="font-semibold text-lg hidden sm:block"
            imageSizeClassName="size-12"
            backgroundClassName=" shadow-sm shadow-primary/10"
            imageClassName="object-contain p-1.5"
          />

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
                className="w-full h-10 pl-9 pr-4 rounded-full border border-border bg-muted/50 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-background"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <LocaleToggle current={locale} />
            <Link href="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">{t.staffLogin}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border/60 bg-cover bg-right bg-no-repeat"
        style={{ backgroundImage: `url(${BG.src})` }}
      >
        {/* mobile: fade only behind the text band at the bottom, rest of the photo stays clear */}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-background from-0% to-transparent to-65% md:hidden" />
        {/* desktop: fade only on the left where the text sits, bags stay clear on the right */}
        <div aria-hidden className="absolute inset-0 hidden md:block bg-linear-to-r from-background from-0% to-transparent to-60%" />
        <div className="relative min-h-90 sm:min-h-105 lg:min-h-120 max-w-6xl mx-auto px-4 py-10 sm:py-14 flex flex-col justify-end md:justify-center items-center md:items-start text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-primary mb-4">
            <Sparkles className="size-3.5" /> {t.heroTag}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance max-w-xl">{t.heroTitle}</h1>
          <p className="mt-4 text-muted-foreground max-w-lg text-balance">{t.heroSubtitle}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            href={search ? `/?search=${encodeURIComponent(search)}` : "/"}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-all ${!categorySlug ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25" : "border-border hover:border-primary hover:text-primary"}`}
          >
            <Layers className="size-3.5" /> {t.all}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/?category=${cat.slug}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${categorySlug === cat.slug ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25" : "border-border hover:border-primary hover:text-primary"}`}
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
            {items.map((item, i) => (
              <div
                key={item._id}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                className="animate-fade-in-up rounded-2xl border border-border bg-card overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name[locale]} fill priority={i < 4} sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {item.stockQty === 0 && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">{t.outOfStock}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-3.5 space-y-1">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{item.name[locale]}</p>
                  {item.category && (
                    <p className="text-xs text-muted-foreground">{item.category.name[locale]}</p>
                  )}
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-base font-bold text-primary">Rs. {item.price.toLocaleString()}</span>
                    {item.stockQty > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{t.inStock}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Link
              href={page > 1 ? `/?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}` : "#"}
              aria-disabled={page <= 1}
              className={`inline-flex items-center gap-1 px-4 py-2 text-sm rounded-full border transition-colors ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-muted hover:border-primary/40"}`}
            >
              <ChevronLeft className="size-4" /> {t.previous}
            </Link>
            <span className="text-sm font-medium text-muted-foreground px-3">{page} / {pages}</span>
            <Link
              href={page < pages ? `/?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}` : "#"}
              aria-disabled={page >= pages}
              className={`inline-flex items-center gap-1 px-4 py-2 text-sm rounded-full border transition-colors ${page >= pages ? "opacity-40 pointer-events-none" : "hover:bg-muted hover:border-primary/40"}`}
            >
              {t.next} <ChevronRight className="size-4" />
            </Link>
          </div>
        )}
      </div>

      <footer className="border-t border-border/60 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <BrandLogo
            href="/"
            label="ShopSy"
            variant="professional"
            labelClassName="text-sm font-medium text-muted-foreground"
            imageSizeClassName="size-8"
            backgroundClassName="bg-primary"
            imageClassName="object-contain p-1.5"
          />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ShopSy. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
