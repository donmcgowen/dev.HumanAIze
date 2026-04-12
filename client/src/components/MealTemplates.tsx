import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface MealTemplatesProps {
  currentMeals?: Array<{ foodName: string; calories: number; protein: number; carbs: number; fat: number }>;
  onSelectMeal?: (meal: { mealTemplateId: number; mealName: string; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; foods?: any[] }) => void;
}

export function MealTemplates({ currentMeals = [], onSelectMeal }: MealTemplatesProps) {
  const [showForm, setShowForm] = useState(false);
  const [mealName, setMealName] = useState("");

  const { data: meals, isLoading, refetch } = trpc.food.getMeals.useQuery();
  const createMealMutation = trpc.food.createMeal.useMutation();
  const deleteMealMutation = trpc.food.deleteMeal.useMutation();

  const handleSaveMeal = async () => {
    if (!mealName || currentMeals.length === 0) {
      toast.error("Please enter meal name and add foods first");
      return;
    }

    try {
      const totalCalories = currentMeals.reduce((sum, m) => sum + m.calories, 0);
      const totalProtein = currentMeals.reduce((sum, m) => sum + m.protein, 0);
      const totalCarbs = currentMeals.reduce((sum, m) => sum + m.carbs, 0);
      const totalFat = currentMeals.reduce((sum, m) => sum + m.fat, 0);

      await createMealMutation.mutateAsync({
        mealName,
        foods: currentMeals as any,
        totalCalories,
        totalProteinGrams: totalProtein,
        totalCarbsGrams: totalCarbs,
        totalFatGrams: totalFat,
      } as any);

      setMealName("");
      setShowForm(false);
      refetch();
      toast.success("Meal template saved!");
    } catch (error) {
      toast.error("Failed to save meal template");
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteMealMutation.mutateAsync({ mealTemplateId: id } as any);
      refetch();
      toast.success("Meal template deleted");
    } catch (error) {
      toast.error("Failed to delete meal template");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Meal Templates</h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          disabled={currentMeals.length === 0}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Save Meal
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-800 p-4 rounded-lg space-y-3">
          <Input
            placeholder="Meal name (e.g., Typical Breakfast)"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
          />
          <p className="text-sm text-slate-400">
            Current meal: {currentMeals.length} items | {currentMeals.reduce((sum, m) => sum + m.calories, 0)} cal
          </p>
          <div className="flex gap-2">
            <Button onClick={handleSaveMeal} disabled={createMealMutation.isPending}>
              Save Meal
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-400">Loading meal templates...</p>
      ) : meals && meals.length > 0 ? (
        <div className="space-y-2">
          {meals.map((meal: any) => (
            <div
              key={meal.id}
              className="bg-slate-800 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-slate-700"
              onClick={() => onSelectMeal?.(meal as any)}
            >
              <div className="flex-1">
                <p className="font-medium">{meal.mealName}</p>
                <p className="text-sm text-slate-400">
                  {meal.totalCalories} cal | P: {meal.totalProtein}g | C: {meal.totalCarbs}g | F: {meal.totalFat}g
                </p>
                <p className="text-xs text-slate-500">{meal.foods?.length || 0} items</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMeal(meal.id);
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">No meal templates yet. Save a meal combination to get started!</p>
      )}
    </div>
  );
}
