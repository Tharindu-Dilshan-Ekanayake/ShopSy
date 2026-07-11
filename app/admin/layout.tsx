import { verifyAdmin } from "@/lib/dal"
import Link from "next/link"
import { LayoutDashboard, Tag, Package, Users, ShoppingCart, Receipt } from "lucide-react"
import LogoutButton from "@/components/LogoutButton"
import NotificationBell from "@/components/NotificationBell"
import AdminMobileNav from "./_components/AdminMobileNav"
import BrandLogo from "../../components/BrandLogo"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/categories", icon: Tag, label: "Categories" },
  { href: "/admin/items", icon: Package, label: "Items" },
  { href: "/admin/sales", icon: Receipt, label: "Bill History" },
  { href: "/admin/users", icon: Users, label: "Users" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyAdmin()

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <BrandLogo
            href="/admin"
            label="ShopSy Admin"
            variant="professional"
            labelClassName="font-semibold text-sm"
            imageSizeClassName="size-9"
            backgroundClassName="bg-primary"
            imageClassName="object-contain p-1.5"
          />
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-sidebar-border">
            <Link
              href="/counter"
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <ShoppingCart className="size-4 shrink-0" />
              Counter
            </Link>
          </div>
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <div className="px-3 py-1.5">
            <p className="text-xs font-medium text-sidebar-foreground">{session.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{session.role}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 gap-2 shrink-0">
          {/* Mobile hamburger */}
          <AdminMobileNav name={session.name} role={session.role} />

          {/* Brand on mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo
              href="/admin"
              label="ShopSy Admin"
              variant="professional"
              labelClassName="font-semibold text-sm"
              imageSizeClassName="size-9"
              backgroundClassName="bg-primary"
              imageClassName="object-contain p-1.5"
            />
          </div>

          <div className="flex-1" />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
