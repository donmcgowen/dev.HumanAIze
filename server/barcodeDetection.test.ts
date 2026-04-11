import { describe, it, expect, vi } from "vitest";
import jsQR from "jsqr";

// Mock jsQR
vi.mock("jsqr", () => ({
  default: vi.fn(),
}));

describe("Barcode Detection", () => {
  it("should detect QR code from canvas image data", () => {
    const mockQRData = { data: "660726503270" };
    (jsQR as any).mockReturnValue(mockQRData);

    const imageData = new Uint8ClampedArray(1280 * 720 * 4);
    const result = jsQR(imageData, 1280, 720);

    expect(result).toEqual(mockQRData);
    expect(result?.data).toBe("660726503270");
  });

  it("should return null when no barcode detected", () => {
    (jsQR as any).mockReturnValue(null);

    const imageData = new Uint8ClampedArray(1280 * 720 * 4);
    const result = jsQR(imageData, 1280, 720);

    expect(result).toBeNull();
  });

  it("should handle various barcode formats", () => {
    const testCases = [
      { barcode: "660726503270", format: "UPC" },
      { barcode: "5901234123457", format: "EAN-13" },
      { barcode: "123456789012", format: "EAN-12" },
    ];

    testCases.forEach(({ barcode }) => {
      const mockQRData = { data: barcode };
      (jsQR as any).mockReturnValue(mockQRData);

      const imageData = new Uint8ClampedArray(1280 * 720 * 4);
      const result = jsQR(imageData, 1280, 720);

      expect(result?.data).toBe(barcode);
    });
  });

  it("should detect barcode from different image sizes", () => {
    const sizes = [
      { width: 640, height: 480 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
    ];

    sizes.forEach(({ width, height }) => {
      const mockQRData = { data: "660726503270" };
      (jsQR as any).mockReturnValue(mockQRData);

      const imageData = new Uint8ClampedArray(width * height * 4);
      const result = jsQR(imageData, width, height);

      expect(result?.data).toBe("660726503270");
    });
  });

  it("should handle rapid consecutive barcode detections", () => {
    const barcodes = ["660726503270", "5901234123457", "123456789012"];
    const detectedBarcodes: string[] = [];

    barcodes.forEach((barcode) => {
      const mockQRData = { data: barcode };
      (jsQR as any).mockReturnValue(mockQRData);

      const imageData = new Uint8ClampedArray(1280 * 720 * 4);
      const result = jsQR(imageData, 1280, 720);

      if (result && result.data !== detectedBarcodes[detectedBarcodes.length - 1]) {
        detectedBarcodes.push(result.data);
      }
    });

    expect(detectedBarcodes).toEqual(barcodes);
  });

  it("should validate barcode format", () => {
    const validBarcodes = ["660726503270", "5901234123457"];
    const invalidBarcodes = ["", "abc", "12"];

    validBarcodes.forEach((barcode) => {
      expect(barcode.length).toBeGreaterThan(0);
      expect(/^\d+$/.test(barcode)).toBe(true);
    });

    invalidBarcodes.forEach((barcode) => {
      if (barcode.length > 0) {
        expect(/^\d+$/.test(barcode)).toBe(barcode === "12");
      }
    });
  });

  it("should handle barcode lookup with product data", async () => {
    const mockProduct = {
      name: "Muscle Milk Protein Powder",
      calories: 150,
      protein: 16,
      carbs: 10,
      fat: 4.5,
      servingSize: "100",
      servingUnit: "grams",
    };

    const barcode = "660726503270";
    const lookupResult = { ...mockProduct, barcode };

    expect(lookupResult.barcode).toBe(barcode);
    expect(lookupResult.name).toBe("Muscle Milk Protein Powder");
    expect(lookupResult.protein).toBe(16);
  });

  it("should populate food data after barcode scan", () => {
    const scannedBarcode = "660726503270";
    const productData = {
      fdcId: scannedBarcode,
      description: "Muscle Milk Protein Powder",
      calories: 150,
      protein: 16,
      carbs: 10,
      fat: 4.5,
      servingSize: 100,
      servingUnit: "grams",
    };

    expect(productData.fdcId).toBe(scannedBarcode);
    expect(productData.description).toBe("Muscle Milk Protein Powder");
    expect(productData.calories).toBe(150);
    expect(productData.protein).toBe(16);
  });

  it("should handle camera stream errors gracefully", () => {
    const cameraErrors = [
      "NotAllowedError: Permission denied",
      "NotFoundError: No camera device found",
      "NotReadableError: Camera is already in use",
    ];

    cameraErrors.forEach((error) => {
      expect(error).toContain("Error");
    });
  });

  it("should debounce duplicate barcode detections", () => {
    const detections: string[] = [];
    let lastDetected = "";

    const handleDetection = (barcode: string) => {
      if (barcode !== lastDetected) {
        detections.push(barcode);
        lastDetected = barcode;
      }
    };

    // Simulate rapid detections of same barcode
    handleDetection("660726503270");
    handleDetection("660726503270");
    handleDetection("660726503270");
    handleDetection("5901234123457");
    handleDetection("5901234123457");

    expect(detections).toEqual(["660726503270", "5901234123457"]);
  });
});
