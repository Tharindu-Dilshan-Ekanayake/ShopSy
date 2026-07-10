import { Metadata } from "next"
import CategoriesClient from "./_components/CategoriesClient"

export const metadata: Metadata = { title: "Categories" }

export default function CategoriesPage() {
  return <CategoriesClient />
}
