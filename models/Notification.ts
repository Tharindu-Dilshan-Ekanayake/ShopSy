import { Schema, Document, model, models, Types } from "mongoose"

export interface INotification extends Document {
  type: "low-stock"
  item: Types.ObjectId
  message: string
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, enum: ["low-stock"], required: true },
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

NotificationSchema.index({ isRead: 1, createdAt: -1 })

export const Notification = models.Notification ?? model<INotification>("Notification", NotificationSchema)
