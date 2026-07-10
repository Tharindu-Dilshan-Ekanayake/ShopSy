"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface Notif {
  _id: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  const load = async () => {
    const res = await fetch("/api/notifications")
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications)
    setUnread(data.unreadCount)
  }

  useEffect(() => { load() }, [])

  const markAll = async () => {
    await fetch("/api/notifications/all/read", { method: "PATCH" })
    setUnread(0)
    setNotifications((n) => n.map((x) => ({ ...x, isRead: true })))
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) load() }}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader className="flex-row items-center justify-between pr-0">
          <SheetTitle>Notifications</SheetTitle>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} className="text-xs">
              Mark all read
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
          )}
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-3 rounded-lg text-sm border ${n.isRead ? "bg-background border-border" : "bg-primary/5 border-primary/20"}`}
            >
              <p className={n.isRead ? "text-muted-foreground" : "text-foreground font-medium"}>{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              {!n.isRead && <Badge variant="secondary" className="mt-1 text-xs">New</Badge>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
