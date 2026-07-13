"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, Tag, Package, Users, ShoppingCart, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import LogoutButton from "@/components/LogoutButton"
import BrandLogo from "../../../components/BrandLogo"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/categories", icon: Tag, label: "Categories" },
  { href: "/admin/items", icon: Package, label: "Items" },
  { href: "/admin/sales", icon: Receipt, label: "Bill History" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/counter", icon: ShoppingCart, label: "Counter" },
]

function isActiveHref(pathname: string, href: string) {
  if (href === "/admin") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminMobileNav({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40 cursor-default" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col shadow-xl">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
              <BrandLogo
                href="/admin"
                label="ShopSy Admin"
                variant="professional"
                labelClassName="font-semibold text-sm"
                imageSizeClassName="size-9"
                backgroundClassName="bg-primary"
                imageClassName="object-contain p-1.5"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-0.5">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = isActiveHref(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 text-sm rounded-lg transition-colors ${
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
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-sidebar-border space-y-1">
              <div className="px-3 py-1.5">
                <p className="text-xs font-medium text-sidebar-foreground">{name}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
