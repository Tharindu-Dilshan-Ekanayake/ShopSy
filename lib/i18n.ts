import { cookies } from "next/headers"

export type Locale = "en" | "si"

const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
  si: () => import("@/dictionaries/si.json").then((m) => m.default),
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const locale = store.get("locale")?.value
  return locale === "si" ? "si" : "en"
}

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
