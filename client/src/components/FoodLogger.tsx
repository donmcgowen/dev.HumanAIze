import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FOOD_DATABASE, calculateMacros, searchFoods } from "@/../../shared/foodDatabase";
import { toast } from "sonner";
import { Plus, Trash2, Search, Edit2, Check, X } from "lucide-react";
import { useState, useMemo } from "react";

export function FoodLogger() {
  const { data: foodLogs, isLoading, refetch } = trpc.food.getDayLogs.useQuery({
    startOfDay: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
    endOfDay: new Date(new Date().setHours(23, 59, 59, 999)).getTime(),
  });
  const addFoodLog = trpc.food.addLog.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedFood(null);
      setQuantity("");
      setQuantityUnit("grams");
      setSearchQuery("");
      toast.success("Food logged successfully");
    },
    onError: () => {
      toast.error("Failed to log food");
    },
  });
  const deleteFoodLog = trpc.food.deleteLog.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Food removed");
    },
  });
  const updateFoodLog = trpc.food.updateLog.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setEditValues({});
      toast.success("Food updated");
    },
    onError: () => {
      toast.error("Failed to update food");
    },
  });

  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("grams");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, any>>({});

  const handleEditStart = (log: any) => {
    setEditingId(log.id);
    setEditValues({
      [log.id]: {
        foodName: log.foodName,
        calories: log.calories,
        proteinGrams: log.proteinGrams,
        carbsGrams: log.carbsGrams,
        fatGrams: log.fatGrams,
      },
    });
  };

  const handleEditSave = (logId: number) => {
    const values = editValues[logId];
    if (!values) return;
    updateFoodLog.mutate({
      foodLogId: logId,
      ...values,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  // Filter foods based on search
  const filteredFoods = useMemo(() => {
    if (!searchQuery) return FOOD_DATABASE.slice(0, 15);
    return searchFoods(searchQuery).slice(0, 15);
  }, [searchQuery]);

  // Get selected food details
  const selectedFoodItem = selectedFood
    ? FOOD_DATABASE.find(f => f.id === selectedFood)
    : null;

  // Convert quantity to grams
  const getQuantityInGrams = (): number => {
    const qty = parseFloat(quantity);
    if (!qty || isNaN(qty)) return 0;

    switch (quantityUnit) {
      case "oz":
        return qty * 28.35; // 1 oz = 28.35g
      case "lbs":
        return qty * 453.6; // 1 lb = 453.6g
      case "cup":
        return qty * 240; // 1 cup ≈ 240g (approximate)
      case "grams":
      default:
        return qty;
    }
  };

  // Calculate macros for selected food and quantity
  const calculatedMacros = useMemo(() => {
    if (!selectedFoodItem || !quantity) {
      return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    }
    const quantityInGrams = getQuantityInGrams();
    return calculateMacros(selectedFoodItem, quantityInGrams);
  }, [selectedFoodItem, quantity, quantityUnit]);

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    if (!foodLogs) return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    return foodLogs.reduce(
      (acc: any, log: any) => ({
        protein: acc.protein + (log.proteinGrams || 0),
        carbs: acc.carbs + (log.carbsGrams || 0),
        fat: acc.fat + (log.fatGrams || 0),
        calories: acc.calories + (log.calories || 0),
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [foodLogs]);

  const handleAddFood = () => {
    if (!selectedFoodItem || !quantity) return;

    addFoodLog.mutate({
      foodName: selectedFoodItem.name,
      servingSize: `${quantity}${quantityUnit}`,
      calories: Math.round(calculatedMacros.calories),
      proteinGrams: Math.round(calculatedMacros.protein * 10) / 10,
      carbsGrams: Math.round(calculatedMacros.carbs * 10) / 10,
      fatGrams: Math.round(calculatedMacros.fat * 10) / 10,
      mealType: "other",
      loggedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Food Input Card */}
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle>Log Food</CardTitle>
          <CardDescription>Search and add foods to track your macros</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Label className="text-xs text-slate-400 mb-2 block">Search Food</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="e.g., chicken, rice, egg..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9 bg-white/10 border-white/20"
              />
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchQuery && filteredFoods.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/20 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => {
                      setSelectedFood(food.id);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 transition text-sm text-slate-300"
                  >
                    <div className="font-medium">{food.name}</div>
                    <div className="text-xs text-slate-500">
                      {(food as any).protein}g protein • {(food as any).carbs}g carbs • {(food as any).fat}g fat • {(food as any).calories} cal per 100g
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity Input */}
          {selectedFood && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-400 mb-2 block">Quantity</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-white/10 border-white/20"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400 mb-2 block">Unit</Label>
                <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                  <SelectTrigger className="bg-white/10 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">g</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="cup">cup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Auto-calculated Macros Display */}
          {selectedFoodItem && quantity && (
            <div className="bg-cyan-300/10 border border-cyan-300/30 rounded p-4 space-y-3">
              <div className="text-sm font-semibold text-cyan-100">
                {selectedFoodItem.name} - {quantity} {quantityUnit}
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="bg-white/5 p-2 rounded">
                  <div className="text-xs text-slate-400">Protein</div>
                  <div className="font-bold text-white">{calculatedMacros.protein}g</div>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <div className="text-xs text-slate-400">Carbs</div>
                  <div className="font-bold text-white">{calculatedMacros.carbs}g</div>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <div className="text-xs text-slate-400">Fat</div>
                  <div className="font-bold text-white">{calculatedMacros.fat}g</div>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <div className="text-xs text-slate-400">Calories</div>
                  <div className="font-bold text-white">{calculatedMacros.calories}</div>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          <Button
            onClick={handleAddFood}
            disabled={addFoodLog.isPending || !selectedFood || !quantity}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addFoodLog.isPending ? "Adding..." : "Add to Log"}
          </Button>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/5 p-3 rounded">
              <div className="text-xs text-slate-400">Protein</div>
              <div className="text-lg font-bold text-white">{dailyTotals.protein.toFixed(1)}g</div>
            </div>
            <div className="bg-white/5 p-3 rounded">
              <div className="text-xs text-slate-400">Carbs</div>
              <div className="text-lg font-bold text-white">{dailyTotals.carbs.toFixed(1)}g</div>
            </div>
            <div className="bg-white/5 p-3 rounded">
              <div className="text-xs text-slate-400">Fat</div>
              <div className="text-lg font-bold text-white">{dailyTotals.fat.toFixed(1)}g</div>
            </div>
            <div className="bg-white/5 p-3 rounded">
              <div className="text-xs text-slate-400">Calories</div>
              <div className="text-lg font-bold text-white">{dailyTotals.calories.toFixed(0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Log List */}
      {foodLogs && foodLogs.length > 0 && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Today's Foods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {foodLogs.map((log: any) => {
                const isEditing = editingId === log.id;
                const values = editValues[log.id];
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-white/5 rounded border border-white/10"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={values.foodName}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [log.id]: { ...values, foodName: e.target.value },
                            })
                          }
                          placeholder="Food name"
                          className="bg-white/10 border-white/20"
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Protein (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={values.proteinGrams}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [log.id]: {
                                    ...values,
                                    proteinGrams: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-white/10 border-white/20 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Carbs (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={values.carbsGrams}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [log.id]: {
                                    ...values,
                                    carbsGrams: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-white/10 border-white/20 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Fat (g)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={values.fatGrams}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [log.id]: {
                                    ...values,
                                    fatGrams: parseFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-white/10 border-white/20 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400 mb-1 block">Calories</Label>
                            <Input
                              type="number"
                              value={values.calories}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [log.id]: {
                                    ...values,
                                    calories: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-white/10 border-white/20 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(log.id)}
                            disabled={updateFoodLog.isPending}
                            className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="flex-1 border-white/20"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{log.foodName}</div>
                          <div className="text-xs text-slate-400">
                            P: {log.proteinGrams}g | C: {log.carbsGrams}g | F: {log.fatGrams}g | {log.calories} cal
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStart(log)}
                            className="text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFoodLog.mutate({ foodLogId: log.id })}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center text-slate-400">Loading food logs...</div>
      )}
    </div>
  );
}
