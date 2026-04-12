/**
 * USDA FoodData Central API Integration
 * Provides access to the USDA's comprehensive food database with nutritional data
 * API Docs: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";

export interface USDAFoodResult {
  fdcId: string;
  foodName: string;
  description?: string;
  dataType: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  servingSize: string;
  servingUnit?: string;
}

/**
 * Search USDA FoodData Central for foods matching a query
 * Returns top 10 results with nutritional data
 */
export async function searchUSDAFoods(query: string): Promise<USDAFoodResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        pageSize: 10,
        pageNumber: 1,
      }),
    });

    if (!response.ok) {
      console.error(`USDA API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map((food: any) => {
      const nutrients = food.foodNutrients || [];
      
      // Extract key nutrients (IDs from USDA database)
      const getnutrient = (id: number) => {
        const nutrient = nutrients.find((n: any) => n.nutrientId === id);
        return nutrient?.value || 0;
      };

      // USDA nutrient IDs:
      // 1008 = Energy (kcal)
      // 1003 = Protein (g)
      // 1005 = Carbohydrate (g)
      // 1004 = Total lipid (fat) (g)

      return {
        fdcId: food.fdcId,
        foodName: food.description || "Unknown Food",
        description: food.description || "",
        dataType: food.dataType || "Survey (FNDDS)",
        calories: Math.round(getnutrient(1008)),
        proteinGrams: Math.round(getnutrient(1003) * 10) / 10,
        carbsGrams: Math.round(getnutrient(1005) * 10) / 10,
        fatGrams: Math.round(getnutrient(1004) * 10) / 10,
        servingSize: "100g",
        servingUnit: "g",
      };
    });
  } catch (error) {
    console.error("USDA API search failed:", error);
    return [];
  }
}

/**
 * Get detailed nutritional information for a specific USDA food
 */
export async function getUSDAFoodDetails(fdcId: string): Promise<USDAFoodResult | null> {
  try {
    const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`USDA API error: ${response.status}`);
      return null;
    }

    const food = await response.json();
    const nutrients = food.foodNutrients || [];

    const getnutrient = (id: number) => {
      const nutrient = nutrients.find((n: any) => n.nutrientId === id);
      return nutrient?.value || 0;
    };

    return {
      fdcId: food.fdcId,
      foodName: food.description || "Unknown Food",
      description: food.description || "",
      dataType: food.dataType || "Survey (FNDDS)",
      calories: Math.round(getnutrient(1008)),
      proteinGrams: Math.round(getnutrient(1003) * 10) / 10,
      carbsGrams: Math.round(getnutrient(1005) * 10) / 10,
      fatGrams: Math.round(getnutrient(1004) * 10) / 10,
      servingSize: "100g",
      servingUnit: "g",
    };
  } catch (error) {
    console.error("USDA API details fetch failed:", error);
    return null;
  }
}
