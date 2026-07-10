import { connectDB } from "@/lib/db"
import { Category } from "@/models/Category"
import { requireApiAdmin } from "@/lib/dal"
import { z } from "zod"

const Schema = z.object({
  name: z.object({ en: z.string().min(1), si: z.string().min(1) }),
  slug: z.string().optional(),
})

export async function GET() {
  await connectDB()
  const categories = await Category.find().sort({ createdAt: -1 })
  return Response.json(categories)
}

export async function POST(req: Request) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 })

  const { name, slug } = parsed.data
  const finalSlug = slug || name.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  await connectDB()
  try {
    const category = await Category.create({ name, slug: finalSlug })
    return Response.json(category, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 11000) return Response.json({ error: "Slug already exists" }, { status: 409 })
    throw e
  }
}
