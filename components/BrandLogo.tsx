import Image from "next/image"
import Link from "next/link"
import LOGO from "../assests/logo.png"

type BrandLogoProps = {
  href?: string
  showLabel?: boolean
  label?: string
  className?: string
  labelClassName?: string
  imageSizeClassName?: string
  imageClassName?: string
  backgroundClassName?: string
  variant?: "default" | "professional"
}

export default function BrandLogo({
  href = "/",
  showLabel = true,
  label = "ShopSy",
  className = "",
  labelClassName = "font-semibold text-base",
  imageSizeClassName = "size-10",
  imageClassName = "object-contain p-1.5",
  backgroundClassName = "bg-primary/10",
  variant = "default",
}: BrandLogoProps) {
  const professional = variant === "professional"

  const content = (
    <>
      <div
        className={`relative shrink-0 overflow-hidden ${imageSizeClassName} ${backgroundClassName} ${professional ? "rounded-2xl ring-1 ring-black/5 shadow-md shadow-black/10" : "rounded-lg"}`}
      >
        <Image src={LOGO} alt="ShopSy logo" fill sizes="32px" className={imageClassName} />
      </div>
      {showLabel && <span className={labelClassName}>{label}</span>}
    </>
  )

  if (!href) {
    return <div className={`flex items-center ${professional ? "gap-3" : "gap-2"} ${className}`}>{content}</div>
  }

  return (
    <Link href={href} className={`flex items-center ${professional ? "gap-3" : "gap-2"} ${className}`}>
      {content}
    </Link>
  )
}