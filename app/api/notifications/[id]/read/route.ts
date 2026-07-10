import { connectDB } from "@/lib/db"
import { Notification } from "@/models/Notification"
import { requireApiAdmin } from "@/lib/dal"

export async function PATCH(_req: Request, ctx: RouteContext<"/api/notifications/[id]/read">) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await ctx.params
  await connectDB()

  if (id === "all") {
    await Notification.updateMany({ isRead: false }, { $set: { isRead: true } })
    return Response.json({ ok: true })
  }

  const notification = await Notification.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true })
  if (!notification) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(notification)
}
