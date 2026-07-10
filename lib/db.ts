import "server-only"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable")
}

interface Cached {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Module-level cache survives hot reloads in dev
const globalForMongoose = global as unknown as { mongoose?: Cached }
const cached: Cached = globalForMongoose.mongoose ?? { conn: null, promise: null }
if (!globalForMongoose.mongoose) globalForMongoose.mongoose = cached

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  cached.conn = await cached.promise
  return cached.conn
}
