import { Schema, Document, model, models } from "mongoose"

export interface ICategory extends Document {
  name: { en: string; si: string }
  slug: string
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      si: { type: String, required: true, trim: true },
    },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Category = models.Category ?? model<ICategory>("Category", CategorySchema)
