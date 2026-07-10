import { Schema, Document, model, models, Types } from "mongoose"

export interface IItem extends Document {
  name: { en: string; si: string }
  category: Types.ObjectId
  price: number
  costPrice: number
  stockQty: number
  lowStockThreshold: number
  barcode: string
  imageUrl?: string
  imagePublicId?: string
  status: "active" | "discontinued"
  createdAt: Date
}

const ItemSchema = new Schema<IItem>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      si: { type: String, required: true, trim: true },
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, default: 5 },
    barcode: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    status: { type: String, enum: ["active", "discontinued"], default: "active" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

ItemSchema.index({ barcode: 1 })
ItemSchema.index({ category: 1 })
ItemSchema.index({ status: 1 })

export const Item = models.Item ?? model<IItem>("Item", ItemSchema)
