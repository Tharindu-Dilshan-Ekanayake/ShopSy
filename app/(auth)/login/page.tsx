import type { Metadata } from "next"
import Link from "next/link"
import LoginForm from "./_components/LoginForm"
import { Zap, ShieldCheck, Languages } from "lucide-react"

export const metadata: Metadata = { title: "Sign In" }

const features = [
  { icon: Zap, title: "Fast counter billing", desc: "Scan, bill, and print in seconds" },
  { icon: ShieldCheck, title: "Secure by design", desc: "Role-based access for staff and admins" },
  { icon: Languages, title: "Built for Sri Lanka", desc: "English and Sinhala, side by side" },
]

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="animate-blob-float absolute -top-32 -left-20 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="animate-blob-float absolute bottom-0 right-0 size-80 rounded-full bg-white/10 blur-3xl [animation-delay:3s]" />
        </div>

        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="size-9 rounded-xl bg-white/15 backdrop-blur-sm font-bold text-lg flex items-center justify-center">S</div>
          <span className="font-semibold text-lg">ShopSy POS</span>
        </Link>

        <div className="max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight text-balance">Run your store with confidence</h1>
          <p className="mt-3 text-primary-foreground/80 text-balance">One system for your storefront, billing counter, and inventory — built for speed.</p>

          <div className="mt-8 space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="size-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-primary-foreground/70">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} ShopSy</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 bg-linear-to-br from-primary/5 via-background to-accent/10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg shadow-primary/30">S</div>
            <h1 className="text-2xl font-bold tracking-tight">ShopSy POS</h1>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link href="/" className="hover:text-foreground transition-colors">← Back to store</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
