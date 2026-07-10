"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, LayoutDashboard, Tag, Package, Users, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import LogoutButton from "@/components/LogoutButton"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/categories", icon: Tag, label: "Categories" },
  { href: "/admin/items", icon: Package, label: "Items" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/counter", icon: ShoppingCart, label: "Counter" },
]

export default function AdminMobileNav({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false)

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
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">S</div>
                <span className="font-semibold text-sm">ShopSy Admin</span>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-0.5">
              {navItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              ))}
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
