import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lookupBarcodeProduct } from "./barcode";

// Mock fetch
global.fetch = vi.fn();

describe("Barcode Lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should extract UPC from SmartLabel URL and lookup product", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        product: {
          product_name: "Genuine Protein Powder",
          brands: "Muscle Milk",
          nutriments: {
            "energy-kcal": 385.7,
            "proteins_100g": 25,
            "carbohydrates_100g": 3,
            "fat_100g": 5,
          },
        },
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const smartLabelUrl =
      "https://menu.myproduct.info/d0d87cf0-c89d-47db-91bf-d59d5b0013c9/index.html?cname=00660726503270_32655032904_BEV_MuscleMilk_BR&scantime=2026-04-11T22%3A05%3A21Z";

    const result = await lookupBarcodeProduct(smartLabelUrl);

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Genuine Protein Powder");
    expect(result?.brand).toBe("Muscle Milk");
    expect(result?.calories).toBe(386); // Rounded to whole number
    expect(result?.protein).toBe(25); // Whole number
    expect(result?.carbs).toBe(3); // Whole number
    expect(result?.fat).toBe(5); // Whole number
    expect(result?.barcode).toBe("60726503270");
  });

  it("should handle standard UPC barcode lookup", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        product: {
          product_name: "Coca-Cola",
          brands: "Coca-Cola",
          nutriments: {
            "energy-kcal_100g": 42,
            "proteins_100g": 0,
            "carbohydrates_100g": 10.6,
            "fat_100g": 0,
          },
        },
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await lookupBarcodeProduct("5449000050127");

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Coca-Cola");
    expect(result?.calories).toBe(42);
  });

  it("should return null for empty barcode", async () => {
    const result = await lookupBarcodeProduct("");
    expect(result).toBeNull();
  });

  it("should return null for invalid barcode format", async () => {
    const result = await lookupBarcodeProduct("invalid");
    expect(result).toBeNull();
  });

  it("should return null when product not found", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        product: null,
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await lookupBarcodeProduct("9999999999999");
    expect(result).toBeNull();
  });

  it("should fallback to v0 API when v2 fails", async () => {
    const mockV2Response = {
      ok: false,
    };

    const mockV0Response = {
      ok: true,
      json: async () => ({
        product: {
          product_name: "Test Product",
          brands: "Test Brand",
          nutriments: {
            "energy-kcal": 100,
            "proteins_100g": 10,
            "carbohydrates_100g": 20,
            "fat_100g": 5,
          },
        },
      }),
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockV2Response)
      .mockResolvedValueOnce(mockV0Response);

    const result = await lookupBarcodeProduct("1234567890123");

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test Product");
    expect((global.fetch as any).mock.calls.length).toBe(2);
  });

  it("should handle nutrition data with alternative field names", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        product: {
          product_name: "Test Product",
          brands: "Test Brand",
          nutriments: {
            "energy_100g": 200, // Alternative field name
            proteins: 15,
            carbohydrates: 30,
            fat: 8,
          },
        },
      }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await lookupBarcodeProduct("1234567890123");

    expect(result).not.toBeNull();
    expect(result?.calories).toBe(200);
    expect(result?.protein).toBe(15);
  });
});
