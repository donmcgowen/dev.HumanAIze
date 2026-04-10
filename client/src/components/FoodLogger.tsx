import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

// Common foods library with approximate macros
const COMMON_FOODS = [
  { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Brown Rice (1 cup cooked)", calories: 215, protein: 5, carbs: 45, fat: 1.8 },
  { name: "Broccoli (1 cup)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Egg (1 large)", calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  { name: "Banana (1 medium)", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { name: "Oatmeal (1 cup cooked)", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: "Almonds (1 oz)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Greek Yogurt (1 cup)", calories: 130, protein: 23, carbs: 9, fat: 0.4 },
  { name: "Sweet Potato (1 medium)", calories: 103, protein: 2.3, carbs: 24, fat: 0.1 },
];

export function FoodLogger({ userId }: { userId: number }) {
  const [selectedFood, setSelectedFood] = useState("");
  const [customFood, setCustomFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [mealType, setMealType] = useState("lunch");
  const [showCustom, setShowCustom] = useState(false);

  const { data: todayLogs, refetch: refetchLogs } = trpc.food.getDayLogs.useQuery({
    startOfDay: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
    endOfDay: new Date(new Date().setHours(23, 59, 59, 999)).getTime(),
  });

  const addLog = trpc.food.addLog.useMutation({
    onSuccess: () => {
      toast.success("Food logged successfully!");
      refetchLogs();
      setSelectedFood("");
      setCustomFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
      setShowCustom(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to log food");
    },
  });

  const deleteLog = trpc.food.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Food log deleted");
      refetchLogs();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete food log");
    },
  });

  const handleAddFood = () => {
    if (showCustom) {
      if (!customFood.name || !customFood.calories || !customFood.protein || !customFood.carbs || !customFood.fat) {
        toast.error("Please fill in all fields");
        return;
      }
      addLog.mutate({
        foodName: customFood.name,
        calories: parseInt(customFood.calories),
        proteinGrams: parseFloat(customFood.protein),
        carbsGrams: parseFloat(customFood.carbs),
        fatGrams: parseFloat(customFood.fat),
        loggedAt: Date.now(),
        mealType: mealType as any,
      });
    } else if (selectedFood) {
      const food = COMMON_FOODS.find((f) => f.name === selectedFood);
      if (food) {
        addLog.mutate({
          foodName: food.name,
          calories: food.calories,
          proteinGrams: food.protein,
          carbsGrams: food.carbs,
          fatGrams: food.fat,
          loggedAt: Date.now(),
          mealType: mealType as any,
        });
      }
    } else {
      toast.error("Please select or enter a food");
    }
  };

  // Calculate daily totals
  const totals = todayLogs?.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.proteinGrams,
      carbs: acc.carbs + log.carbsGrams,
      fat: acc.fat + log.fatGrams,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Food Logger</CardTitle>
          <CardDescription>Log your meals and track daily macros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Food Selection */}
          <div className="space-y-2">
            <Label>Quick Add Food</Label>
            <Select value={selectedFood} onValueChange={setSelectedFood} disabled={showCustom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a common food..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_FOODS.map((food) => (
                  <SelectItem key={food.name} value={food.name}>
                    {food.name} - {food.calories} cal
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Food Entry */}
          {showCustom && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="foodName">Food Name</Label>
                <Input
                  id="foodName"
                  placeholder="e.g., Grilled Chicken with Rice"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="0"
                    value={customFood.calories}
                    onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="0"
                    value={customFood.protein}
                    onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    placeholder="0"
                    value={customFood.carbs}
                    onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    placeholder="0"
                    value={customFood.fat}
                    onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Meal Type Selection */}
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCustom(!showCustom);
                setSelectedFood("");
              }}
            >
              {showCustom ? "Use Quick Add" : "Enter Custom Food"}
            </Button>
            <Button onClick={handleAddFood} disabled={addLog.isPending} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{totals.calories}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{totals.protein.toFixed(1)}g</div>
              <div className="text-sm text-muted-foreground">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{totals.carbs.toFixed(1)}g</div>
              <div className="text-sm text-muted-foreground">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{totals.fat.toFixed(1)}g</div>
              <div className="text-sm text-muted-foreground">Fat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Log History */}
      {todayLogs && todayLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{log.foodName}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.calories} cal • P: {log.proteinGrams.toFixed(1)}g C: {log.carbsGrams.toFixed(1)}g F: {log.fatGrams.toFixed(1)}g
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLog.mutate({ foodLogId: log.id })}
                    disabled={deleteLog.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
