import { verifySession } from "@/lib/dal"
import CounterNav from "./_components/CounterNav"

export default async function CounterLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession()
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CounterNav name={session.name} role={session.role} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
