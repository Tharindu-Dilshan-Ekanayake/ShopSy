import { Schema, Document, model, models, Types } from "mongoose"

interface SaleLineItem {
  item: Types.ObjectId
  name: string
  qty: number
  unit: string
  unitSize: number
  price: number
  subtotal: number
}

export interface ISale extends Document {
  billNumber: number
  items: SaleLineItem[]
  total: number
  discount: number
  paymentMethod: "cash" | "card"
  cashier: Types.ObjectId
  createdAt: Date
}

const SaleSchema = new Schema<ISale>(
  {
    billNumber: { type: Number, required: true, unique: true },
    items: [
      {
        item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 0.001 },
        unit: { type: String, default: "pcs" },
        unitSize: { type: Number, default: 1 },
        price: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: ["cash", "card"], required: true },
    cashier: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

SaleSchema.index({ cashier: 1, createdAt: -1 })
SaleSchema.index({ createdAt: -1 })

export const Sale = models.Sale ?? model<ISale>("Sale", SaleSchema)
