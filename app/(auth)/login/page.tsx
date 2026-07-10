import type { Metadata } from "next"
import LoginForm from "./_components/LoginForm"

export const metadata: Metadata = { title: "Sign In" }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ShopSy POS</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}
