import { connectDB } from "@/lib/db"
import { Notification } from "@/models/Notification"
import { requireApiAdmin } from "@/lib/dal"

export async function GET() {
  const { error } = await requireApiAdmin()
  if (error) return error

  await connectDB()
  const [notifications, unreadCount] = await Promise.all([
    Notification.find().populate("item", "name imageUrl").sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ isRead: false }),
  ])
  return Response.json({ notifications, unreadCount })
}
