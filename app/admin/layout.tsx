import { verifyAdmin } from "@/lib/dal"
import LogoutButton from "@/components/LogoutButton"
import NotificationBell from "@/components/NotificationBell"
import AdminMobileNav from "./_components/AdminMobileNav"
import AdminSidebarNav from "./_components/AdminSidebarNav"
import BrandLogo from "../../components/BrandLogo"

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

        <AdminSidebarNav />

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
