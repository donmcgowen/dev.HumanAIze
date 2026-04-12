import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, Barcode, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
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
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [servingSize, setServingSize] = useState("");

  const { data: searchResults, isLoading } = trpc.food.searchUSDA.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setServingSize(food.servingSize || "1 serving");
  };

  const handleAddFood = () => {
    if (selectedFood) {
      onFoodAdded({
        foodName: selectedFood.foodName,
        servingSize,
        calories: selectedFood.calories,
        proteinGrams: selectedFood.proteinGrams,
        carbsGrams: selectedFood.carbsGrams,
        fatGrams: selectedFood.fatGrams,
      });
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search-food">Search USDA Database</Label>
        <Input
          id="search-food"
          placeholder="e.g., chicken breast, brown rice, broccoli..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-gray-500">Start typing to search for foods</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Searching...</span>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map((food: any, idx: number) => (
            <Card
              key={idx}
              className={`p-3 cursor-pointer transition-colors ${
                selectedFood?.foodName === food.foodName
                  ? "bg-blue-50 border-blue-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectFood(food)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{food.foodName}</p>
                  <p className="text-xs text-gray-500">{food.servingSize}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">{food.calories} cal</p>
                  <p className="text-gray-600">{food.proteinGrams}g P</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedFood && (
        <div className="border-t pt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="serving-size">Serving Size</Label>
            <Input
              id="serving-size"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              placeholder="e.g., 100g, 1 cup, 1 breast"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs text-gray-600">Calories</p>
              <p className="font-semibold">{selectedFood.calories}</p>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <p className="text-xs text-gray-600">Protein</p>
              <p className="font-semibold">{selectedFood.proteinGrams}g</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <p className="text-xs text-gray-600">Carbs</p>
              <p className="font-semibold">{selectedFood.carbsGrams}g</p>
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <p className="text-xs text-gray-600">Fat</p>
              <p className="font-semibold">{selectedFood.fatGrams}g</p>
            </div>
          </div>

          <Button onClick={handleAddFood} className="w-full">
            Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Button>
        </div>
      )}

      {searchQuery.length > 2 && searchResults && searchResults.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No foods found. Try a different search term.</p>
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

      <Button onClick={handleAddFood} disabled={!isValid} className="w-full">
        Add to {mealTypeLabel}
      </Button>
    </div>
  );
}

function AIScannerTab() {
  return (
    <div className="space-y-4 text-center py-8">
      <Barcode className="h-12 w-12 mx-auto text-gray-400" />
      <div>
        <h4 className="font-medium text-sm mb-1">AI Barcode Scanner</h4>
        <p className="text-xs text-gray-500 mb-4">
          Point your camera at a food barcode to automatically scan and populate nutrition information.
        </p>
      </div>
      <Button disabled className="w-full">
        Coming Soon
      </Button>
      <p className="text-xs text-gray-400">This feature is currently in development</p>
    </div>
  );
}
