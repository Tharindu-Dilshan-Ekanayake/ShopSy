import "server-only"
import bwipjs from "bwip-js/node"
import { uploadImageBuffer, deleteImage } from "@/lib/cloudinary"

export async function generateBarcodeImage(code: string): Promise<{ url: string; publicId: string }> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 14,
    includetext: true,
    textxalign: "center",
    textsize: 10,
    paddingwidth: 4,
    paddingheight: 4,
    backgroundcolor: "ffffff",
  })

  const result = await uploadImageBuffer(png, "shopsy/barcodes")
  return { url: result.secure_url, publicId: result.public_id }
}

export { deleteImage }
