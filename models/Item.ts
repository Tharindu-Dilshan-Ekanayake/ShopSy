import { Schema, Document, model, models, Types } from "mongoose"

export interface IItem extends Document {
  name: { en: string; si: string }
  category: Types.ObjectId
  price: number
  unit: "pcs" | "g" | "kg" | "ml" | "l"
  unitSize: number
  costPrice: number
  stockQty: number
  lowStockThreshold: number
  barcode: string
  imageUrl?: string
  imagePublicId?: string
  barcodeImageUrl?: string
  barcodeImagePublicId?: string
  status: "active" | "discontinued"
  discountType: "percentage" | "flat"
  discountValue: number
  discountActive: boolean
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
    unit: { type: String, enum: ["pcs", "g", "kg", "ml", "l"], default: "pcs" },
    unitSize: { type: Number, default: 1, min: 0.001 },
    costPrice: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, default: 5 },
    barcode: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    barcodeImageUrl: { type: String },
    barcodeImagePublicId: { type: String },
    status: { type: String, enum: ["active", "discontinued"], default: "active" },
    discountType: { type: String, enum: ["percentage", "flat"], default: "percentage" },
    discountValue: { type: Number, default: 0, min: 0 },
    discountActive: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// barcode already has a unique index via the schema field definition above
ItemSchema.index({ category: 1 })
ItemSchema.index({ status: 1, createdAt: -1 })

export const Item = models.Item ?? model<IItem>("Item", ItemSchema)
