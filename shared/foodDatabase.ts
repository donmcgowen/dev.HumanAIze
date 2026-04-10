/**
 * Comprehensive food database with macro values per 100g
 * Macros: protein (g), carbs (g), fat (g), calories (kcal)
 */

export interface FoodItem {
  id: string;
  name: string;
  category: "protein" | "carbs" | "vegetables" | "fruits" | "dairy" | "grains" | "oils" | "other";
  macros: {
    protein: number; // grams per 100g
    carbs: number;   // grams per 100g
    fat: number;     // grams per 100g
  };
  calories: number; // per 100g
  servingSize?: string; // e.g., "1 cup", "1 medium"
}

export const FOOD_DATABASE: FoodItem[] = [
  // Proteins - Meat
  { id: "chicken_breast", name: "Chicken Breast (skinless)", category: "protein", macros: { protein: 31, carbs: 0, fat: 3.6 }, calories: 165 },
  { id: "chicken_thigh", name: "Chicken Thigh (skinless)", category: "protein", macros: { protein: 26, carbs: 0, fat: 9 }, calories: 209 },
  { id: "ground_beef_lean", name: "Ground Beef (93% lean)", category: "protein", macros: { protein: 22, carbs: 0, fat: 5 }, calories: 156 },
  { id: "ground_beef_regular", name: "Ground Beef (80% lean)", category: "protein", macros: { protein: 20, carbs: 0, fat: 11 }, calories: 217 },
  { id: "beef_sirloin", name: "Beef Sirloin Steak", category: "protein", macros: { protein: 26, carbs: 0, fat: 8 }, calories: 200 },
  { id: "pork_chop", name: "Pork Chop (lean)", category: "protein", macros: { protein: 27, carbs: 0, fat: 3 }, calories: 165 },
  { id: "salmon", name: "Salmon (wild)", category: "protein", macros: { protein: 25, carbs: 0, fat: 13 }, calories: 206 },
  { id: "tuna", name: "Tuna (canned in water)", category: "protein", macros: { protein: 29, carbs: 0, fat: 1 }, calories: 132 },
  { id: "turkey_breast", name: "Turkey Breast", category: "protein", macros: { protein: 29, carbs: 0, fat: 1 }, calories: 135 },
  { id: "egg", name: "Egg (large)", category: "protein", macros: { protein: 13, carbs: 1.1, fat: 11 }, calories: 155 },
  { id: "egg_white", name: "Egg White (large)", category: "protein", macros: { protein: 11, carbs: 0.7, fat: 0.2 }, calories: 52 },
  { id: "cod", name: "Cod (baked)", category: "protein", macros: { protein: 20, carbs: 0, fat: 0.7 }, calories: 82 },
  { id: "shrimp", name: "Shrimp (cooked)", category: "protein", macros: { protein: 24, carbs: 0, fat: 0.3 }, calories: 99 },
  { id: "tilapia", name: "Tilapia (baked)", category: "protein", macros: { protein: 26, carbs: 0, fat: 1.7 }, calories: 128 },

  // Proteins - Plant-based
  { id: "tofu", name: "Tofu (firm)", category: "protein", macros: { protein: 15, carbs: 1.9, fat: 8.7 }, calories: 144 },
  { id: "tempeh", name: "Tempeh", category: "protein", macros: { protein: 19, carbs: 9, fat: 11 }, calories: 195 },
  { id: "lentils_cooked", name: "Lentils (cooked)", category: "protein", macros: { protein: 9, carbs: 20, fat: 0.4 }, calories: 116 },
  { id: "chickpeas_cooked", name: "Chickpeas (cooked)", category: "protein", macros: { protein: 15, carbs: 27, fat: 4.3 }, calories: 269 },
  { id: "black_beans_cooked", name: "Black Beans (cooked)", category: "protein", macros: { protein: 9, carbs: 24, fat: 0.5 }, calories: 132 },
  { id: "peanut_butter", name: "Peanut Butter (natural)", category: "protein", macros: { protein: 25, carbs: 20, fat: 50 }, calories: 588 },
  { id: "almonds", name: "Almonds", category: "protein", macros: { protein: 21, carbs: 22, fat: 50 }, calories: 579 },
  { id: "greek_yogurt", name: "Greek Yogurt (0% fat)", category: "dairy", macros: { protein: 10, carbs: 3.3, fat: 0.4 }, calories: 59 },
  { id: "cottage_cheese", name: "Cottage Cheese (1% fat)", category: "dairy", macros: { protein: 11, carbs: 3.4, fat: 1.3 }, calories: 72 },

  // Carbs - Grains
  { id: "brown_rice", name: "Brown Rice (cooked)", category: "grains", macros: { protein: 2.6, carbs: 23, fat: 1 }, calories: 111 },
  { id: "white_rice", name: "White Rice (cooked)", category: "grains", macros: { protein: 2.7, carbs: 28, fat: 0.3 }, calories: 130 },
  { id: "oats", name: "Oats (dry)", category: "grains", macros: { protein: 17, carbs: 66, fat: 7 }, calories: 389 },
  { id: "whole_wheat_bread", name: "Whole Wheat Bread", category: "grains", macros: { protein: 3.6, carbs: 41, fat: 1.5 }, calories: 217 },
  { id: "white_bread", name: "White Bread", category: "grains", macros: { protein: 3.3, carbs: 41, fat: 1.1 }, calories: 212 },
  { id: "pasta_whole_wheat", name: "Pasta (whole wheat, cooked)", category: "grains", macros: { protein: 3.7, carbs: 27, fat: 1.1 }, calories: 124 },
  { id: "pasta_white", name: "Pasta (white, cooked)", category: "grains", macros: { protein: 3.6, carbs: 31, fat: 0.3 }, calories: 131 },
  { id: "quinoa", name: "Quinoa (cooked)", category: "grains", macros: { protein: 4.4, carbs: 21, fat: 1.9 }, calories: 120 },
  { id: "sweet_potato", name: "Sweet Potato (baked)", category: "carbs", macros: { protein: 1.6, carbs: 20, fat: 0.1 }, calories: 86 },
  { id: "white_potato", name: "Potato (baked)", category: "carbs", macros: { protein: 2.1, carbs: 17, fat: 0.1 }, calories: 77 },
  { id: "banana", name: "Banana (medium)", category: "fruits", macros: { protein: 1.3, carbs: 27, fat: 0.3 }, calories: 105 },
  { id: "apple", name: "Apple (medium)", category: "fruits", macros: { protein: 0.5, carbs: 25, fat: 0.3 }, calories: 95 },
  { id: "oat_bran", name: "Oat Bran", category: "grains", macros: { protein: 17, carbs: 66, fat: 7 }, calories: 404 },
  { id: "barley", name: "Barley (cooked)", category: "grains", macros: { protein: 3.6, carbs: 28, fat: 0.7 }, calories: 123 },

  // Vegetables
  { id: "broccoli", name: "Broccoli (raw)", category: "vegetables", macros: { protein: 2.8, carbs: 7, fat: 0.4 }, calories: 34 },
  { id: "spinach", name: "Spinach (raw)", category: "vegetables", macros: { protein: 2.7, carbs: 3.6, fat: 0.4 }, calories: 23 },
  { id: "kale", name: "Kale (raw)", category: "vegetables", macros: { protein: 4.3, carbs: 9, fat: 0.9 }, calories: 49 },
  { id: "carrots", name: "Carrots (raw)", category: "vegetables", macros: { protein: 0.9, carbs: 10, fat: 0.2 }, calories: 41 },
  { id: "bell_pepper", name: "Bell Pepper (raw)", category: "vegetables", macros: { protein: 0.9, carbs: 6, fat: 0.3 }, calories: 31 },
  { id: "tomato", name: "Tomato (raw)", category: "vegetables", macros: { protein: 0.9, carbs: 3.9, fat: 0.2 }, calories: 18 },
  { id: "cucumber", name: "Cucumber (raw)", category: "vegetables", macros: { protein: 0.7, carbs: 3.6, fat: 0.1 }, calories: 16 },
  { id: "zucchini", name: "Zucchini (raw)", category: "vegetables", macros: { protein: 1.5, carbs: 3.4, fat: 0.4 }, calories: 21 },
  { id: "asparagus", name: "Asparagus (raw)", category: "vegetables", macros: { protein: 2.2, carbs: 3.7, fat: 0.1 }, calories: 20 },
  { id: "green_beans", name: "Green Beans (raw)", category: "vegetables", macros: { protein: 1.8, carbs: 7, fat: 0.1 }, calories: 31 },
  { id: "mushrooms", name: "Mushrooms (raw)", category: "vegetables", macros: { protein: 3.1, carbs: 3.3, fat: 0.3 }, calories: 22 },
  { id: "onion", name: "Onion (raw)", category: "vegetables", macros: { protein: 1.1, carbs: 9, fat: 0.1 }, calories: 40 },
  { id: "garlic", name: "Garlic (raw)", category: "vegetables", macros: { protein: 6.4, carbs: 33, fat: 0.5 }, calories: 149 },
  { id: "cauliflower", name: "Cauliflower (raw)", category: "vegetables", macros: { protein: 1.9, carbs: 5, fat: 0.3 }, calories: 25 },

  // Fruits
  { id: "orange", name: "Orange (medium)", category: "fruits", macros: { protein: 0.7, carbs: 12, fat: 0.3 }, calories: 47 },
  { id: "strawberry", name: "Strawberry", category: "fruits", macros: { protein: 0.7, carbs: 7, fat: 0.3 }, calories: 32 },
  { id: "blueberry", name: "Blueberry", category: "fruits", macros: { protein: 0.7, carbs: 14, fat: 0.3 }, calories: 57 },
  { id: "watermelon", name: "Watermelon", category: "fruits", macros: { protein: 0.6, carbs: 12, fat: 0.2 }, calories: 30 },
  { id: "mango", name: "Mango (raw)", category: "fruits", macros: { protein: 0.8, carbs: 15, fat: 0.3 }, calories: 60 },
  { id: "pineapple", name: "Pineapple (raw)", category: "fruits", macros: { protein: 0.5, carbs: 13, fat: 0.1 }, calories: 50 },
  { id: "grape", name: "Grapes", category: "fruits", macros: { protein: 0.7, carbs: 17, fat: 0.2 }, calories: 67 },
  { id: "avocado", name: "Avocado", category: "fruits", macros: { protein: 3, carbs: 9, fat: 15 }, calories: 160 },

  // Dairy
  { id: "whole_milk", name: "Whole Milk", category: "dairy", macros: { protein: 3.2, carbs: 4.8, fat: 3.6 }, calories: 61 },
  { id: "skim_milk", name: "Skim Milk", category: "dairy", macros: { protein: 3.4, carbs: 4.8, fat: 0.1 }, calories: 35 },
  { id: "cheddar_cheese", name: "Cheddar Cheese", category: "dairy", macros: { protein: 23, carbs: 1.3, fat: 33 }, calories: 403 },
  { id: "mozzarella", name: "Mozzarella Cheese", category: "dairy", macros: { protein: 28, carbs: 3.1, fat: 22 }, calories: 280 },
  { id: "yogurt_plain", name: "Yogurt (plain, full-fat)", category: "dairy", macros: { protein: 3.5, carbs: 4.7, fat: 3.3 }, calories: 61 },

  // Oils & Fats
  { id: "olive_oil", name: "Olive Oil", category: "oils", macros: { protein: 0, carbs: 0, fat: 100 }, calories: 884 },
  { id: "coconut_oil", name: "Coconut Oil", category: "oils", macros: { protein: 0, carbs: 0, fat: 100 }, calories: 892 },
  { id: "butter", name: "Butter", category: "oils", macros: { protein: 0.7, carbs: 0.1, fat: 81 }, calories: 717 },
  { id: "peanut_oil", name: "Peanut Oil", category: "oils", macros: { protein: 0, carbs: 0, fat: 100 }, calories: 884 },

  // Snacks & Other
  { id: "dark_chocolate", name: "Dark Chocolate (70%)", category: "other", macros: { protein: 12, carbs: 46, fat: 43 }, calories: 598 },
  { id: "granola", name: "Granola", category: "other", macros: { protein: 9, carbs: 68, fat: 20 }, calories: 471 },
  { id: "protein_powder", name: "Protein Powder (whey)", category: "other", macros: { protein: 80, carbs: 7, fat: 2 }, calories: 360 },
  { id: "honey", name: "Honey", category: "other", macros: { protein: 0.3, carbs: 82, fat: 0 }, calories: 304 },
  { id: "peanuts", name: "Peanuts (roasted)", category: "other", macros: { protein: 26, carbs: 16, fat: 49 }, calories: 567 },
  { id: "walnuts", name: "Walnuts", category: "other", macros: { protein: 9, carbs: 11, fat: 65 }, calories: 654 },
  { id: "cashews", name: "Cashews", category: "other", macros: { protein: 18, carbs: 30, fat: 44 }, calories: 553 },
];

/**
 * Calculate macros based on food and quantity (in grams)
 */
export function calculateMacros(food: FoodItem, quantityGrams: number) {
  const multiplier = quantityGrams / 100;
  return {
    protein: Math.round(food.macros.protein * multiplier * 10) / 10,
    carbs: Math.round(food.macros.carbs * multiplier * 10) / 10,
    fat: Math.round(food.macros.fat * multiplier * 10) / 10,
    calories: Math.round(food.calories * multiplier),
  };
}

/**
 * Search foods by name
 */
export function searchFoods(query: string): FoodItem[] {
  const lowerQuery = query.toLowerCase();
  return FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get foods by category
 */
export function getFoodsByCategory(category: FoodItem["category"]): FoodItem[] {
  return FOOD_DATABASE.filter(food => food.category === category);
}
