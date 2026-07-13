export type ItemUnit = "pcs" | "g" | "kg" | "ml" | "l"
export type DiscountType = "percentage" | "flat"

export const UNIT_LABELS: Record<ItemUnit, string> = {
  pcs: "pc",
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "L",
}

export const UNIT_STEP: Record<ItemUnit, number> = {
  pcs: 1,
  g: 50,
  kg: 0.25,
  ml: 50,
  l: 0.25,
}

interface Discountable {
  price: number
  discountActive?: boolean
  discountType?: DiscountType
  discountValue?: number
}

export function effectivePrice(item: Discountable): number {
  if (!item.discountActive || !item.discountValue) return item.price
  const off = item.discountType === "flat" ? item.discountValue : (item.price * item.discountValue) / 100
  return Math.max(0, item.price - off)
}

export function formatQty(qty: number, unit: ItemUnit | string): string {
  const decimals = unit === "kg" || unit === "l" ? 3 : 0
  return `${qty.toLocaleString(undefined, { maximumFractionDigits: decimals })} ${UNIT_LABELS[unit as ItemUnit] ?? unit}`
}

/** Label for the pack size a price refers to, e.g. unitSize=100, unit="ml" -> "100ml" */
export function formatUnitLabel(unitSize: number | undefined, unit: ItemUnit | string): string {
  if (unit === "pcs") return "pcs"
  const size = unitSize && unitSize > 0 ? unitSize : 1
  return `${size.toLocaleString()}${UNIT_LABELS[unit as ItemUnit] ?? unit}`
}
