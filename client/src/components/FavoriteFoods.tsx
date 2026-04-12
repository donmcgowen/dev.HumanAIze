import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface FavoriteFoodsProps {
  onSelectFood?: (food: { id: string; foodName: string; calories: number; protein: number; carbs: number; fat: number }) => void;
}

export function FavoriteFoods({ onSelectFood }: FavoriteFoodsProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const { data: favorites, isLoading, refetch } = trpc.food.getFavorites.useQuery();
  const addFavoriteMutation = trpc.food.addFavorite.useMutation();
  const deleteFavoriteMutation = trpc.food.deleteFavorite.useMutation();

  const handleAddFavorite = async () => {
    if (!formData.foodName || !formData.calories) {
      toast.error("Please fill in food name and calories");
      return;
    }

    try {
      await addFavoriteMutation.mutateAsync({
        foodName: formData.foodName,
        calories: parseInt(formData.calories),
        proteinGrams: parseInt(formData.protein) || 0,
        carbsGrams: parseInt(formData.carbs) || 0,
        fatGrams: parseInt(formData.fat) || 0,
        servingSize: "1 serving",
      } as any);

      setFormData({ foodName: "", calories: "", protein: "", carbs: "", fat: "" });
      setShowForm(false);
      refetch();
      toast.success("Food added to favorites!");
    } catch (error) {
      toast.error("Failed to add favorite food");
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      await deleteFavoriteMutation.mutateAsync({ favoriteFoodId: id } as any);
      refetch();
      toast.success("Favorite removed");
    } catch (error) {
      toast.error("Failed to remove favorite");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Favorite Foods</h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Favorite
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-800 p-4 rounded-lg space-y-3">
          <Input
            placeholder="Food name"
            value={formData.foodName}
            onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Calories"
              type="number"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
            />
            <Input
              placeholder="Protein (g)"
              type="number"
              value={formData.protein}
              onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
            />
            <Input
              placeholder="Carbs (g)"
              type="number"
              value={formData.carbs}
              onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
            />
            <Input
              placeholder="Fat (g)"
              type="number"
              value={formData.fat}
              onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddFavorite} disabled={addFavoriteMutation.isPending}>
              Save
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-400">Loading favorites...</p>
      ) : favorites && favorites.length > 0 ? (
        <div className="space-y-2">
          {favorites.map((food: any) => (
            <div
              key={food.id}
              className="bg-slate-800 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-slate-700"
              onClick={() => onSelectFood?.(food as any)}
            >
              <div className="flex-1">
                <p className="font-medium">{food.foodName}</p>
                <p className="text-sm text-slate-400">
                  {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFavorite(food.favoriteFoodId.toString());
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">No favorite foods yet. Add one to get started!</p>
      )}
    </div>
  );
}
