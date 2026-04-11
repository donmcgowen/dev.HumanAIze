import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  isLoading?: boolean;
}

export function BarcodeScanner({ onBarcodeScanned, isLoading = false }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    try {
      const scanner = new Html5QrcodeScanner(
        "barcode-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          showTorchButtonIfSupported: true,
          useBarCodeDetectorIfSupported: true,
          rememberLastUsedCamera: false,
        },
        false
      );

      scanner.render(
        (decodedText: string) => {
          // Accept any barcode format (UPC, EAN, Code128, etc.)
          if (decodedText && decodedText.length > 0) {
            setIsScanning(true);
            onBarcodeScanned(decodedText);
            setTimeout(() => {
              try {
                scanner.clear();
              } catch (e) {
                // Ignore cleanup errors
              }
              setIsOpen(false);
              setIsScanning(false);
            }, 500);
          }
        },
        (error: any) => {
          // Silently ignore scanning errors
        }
      );

      scannerRef.current = scanner;
    } catch (err) {
      toast.error("Failed to initialize barcode scanner");
      setIsOpen(false);
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isOpen, onBarcodeScanned]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        disabled={isLoading || isScanning}
        variant="outline"
        className="w-full"
      >
        {isScanning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          "Scan Barcode"
        )}
      </Button>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03] fixed inset-0 z-50 m-4 max-w-md mx-auto my-auto rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Scan Barcode</CardTitle>
          <CardDescription>Point camera at barcode to scan (back camera)</CardDescription>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={containerRef}
          id="barcode-scanner-container"
          className="w-full bg-black rounded border border-white/20"
          style={{ minHeight: "300px" }}
        />
        <p className="text-xs text-slate-400 text-center">
          Supports UPC, EAN, and other 1D/2D barcodes
        </p>
      </CardContent>
    </Card>
  );
}
