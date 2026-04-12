import { describe, it, expect, vi, beforeAll } from "vitest";
import { searchFoodWithGemini, calculateMacrosForServing, type FoodVariation } from "./geminiFood";

// Mock the LLM invocation
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify([
            {
              name: "Chicken Breast",
              description: "Grilled chicken breast",
              caloriesPer100g: 165,
              proteinPer100g: 31,
              carbsPer100g: 0,
              fatPer100g: 3.6,
            },
            {
              name: "Chicken Thigh",
              description: "Roasted chicken thigh",
              caloriesPer100g: 209,
              proteinPer100g: 26,
              carbsPer100g: 0,
              fatPer100g: 11,
            },
            {
              name: "Fried Chicken",
              description: "Breaded and fried chicken",
              caloriesPer100g: 320,
              proteinPer100g: 25,
              carbsPer100g: 11,
              fatPer100g: 17,
            },
            {
              name: "Rotisserie Chicken",
              description: "Store-bought rotisserie chicken",
              caloriesPer100g: 165,
              proteinPer100g: 30,
              carbsPer100g: 0,
              fatPer100g: 4.5,
            },
            {
              name: "Chicken Ground",
              description: "Ground chicken meat",
              caloriesPer100g: 165,
              proteinPer100g: 28,
              carbsPer100g: 0,
              fatPer100g: 5,
            },
            {
              name: "Chicken Drumstick",
              description: "Roasted chicken drumstick",
              caloriesPer100g: 195,
              proteinPer100g: 27,
              carbsPer100g: 0,
              fatPer100g: 9,
            },
            {
              name: "Chicken Wing",
              description: "Baked chicken wing",
              caloriesPer100g: 203,
              proteinPer100g: 30,
              carbsPer100g: 0,
              fatPer100g: 9,
            },
            {
              name: "Poached Chicken",
              description: "Poached chicken breast",
              caloriesPer100g: 148,
              proteinPer100g: 30,
              carbsPer100g: 0,
              fatPer100g: 1.5,
            },
            {
              name: "Smoked Chicken",
              description: "Smoked chicken breast",
              caloriesPer100g: 155,
              proteinPer100g: 29,
              carbsPer100g: 0,
              fatPer100g: 3,
            },
            {
              name: "Chicken Nuggets",
              description: "Breaded chicken nuggets",
              caloriesPer100g: 290,
              proteinPer100g: 17,
              carbsPer100g: 15,
              fatPer100g: 16,
            },
          ]),
        },
      },
    ],
  })),
}));

describe("Food Search with AI", () => {
  describe("searchFoodWithGemini", () => {
    it("should return an array of food variations", async () => {
      const results = await searchFoodWithGemini("chicken");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it("should return foods with required nutrition fields", async () => {
      const results = await searchFoodWithGemini("chicken");
      expect(results.length).toBeGreaterThan(0);

      const food = results[0];
      expect(food).toHaveProperty("name");
      expect(food).toHaveProperty("description");
      expect(food).toHaveProperty("caloriesPer100g");
      expect(food).toHaveProperty("proteinPer100g");
      expect(food).toHaveProperty("carbsPer100g");
      expect(food).toHaveProperty("fatPer100g");
    });

    it("should return numeric nutrition values", async () => {
      const results = await searchFoodWithGemini("chicken");
      const food = results[0];

      expect(typeof food.caloriesPer100g).toBe("number");
      expect(typeof food.proteinPer100g).toBe("number");
      expect(typeof food.carbsPer100g).toBe("number");
      expect(typeof food.fatPer100g).toBe("number");
    });

    it("should return realistic calorie values", async () => {
      const results = await searchFoodWithGemini("chicken");
      const food = results[0];

      // Calories should be between 0 and 900 per 100g (realistic range)
      expect(food.caloriesPer100g).toBeGreaterThan(0);
      expect(food.caloriesPer100g).toBeLessThan(900);
    });
  });

  describe("calculateMacrosForServing", () => {
    const mockFood: FoodVariation = {
      name: "Chicken Breast",
      description: "Grilled chicken breast",
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
    };

    it("should calculate macros for grams correctly", () => {
      const result = calculateMacrosForServing(mockFood, 100, "g");

      expect(result.calories).toBe(165);
      expect(result.protein).toBe(31);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBe(3.6);
    });

    it("should calculate macros for ounces correctly", () => {
      const result = calculateMacrosForServing(mockFood, 3.5, "oz");

      // 3.5 oz = ~99.225 grams
      expect(result.calories).toBeCloseTo(164, 0);
      expect(result.protein).toBeCloseTo(31, 0);
      expect(result.carbs).toBe(0);
      expect(result.fat).toBeCloseTo(3.6, 0);
    });

    it("should scale macros proportionally for different serving sizes", () => {
      const result200g = calculateMacrosForServing(mockFood, 200, "g");
      const result100g = calculateMacrosForServing(mockFood, 100, "g");

      expect(result200g.calories).toBeCloseTo(result100g.calories * 2, 0);
      expect(result200g.protein).toBeCloseTo(result100g.protein * 2, 0);
      expect(result200g.fat).toBeCloseTo(result100g.fat * 2, 0);
    });

    it("should return rounded calorie values", () => {
      const result = calculateMacrosForServing(mockFood, 150, "g");

      expect(Number.isInteger(result.calories)).toBe(true);
    });

    it("should return macros with max 1 decimal place", () => {
      const result = calculateMacrosForServing(mockFood, 75, "g");

      // Check that values don't have more than 1 decimal place
      expect(result.protein.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(result.carbs.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(1);
      expect(result.fat.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(1);
    });

    it("should handle small serving sizes", () => {
      const result = calculateMacrosForServing(mockFood, 10, "g");

      expect(result.calories).toBeGreaterThan(0);
      expect(result.protein).toBeGreaterThan(0);
      expect(result.fat).toBeGreaterThan(0);
    });

    it("should handle large serving sizes", () => {
      const result = calculateMacrosForServing(mockFood, 500, "g");

      expect(result.calories).toBeCloseTo(825, 0);
      expect(result.protein).toBeCloseTo(155, 0);
      expect(result.fat).toBeCloseTo(18, 0);
    });
  });
});
