/**
 * Barcode lookup and nutrition data retrieval
 * Uses Open Food Facts API for barcode scanning with fallback support
 */

interface BarcodeProduct {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingUnit: string;
  barcode: string;
  brand?: string;
}

/**
/**
 * Extract numeric barcode from URL-based barcode
 * Handles SmartLabel URLs and other redirect formats
 */
function extractNumericBarcode(barcode: string): string | null {
  // If it's a URL, try to extract numeric code
  if (barcode.includes("http") || barcode.includes(".")) {
    // Try to find UPC codes in URL parameters (e.g., cname=00660726503270)
    const codeMatch = barcode.match(/cname=([0-9]+)/i);
    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1];
      // Remove leading zeros if it's too long (e.g., 00660726503270 -> 60726503270)
      if (code.length > 14) {
        return code.substring(code.length - 13);
      }
      if (code.length >= 8) {
        return code;
      }
    }
    
    // Try to find any numeric sequences of 8-14 digits in the URL
    const matches = barcode.match(/\d{8,14}/g);
    if (matches && matches.length > 0) {
      // Return the longest match (likely the UPC)
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
  }
  return null;
}

/**
 * Look up product information by barcode using multiple data sources
 * Tries Open Food Facts first, then falls back to other sources
 */
export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeProduct | null> {
  if (!barcode) {
    console.error("Barcode is empty");
    return null;
  }

  let numericBarcode = barcode;

  // If barcode is a URL, try to extract numeric code
  if (barcode.includes("http") || barcode.includes(".")) {
    const extracted = extractNumericBarcode(barcode);
    if (extracted) {
      numericBarcode = extracted;
      console.log(`Extracted numeric barcode from URL: ${numericBarcode}`);
    } else {
      console.warn(`Could not extract numeric barcode from: ${barcode}`);
      // Still try the original barcode
    }
  }

  // Validate barcode format (8-14 digits for standard barcodes)
  if (!/^\d{8,14}$/.test(numericBarcode)) {
    console.error(`Invalid barcode format: ${numericBarcode}`);
    return null;
  }

  try {
    // Try Open Food Facts API v2 first (more reliable)
    console.log(`Looking up barcode: ${numericBarcode}`);
    const offResponse = await fetch(
      `https://world.openfoodfacts.net/api/v2/product/${numericBarcode}?fields=product_name,brands,nutriments,quantity`
    );

    if (offResponse.ok) {
      const data = await offResponse.json();
      if (data.product) {
        const product = data.product;
        const nutrients = product.nutriments || {};

        // Extract nutrition per 100g (Open Food Facts standard) - round to whole numbers
        const calories = Math.round(nutrients["energy-kcal"] || nutrients["energy-kcal_100g"] || nutrients["energy_100g"] || 0);
        const protein = Math.round(nutrients["proteins"] || nutrients["proteins_100g"] || 0);
        const carbs = Math.round(nutrients["carbohydrates"] || nutrients["carbohydrates_100g"] || 0);
        const fat = Math.round(nutrients["fat"] || nutrients["fat_100g"] || 0);

        console.log(`Found product in Open Food Facts: ${product.product_name}`);
        return {
          name: product.product_name || "Unknown Product",
          calories,
          protein,
          carbs,
          fat,
          servingSize: "100",
          servingUnit: "g",
          barcode: numericBarcode,
          brand: product.brands || undefined,
        };
      }
    }

    // Fallback: Try Open Food Facts v0 API
    console.log(`Open Food Facts v2 not found, trying v0 API...`);
    const offV0Response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${numericBarcode}.json`
    );

    if (offV0Response.ok) {
      const data = await offV0Response.json();
      if (data.product) {
        const product = data.product;
        const nutrients = product.nutriments || {};

        const calories = Math.round(nutrients["energy-kcal"] || nutrients["energy-kcal_100g"] || 0);
        const protein = Math.round(nutrients["proteins"] || nutrients["proteins_100g"] || 0);
        const carbs = Math.round(nutrients["carbohydrates"] || nutrients["carbohydrates_100g"] || 0);
        const fat = Math.round(nutrients["fat"] || nutrients["fat_100g"] || 0);

        console.log(`Found product in Open Food Facts v0: ${product.product_name}`);
        return {
          name: product.product_name || "Unknown Product",
          calories,
          protein,
          carbs,
          fat,
          servingSize: "100",
          servingUnit: "g",
          barcode: numericBarcode,
          brand: product.brands || undefined,
        };
      }
    }

    console.error(`Product not found in Open Food Facts for barcode: ${numericBarcode}`);
    return null;
  } catch (error) {
    console.error("Barcode lookup failed:", error);
    return null;
  }
}

/**
 * Food variant data for countable items and sized fruits
 * Used to provide quantity and size options
 */
export const FOOD_VARIANTS = {
  // Countable items
  eggs: {
    type: "countable",
    unit: "egg",
    macrosPerUnit: {
      calories: 70,
      protein: 6,
      carbs: 0.4,
      fat: 5,
    },
  },
  "chicken breast": {
    type: "countable",
    unit: "piece",
    macrosPerUnit: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    },
  },
  // Sized fruits
  apple: {
    type: "sized",
    sizes: {
      small: {
        weight: 149,
        calories: 77,
        protein: 0.4,
        carbs: 21,
        fat: 0.2,
      },
      medium: {
        weight: 182,
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
      },
      large: {
        weight: 223,
        calories: 116,
        protein: 0.6,
        carbs: 31,
        fat: 0.4,
      },
    },
  },
  banana: {
    type: "sized",
    sizes: {
      small: {
        weight: 101,
        calories: 90,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
      },
      medium: {
        weight: 118,
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.3,
      },
      large: {
        weight: 136,
        calories: 121,
        protein: 1.5,
        carbs: 31,
        fat: 0.4,
      },
    },
  },
  orange: {
    type: "sized",
    sizes: {
      small: {
        weight: 131,
        calories: 53,
        protein: 0.9,
        carbs: 13,
        fat: 0.3,
      },
      medium: {
        weight: 154,
        calories: 62,
        protein: 1.2,
        carbs: 16,
        fat: 0.3,
      },
      large: {
        weight: 184,
        calories: 74,
        protein: 1.5,
        carbs: 19,
        fat: 0.4,
      },
    },
  },
  strawberry: {
    type: "sized",
    sizes: {
      small: {
        weight: 100,
        calories: 32,
        protein: 0.7,
        carbs: 8,
        fat: 0.3,
      },
      medium: {
        weight: 150,
        calories: 48,
        protein: 1,
        carbs: 12,
        fat: 0.4,
      },
      large: {
        weight: 200,
        calories: 64,
        protein: 1.3,
        carbs: 15,
        fat: 0.5,
      },
    },
  },
  "greek yogurt": {
    type: "countable",
    unit: "cup (227g)",
    macrosPerUnit: {
      calories: 220,
      protein: 20,
      carbs: 9,
      fat: 5,
    },
  },
  bread: {
    type: "countable",
    unit: "slice",
    macrosPerUnit: {
      calories: 79,
      protein: 2.7,
      carbs: 14,
      fat: 1,
    },
  },
} as const;

export type FoodVariantKey = keyof typeof FOOD_VARIANTS;

export function getFoodVariant(foodName: string): (typeof FOOD_VARIANTS)[FoodVariantKey] | null {
  const normalized = foodName.toLowerCase().trim();
  
  for (const [key, variant] of Object.entries(FOOD_VARIANTS)) {
    if (normalized.includes(key)) {
      return variant;
    }
  }
  
  return null;
}
