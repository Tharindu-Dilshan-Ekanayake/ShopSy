"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User } from "@/models/User"
import { createSession, deleteSession, getSession } from "@/lib/session"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginState = {
  error?: string
} | undefined

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Invalid email or password." }
  }

  await connectDB()

  const user = await User.findOne({
    email: parsed.data.email,
    isActive: true,
  }).select("+passwordHash")

  if (!user) return { error: "Invalid email or password." }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!valid) return { error: "Invalid email or password." }

  await createSession({
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
  })

  redirect(user.role === "admin" ? "/admin" : "/counter")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}

export async function getMe() {
  return getSession()
}
