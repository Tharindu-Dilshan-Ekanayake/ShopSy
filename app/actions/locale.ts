"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function setLocaleAction(locale: "en" | "si") {
  const store = await cookies()
  store.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 })
  revalidatePath("/")
}
