import mongoose, { Schema, Document, model, models } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: "admin" | "counter"
  isActive: boolean
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "counter"], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const User = models.User ?? model<IUser>("User", UserSchema)
