"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Tag, Package, Users, ShoppingCart, Receipt } from "lucide-react"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/categories", icon: Tag, label: "Categories" },
  { href: "/admin/items", icon: Package, label: "Items" },
  { href: "/admin/sales", icon: Receipt, label: "Bill History" },
  { href: "/admin/users", icon: Users, label: "Users" },
]

function isActiveHref(pathname: string, href: string) {
  if (href === "/admin") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-2 space-y-0.5">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = isActiveHref(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-2.5 pl-3.5 pr-3 py-2 text-sm rounded-lg transition-colors ${
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
            )}
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}

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
  )
}
