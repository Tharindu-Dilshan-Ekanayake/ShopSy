"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { setLocaleAction } from "@/app/actions/locale"

export default function LocaleToggle({ current }: { current: "en" | "si" }) {
  const [pending, start] = useTransition()
  const router = useRouter()

  const toggle = (locale: "en" | "si") => {
    if (locale === current || pending) return
    start(async () => {
      await setLocaleAction(locale)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center text-sm border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => toggle("en")}
        disabled={pending}
        className={`min-w-11 min-h-11 px-3 flex items-center justify-center font-medium transition-colors ${current === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground active:bg-muted"}`}
      >
        EN
      </button>
      <div className="w-px h-5 bg-border" />
      <button
        type="button"
        onClick={() => toggle("si")}
        disabled={pending}
        className={`min-w-11 min-h-11 px-3 flex items-center justify-center font-medium transition-colors ${current === "si" ? "bg-primary text-primary-foreground" : "text-muted-foreground active:bg-muted"}`}
      >
        සිං
      </button>
    </div>
  )
}
