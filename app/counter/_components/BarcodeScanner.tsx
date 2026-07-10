"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
        /* Landscape box is better for 1D barcodes; experimental enables native BarcodeDetector */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { fps: 15, qrbox: { width: 280, height: 100 }, experimentalFeatures: { useBarCodeDetectorIfSupported: true } } as any,
        (decoded) => {
          stopLive().then(() => {
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(60)
            onScan(decoded)
          })
        },
        () => { /* per-frame decode errors are normal */ },
      )
      scannerRef.current = qr
      setMode("live")
    } catch {
      /* getUserMedia blocked on HTTP non-localhost (e.g. iPhone over LAN) */
      setMode("file")
    }
  }

  useEffect(() => {
    if (!open) return
    startLive()
    return () => { stopLive() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = () => stopLive().then(onClose)

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
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(60)
      onScan(result)
    } catch {
      toast.error("No barcode found — try a clearer photo")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 overflow-hidden">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        <SheetHeader className="px-5 pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-5 text-primary" />
            Scan Barcode
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 pb-safe-or-6 space-y-3 pb-6">
          {/* Live camera preview */}
          {mode !== "file" && (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden bg-black">
                {/* html5-qrcode mounts its video here */}
                <div id="shopsy-barcode-live" className="w-full min-h-72" />

                {/* Corner-bracket + sweep line overlay */}
                {mode === "live" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Semi-dark mask around the scan zone */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* Transparent scan window */}
                    <div className="relative z-10 w-72 h-28 bg-transparent overflow-hidden">
                      {/* Corner brackets */}
                      <span className="absolute top-0 left-0 w-7 h-7 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                      <span className="absolute top-0 right-0 w-7 h-7 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                      <span className="absolute bottom-0 left-0 w-7 h-7 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                      <span className="absolute bottom-0 right-0 w-7 h-7 border-b-3 border-r-3 border-primary rounded-br-lg" />

                      {/* Animated scan line */}
                      <span className="animate-barcode-sweep absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full shadow-[0_0_6px_2px_hsl(var(--primary)/0.6)]" />
                    </div>
                  </div>
                )}

                {/* Starting overlay */}
                {mode === "starting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white">
                    <div className="size-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <p className="text-sm">Starting camera…</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Align the barcode within the frame and hold steady
              </p>
            </div>
          )}

          {/* File fallback — when camera is blocked (HTTP / permission denied) */}
          {mode === "file" && (
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-4 py-10">
                <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Camera className="size-8 text-muted-foreground/50" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Live camera unavailable</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Take a clear photo of the barcode to scan it
                  </p>
                </div>
                <Button type="button" className="gap-2 rounded-xl h-11 px-6" onClick={openCamera}>
                  <Camera className="size-4" />
                  Open Camera
                </Button>
              </div>
              <button
                type="button"
                className="w-full text-sm text-primary underline underline-offset-2 min-h-10"
                onClick={openLibrary}
              >
                Or choose from photo library
              </button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full h-12 rounded-xl gap-2 font-semibold"
          >
            <X className="size-4" />
            Cancel
          </Button>
        </div>

        {/* Hidden file input — capture attr set programmatically to avoid linter */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Upload barcode image"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* Required by Html5Qrcode.scanFile() but invisible */}
        <div id="shopsy-barcode-file" aria-hidden className="hidden" />
      </SheetContent>
    </Sheet>
  )
}
