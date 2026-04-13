import { invokeLLM } from "./_core/llm";

export interface FoodVariation {
  name: string;
  description: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export async function searchFoodWithGemini(query: string): Promise<FoodVariation[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. When given a food name, return a JSON object with a "foods" array of exactly 10 specific food variations with their nutritional data per 100g.

Format:
{
  "foods": [
    {
      "name": "Food Name",
      "description": "Brief description of the food",
      "caloriesPer100g": 165,
      "proteinPer100g": 31,
      "carbsPer100g": 0,
      "fatPer100g": 3.6
    }
  ]
}

Requirements:
- Return ONLY valid JSON, no markdown or extra text
- Include common cooking methods (grilled, fried, baked, raw)
- Include different cuts or varieties
- All values must be realistic nutritional data per 100g
- Calories should match: (protein*4 + carbs*4 + fat*9) approximately
- Return exactly 10 items in the foods array`,
        },
        {
          role: "user",
          content: `Generate top 10 food variations for: "${query}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "food_variations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              foods: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    caloriesPer100g: { type: "number" },
                    proteinPer100g: { type: "number" },
                    carbsPer100g: { type: "number" },
                    fatPer100g: { type: "number" },
                  },
                  required: ["name", "description", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"],
                  additionalProperties: false,
                },
              },
            },
            required: ["foods"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content in response");

    let contentStr = typeof content === "string" ? content : "";
    if (Array.isArray(content)) {
      contentStr = content
        .filter((c: any) => "text" in c)
        .map((c: any) => c.text)
        .join("");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(contentStr);
    } catch {
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse food data from response");
      }
    }

    const foods: FoodVariation[] = Array.isArray(parsed) ? parsed : parsed?.foods;
    if (!Array.isArray(foods)) throw new Error("Response is not an array");

    return foods.slice(0, 10);
  } catch (error) {
    console.error("Error searching food with Gemini:", error);
    throw new Error(`Failed to search food: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function calculateMacrosForServing(
  food: FoodVariation,
  amount: number,
  unit: "g" | "oz"
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // Convert ounces to grams if needed
  const grams = unit === "oz" ? amount * 28.35 : amount;

  // Calculate macros based on per 100g values
  const multiplier = grams / 100;

  return {
    calories: Math.round(food.caloriesPer100g * multiplier),
    protein: Math.round(food.proteinPer100g * multiplier * 10) / 10,
    carbs: Math.round(food.carbsPer100g * multiplier * 10) / 10,
    fat: Math.round(food.fatPer100g * multiplier * 10) / 10,
  };
}
