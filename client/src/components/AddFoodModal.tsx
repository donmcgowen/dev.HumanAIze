import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, Barcode, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded: (food: {
    foodName: string;
    servingSize: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  }) => void;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "other";
}

export function AddFoodModal({ isOpen, onClose, onFoodAdded, mealType }: AddFoodModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "manual" | "ai">("search");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Food to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</DialogTitle>
          <DialogDescription>Choose how you want to add food to your meal</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Barcode className="h-4 w-4" />
              <span className="hidden sm:inline">AI Scan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            <SearchFoodTab onFoodAdded={onFoodAdded} onClose={onClose} />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <ManualEntryTab onFoodAdded={onFoodAdded} onClose={onClose} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <AIScannerTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface SearchFoodTabProps {
  onFoodAdded: (food: any) => void;
  onClose: () => void;
  mealType?: string;
}

function SearchFoodTab({ onFoodAdded, onClose, mealType = "meal" }: SearchFoodTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [servingAmount, setServingAmount] = useState("100");
  const [servingUnit, setServingUnit] = useState<"g" | "oz">("g");

  // Debounce: wait 500ms after user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: foodVariations, isLoading, error } = trpc.food.searchWithAI.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.trim().length > 2, retry: 1 }
  );

  const { data: calculatedMacros } = trpc.food.calculateServingMacros.useQuery(
    selectedFood && servingAmount
      ? {
          foodName: selectedFood.name,
          caloriesPer100g: selectedFood.caloriesPer100g,
          proteinPer100g: selectedFood.proteinPer100g,
          carbsPer100g: selectedFood.carbsPer100g,
          fatPer100g: selectedFood.fatPer100g,
          amount: parseFloat(servingAmount) || 0,
          unit: servingUnit,
        }
      : skipToken,
    { enabled: !!selectedFood && !!servingAmount }
  );

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setServingAmount("100");
    setServingUnit("g");
  };

  const handleAddFood = () => {
    if (selectedFood && calculatedMacros) {
      onFoodAdded({
        foodName: selectedFood.name,
        servingSize: `${servingAmount}${servingUnit}`,
        calories: calculatedMacros.calories,
        proteinGrams: calculatedMacros.protein,
        carbsGrams: calculatedMacros.carbs,
        fatGrams: calculatedMacros.fat,
      });
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search-food">Search Foods with AI</Label>
        <Input
          id="search-food"
          placeholder="e.g., chicken, pasta, salmon, broccoli..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedFood(null); }}
          className="w-full"
          autoFocus
        />
        <p className="text-xs text-gray-500">
          {debouncedQuery.trim().length <= 2 ? "Type at least 3 characters to search" : "Searching for food variations..."}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-cyan-400" />
          <span className="text-sm text-gray-400">Finding foods...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Search failed. Try a different query or use Manual entry.</span>
        </div>
      )}

      {!isLoading && !error && debouncedQuery.trim().length > 2 && foodVariations && foodVariations.length === 0 && !selectedFood && (
        <div className="text-center py-6 text-slate-400 text-sm">
          No results found for "{debouncedQuery}". Try a different term or use Manual entry.
        </div>
      )}

      {foodVariations && foodVariations.length > 0 && !selectedFood && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {foodVariations.map((food: any, idx: number) => (
            <Card
              key={idx}
              className="p-3 cursor-pointer transition-colors hover:bg-blue-50/50 border-gray-700 hover:border-blue-400"
              onClick={() => handleSelectFood(food)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">{food.name}</p>
                  <p className="text-xs text-gray-400">{food.description}</p>
                </div>
                <div className="text-right text-xs ml-2">
                  <p className="font-semibold">{Math.round(food.caloriesPer100g)} cal/100g</p>
                  <p className="text-gray-400">{food.proteinPer100g}g P</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedFood && (
        <div className="space-y-4 p-4 bg-blue-50/10 border border-blue-500/20 rounded-lg">
          <div>
            <h4 className="font-semibold text-sm mb-1">{selectedFood.name}</h4>
            <p className="text-xs text-gray-400">{selectedFood.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="serving-amount" className="text-xs">Amount</Label>
              <Input
                id="serving-amount"
                type="number"
                placeholder="100"
                value={servingAmount}
                onChange={(e) => setServingAmount(e.target.value)}
                min="1"
                step="0.1"
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="serving-unit" className="text-xs">Unit</Label>
              <select
                id="serving-unit"
                value={servingUnit}
                onChange={(e) => setServingUnit(e.target.value as "g" | "oz")}
                className="w-full px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800 text-white"
              >
                <option value="g">Grams (g)</option>
                <option value="oz">Ounces (oz)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Calories</Label>
              <div className="px-2 py-1 text-sm font-semibold bg-gray-800 rounded">
                {calculatedMacros?.calories || 0}
              </div>
            </div>
          </div>

          {calculatedMacros && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-gray-800 rounded">
                <p className="text-gray-400">Protein</p>
                <p className="font-semibold">{calculatedMacros.protein}g</p>
              </div>
              <div className="p-2 bg-gray-800 rounded">
                <p className="text-gray-400">Carbs</p>
                <p className="font-semibold">{calculatedMacros.carbs}g</p>
              </div>
              <div className="p-2 bg-gray-800 rounded">
                <p className="text-gray-400">Fat</p>
                <p className="font-semibold">{calculatedMacros.fat}g</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setSelectedFood(null)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleAddFood}
              disabled={!calculatedMacros}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Add Food
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


interface ManualEntryTabProps {
  onFoodAdded: (food: any) => void;
  onClose: () => void;
  mealType?: string;
}

function ManualEntryTab({ onFoodAdded, onClose, mealType = "meal" }: ManualEntryTabProps) {
  const [foodName, setFoodName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleAddFood = () => {
    if (foodName && calories && protein !== "" && carbs !== "" && fat !== "") {
      onFoodAdded({
        foodName,
        servingSize: servingSize || "1 serving",
        calories: Number(calories),
        proteinGrams: Number(protein),
        carbsGrams: Number(carbs),
        fatGrams: Number(fat),
      });
      onClose();
    }
  };

  const isValid = foodName && calories && protein !== "" && carbs !== "" && fat !== "";

  const mealTypeLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="food-name">Food Name *</Label>
        <Input
          id="food-name"
          placeholder="e.g., Grilled Chicken Breast"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="serving-size-manual">Serving Size</Label>
        <Input
          id="serving-size-manual"
          placeholder="e.g., 100g, 1 cup, 1 breast"
          value={servingSize}
          onChange={(e) => setServingSize(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="calories">Calories *</Label>
          <Input
            id="calories"
            type="number"
            placeholder="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="protein">Protein (g) *</Label>
          <Input
            id="protein"
            type="number"
            placeholder="0"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="carbs">Carbs (g) *</Label>
          <Input
            id="carbs"
            type="number"
            placeholder="0"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fat">Fat (g) *</Label>
          <Input
            id="fat"
            type="number"
            placeholder="0"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <Button
        onClick={handleAddFood}
        disabled={!isValid}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Add Food
      </Button>
    </div>
  );
}

function AIScannerTab() {
  return (
    <div className="space-y-8 text-center py-16">
      {/* Barcode Icon with Enhanced Animation */}
      <div className="flex justify-center">
        <div className="relative group">
          {/* Outer glow ring */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity duration-300"></div>
          {/* Middle ring */}
          <div className="absolute inset-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
          {/* Icon */}
          <Barcode className="h-20 w-20 mx-auto text-blue-300 relative group-hover:text-cyan-300 transition-colors duration-300 drop-shadow-lg" />
        </div>
      </div>

      {/* Title and Description */}
      <div className="space-y-3 px-4">
        <h4 className="font-bold text-xl text-white">AI Barcode Scanner</h4>
        <p className="text-sm text-gray-300 max-w-sm mx-auto leading-relaxed">
          Point your camera at a food barcode to instantly scan and auto-populate nutrition information with AI-powered accuracy.
        </p>
      </div>

      {/* Coming Soon Card with Enhanced Design */}
      <div className="bg-gradient-to-br from-blue-900/30 via-slate-900/20 to-cyan-900/30 rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/20">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-300 flex items-center justify-center gap-2">
            <span className="text-lg">✨</span>
            Coming Soon
          </p>
          <p className="text-xs text-gray-400">This feature is currently in development and will be available in the next release.</p>
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
            📸 Camera access • 🔍 Barcode recognition • 📊 Nutrition extraction
          </p>
        </div>
      </div>

      {/* Disabled Button with Enhanced Styling */}
      <Button 
        disabled 
        className="w-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-300 border border-blue-500/40 rounded-lg font-medium transition-all duration-300 cursor-not-allowed opacity-75"
      >
        <Barcode className="h-4 w-4 mr-2" />
        Enable Camera Scanner
      </Button>
    </div>
  );
}
