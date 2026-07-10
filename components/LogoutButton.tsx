"use client"

import { logoutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useTransition } from "react"

export default function LogoutButton() {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      disabled={pending}
      onClick={() => start(() => logoutAction())}
    >
      <LogOut className="size-4" />
      {pending ? "Signing out…" : "Sign Out"}
    </Button>
  )
}
