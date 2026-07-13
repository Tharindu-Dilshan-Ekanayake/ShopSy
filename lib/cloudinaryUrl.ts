/**
 * Client-safe helper to request a small, pre-shrunk Cloudinary delivery URL
 * instead of the full-resolution upload — avoids Next.js's image optimizer
 * having to download and downscale a large original for a 36-100px thumbnail.
 */
export function cloudinaryThumb(url: string | undefined, size: number): string | undefined {
  if (!url) return url
  const marker = "/upload/"
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  const transform = `w_${size},h_${size},c_fill,g_auto,q_auto,f_auto`
  return url.slice(0, idx + marker.length) + transform + "/" + url.slice(idx + marker.length)
}
