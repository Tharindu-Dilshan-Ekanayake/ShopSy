"use client"

import { useState } from "react"
import Link from "next/link"
import { History, LayoutDashboard, Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import LogoutButton from "@/components/LogoutButton"

export default function CounterNav({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">S</div>
          <span className="font-semibold text-sm">Counter</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/counter/history" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <History className="size-4" />History
          </Link>
          {role === "admin" && (
            <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <LayoutDashboard className="size-4" />Admin
            </Link>
          )}
          <LogoutButton />
        </nav>

        {/* Mobile hamburger */}
        <Button type="button" variant="ghost" size="icon" className="sm:hidden" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </header>

      {/* Mobile dropdown overlay */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-background shadow-xl flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 p-3 space-y-1">
              <Link
                href="/counter"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="size-4 text-muted-foreground" />
                Billing
              </Link>
              <Link
                href="/counter/history"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                <History className="size-4 text-muted-foreground" />
                Bill History
              </Link>
              {role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <LayoutDashboard className="size-4 text-muted-foreground" />
                  Admin Dashboard
                </Link>
              )}
            </nav>

            <div className="p-3 border-t">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
