import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import LoginForm from "./_components/LoginForm"
import { Zap, ShieldCheck, Languages } from "lucide-react"
import BrandLogo from "../../../components/BrandLogo"
import login_bg from "../../../assests/LOGIN_BG.jpg"


export const metadata: Metadata = { title: "Sign In" }

const features = [
  { icon: Zap, title: "Fast Billing", desc: "Scan, bill, print instantly" },
  { icon: ShieldCheck, title: "Secure Access", desc: "Role-based permissions" },
  { icon: Languages, title: "Bilingual", desc: "English and Sinhala" },
]

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative isolate hidden lg:flex flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground">
        <Image
          src={login_bg}
          alt=""
          fill
          priority
          sizes="50vw"
          className="-z-30 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-20 bg-primary/45 mix-blend-multiply" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-black/55 via-black/5 to-black/60" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <BrandLogo
          href="/"
          label="ShopSy"
          className="w-fit"
          variant="professional"
          labelClassName="font-semibold text-lg"
          imageSizeClassName="size-11"
          backgroundClassName="bg-white/15 backdrop-blur-sm"
          imageClassName="object-contain p-2"
        />

        <div className="max-w-sm">
          <h1 className="text-4xl font-bold tracking-tight text-balance">Run your store with confidence</h1>
          <p className="mt-3 text-primary-foreground/80 text-balance leading-relaxed">Complete POS system for retail operations.</p>

          <div className="mt-9 space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-white/5"
              >
                <div className="size-9 rounded-lg bg-white/15 ring-1 ring-white/10 flex items-center justify-center shrink-0">
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
      <div className="relative isolate flex items-center justify-center p-6 overflow-hidden bg-background">
        <Image
          src={login_bg}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="-z-30 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-20 bg-background/85 backdrop-blur-2xl" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-br from-primary/10 via-transparent to-accent/15"
        />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 -z-10 size-72 rounded-full bg-accent/20 blur-3xl lg:hidden"
        />

        <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
          <div className="text-center mb-7 lg:hidden">
            <BrandLogo
              href="/"
              label="ShopSy"
              className="inline-flex mb-4"
              variant="professional"
              labelClassName="font-semibold text-2xl"
              imageSizeClassName="size-16"
              backgroundClassName="bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              imageClassName="object-contain p-2.5"
            />
            <h1 className="text-2xl font-bold tracking-tight">ShopSy</h1>
          </div>

          <LoginForm />

          <div className="mt-6 space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Staff &amp; admin access only — contact your administrator for a new account.
            </p>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">← Back to store</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
