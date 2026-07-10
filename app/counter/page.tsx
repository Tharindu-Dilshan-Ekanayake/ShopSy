import { verifySession } from "@/lib/dal"
import BillScreen from "./_components/BillScreen"

export default async function CounterPage() {
  const session = await verifySession()
  return <BillScreen cashierId={session.userId} cashierName={session.name} />
}
