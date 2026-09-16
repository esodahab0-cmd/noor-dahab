"use client";

import { Html5Qrcode } from "html5-qrcode";

let qrScannerInstance: Html5Qrcode | null = null;

export async function scanBarcodeLocally(
  videoElement: HTMLVideoElement
): Promise<string | null> {
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: [
          "qr_code",
          "ean_13",
          "ean_8",
          "code_128",
          "code_39",
          "upc_a",
          "upc_e",
          "data_matrix"
        ]
      });
      const barcodes = await barcodeDetector.detect(videoElement);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch (e) {
      console.warn("Native BarcodeDetector fallback:", e);
    }
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob) return null;

    const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
    
    let tempContainer = document.getElementById("qr-temp-region");
    if (!tempContainer) {
      tempContainer = document.createElement("div");
      tempContainer.id = "qr-temp-region";
      tempContainer.style.display = "none";
      document.body.appendChild(tempContainer);
    }

    if (!qrScannerInstance) {
      qrScannerInstance = new Html5Qrcode("qr-temp-region", { verbose: false });
    }

    const result = await qrScannerInstance.scanFileV2(file, false);
    if (result && result.decodedText) {
      return result.decodedText.trim();
    }
  } catch (err) {}

  return null;
}
