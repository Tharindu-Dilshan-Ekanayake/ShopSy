import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI!

async function main() {
  console.log("Connecting to MongoDB…")
  await mongoose.connect(MONGODB_URI)

  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  })

  const User = mongoose.models.User ?? mongoose.model("User", UserSchema)

  const users = [
    {
      name: "Admin",
      email: "admin@gmail.com",
      password: "Admin@123",
      role: "admin",
    },
  ]

  for (const u of users) {
    const exists = await User.findOne({ email: u.email })
    if (exists) {
      console.log(`⚠  User ${u.email} already exists — skipping.`)
      continue
    }
    const passwordHash = await bcrypt.hash(u.password, 12)
    await User.create({ name: u.name, email: u.email, passwordHash, role: u.role })
    console.log(`✓  Created ${u.role}: ${u.email}`)
  }

  await mongoose.disconnect()
  console.log("Done.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
