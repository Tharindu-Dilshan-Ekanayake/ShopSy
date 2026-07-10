import { Metadata } from "next"
import UsersClient from "./_components/UsersClient"

export const metadata: Metadata = { title: "Users" }

export default function UsersPage() {
  return <UsersClient />
}
