import { connectDB } from "@/lib/db"
import { Notification } from "@/models/Notification"
import "@/models/Item" // registers the Item schema so .populate("item") never throws MissingSchemaError on a cold start
import { requireApiAdmin } from "@/lib/dal"

export async function GET() {
  const { error } = await requireApiAdmin()
  if (error) return error

  await connectDB()
  const [notifications, unreadCount] = await Promise.all([
    Notification.find().populate("item", "name imageUrl").sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ isRead: false }),
  ])
  return Response.json({ notifications, unreadCount })
}
