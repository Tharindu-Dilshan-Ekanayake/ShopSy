"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScanLine, Camera, X } from "lucide-react"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
  onScan: (code: string) => void
}

export default function BarcodeScanner({ open, onClose, onScan }: Props) {
  const [mode, setMode] = useState<"starting" | "live" | "file">("starting")
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const stopLive = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* already stopped */ }
      scannerRef.current = null
    }
  }

  const startLive = async () => {
    setMode("starting")
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const qr = new Html5Qrcode("shopsy-barcode-live")
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => { stopLive().then(() => onScan(decoded)) },
        () => { /* per-frame decode errors are normal */ }
      )
      scannerRef.current = qr
      setMode("live")
    } catch {
      // getUserMedia is blocked on HTTP non-localhost (iPhone over local WiFi)
      setMode("file")
    }
  }

  useEffect(() => {
    if (!open) return
    startLive()
    return () => { stopLive() }
  }, [open])

  const handleClose = () => { stopLive().then(onClose) }

  // Set capture attribute dynamically to avoid linter false-positive for unsupported attribute
  const openCamera = () => {
    if (!fileRef.current) return
    fileRef.current.setAttribute("capture", "environment")
    fileRef.current.click()
  }

  const openLibrary = () => {
    if (!fileRef.current) return
    fileRef.current.removeAttribute("capture")
    fileRef.current.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const qr = new Html5Qrcode("shopsy-barcode-file")
      const result = await qr.scanFile(file, false)
      onScan(result)
    } catch {
      toast.error("No barcode found — try a clearer photo")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-primary" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live camera view */}
          {mode !== "file" && (
            <div className="space-y-2">
              <div id="shopsy-barcode-live" className="overflow-hidden rounded-xl bg-muted w-full aspect-square" />
              <p className="text-xs text-center text-muted-foreground">
                {mode === "starting" ? "Starting camera…" : "Point camera at the barcode"}
              </p>
            </div>
          )}

          {/* Photo fallback — shown when camera is blocked (iPhone over HTTP) */}
          {mode === "file" && (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-3 p-8">
                <Camera className="size-10 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-sm font-medium">Live camera unavailable</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take a photo of the barcode to scan it
                  </p>
                </div>
                <Button type="button" className="gap-2 mt-1" onClick={openCamera}>
                  <Camera className="size-4" /> Open Camera
                </Button>
              </div>
              <button
                type="button"
                className="w-full text-xs text-muted-foreground underline underline-offset-2 py-1"
                onClick={openLibrary}
              >
                Or choose from photo library
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input — capture attr set programmatically */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Upload barcode image"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Dummy container required by Html5Qrcode.scanFile() */}
        <div id="shopsy-barcode-file" aria-hidden className="hidden" />

        <Button variant="outline" onClick={handleClose} className="w-full gap-2">
          <X className="size-4" /> Cancel
        </Button>
      </DialogContent>
    </Dialog>
  )
}
