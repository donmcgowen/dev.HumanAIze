/**
 * Barcode lookup and nutrition data retrieval
 * Uses Open Food Facts API for barcode scanning
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
 * Look up product information by barcode using Open Food Facts API
 */
export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeProduct | null> {
  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    console.error("Invalid barcode format");
    return null;
  }

  try {
    // Try Open Food Facts API first (free, no auth required)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      console.error(`Open Food Facts API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.product) {
      console.error("Product not found in Open Food Facts");
      return null;
    }

    const product = data.product;
    const nutrients = product.nutriments || {};

    // Extract nutrition per 100g (Open Food Facts standard)
    const calories = Math.round(nutrients["energy-kcal"] || nutrients["energy-kcal_100g"] || 0);
    const protein = Math.round((nutrients["proteins"] || nutrients["proteins_100g"] || 0) * 10) / 10;
    const carbs = Math.round((nutrients["carbohydrates"] || nutrients["carbohydrates_100g"] || 0) * 10) / 10;
    const fat = Math.round((nutrients["fat"] || nutrients["fat_100g"] || 0) * 10) / 10;

    return {
      name: product.product_name || "Unknown Product",
      calories,
      protein,
      carbs,
      fat,
      servingSize: "100",
      servingUnit: "g",
      barcode,
      brand: product.brands || undefined,
    };
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
