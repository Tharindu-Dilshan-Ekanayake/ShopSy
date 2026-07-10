import { Metadata } from "next"
import ItemsClient from "./_components/ItemsClient"

export const metadata: Metadata = { title: "Items" }

export default function ItemsPage() {
  return <ItemsClient />
}
