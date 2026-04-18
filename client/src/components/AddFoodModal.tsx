import { useEffect, useId, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, FileText, Barcode, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

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
    sugarGrams?: number;
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
            <AIScannerTab onFoodAdded={onFoodAdded} onClose={onClose} />
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

function parseServingSizeForInput(servingSize?: string): { amount: string; unit: "g" | "oz" } | null {
  if (!servingSize) return null;
  const match = servingSize.trim().match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|oz|ounce|ounces)\b/i);
  if (!match) return null;

  const amount = match[1];
  const unit = /^oz|ounce/i.test(match[2]) ? "oz" : "g";
  return { amount, unit };
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
    const parsedServing = parseServingSizeForInput(food?.servingSize);
    if (parsedServing) {
      setServingAmount(parsedServing.amount);
      setServingUnit(parsedServing.unit);
      return;
    }
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
        <Label htmlFor="search-food">Search Foods</Label>
        <Input
          id="search-food"
          placeholder="e.g., protein bar, greek yogurt, chicken breast..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedFood(null); }}
          className="w-full"
          autoFocus
        />
        <p className="text-xs text-gray-500">
          {debouncedQuery.trim().length <= 2
            ? "Type at least 3 characters to search"
            : "Searching OpenFoodFacts first, then online sources for top matches..."}
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
            {selectedFood.servingSize && (
              <p className="text-xs text-gray-400 mt-1">Default serving: {selectedFood.servingSize}</p>
            )}
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

interface AIScannerTabProps {
  onFoodAdded: (food: {
    foodName: string;
    servingSize: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    sugarGrams?: number;
  }) => void;
  onClose: () => void;
}

interface ScannerFoodCandidate {
  foodName: string;
  servingSize: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sugarGrams: number;
  sourceLabel: string;
}

function AIScannerTab({ onFoodAdded, onClose }: AIScannerTabProps) {
  const utils = trpc.useUtils();
  const scannerId = useId();
  const readerElementId = useMemo(() => `food-barcode-reader-${scannerId.replace(/:/g, "")}`, [scannerId]);

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [usdaQuery, setUsdaQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<ScannerFoodCandidate | null>(null);

  const { data: usdaResults, isLoading: usdaLoading } = trpc.food.searchUSDA.useQuery(
    { query: usdaQuery },
    { enabled: usdaQuery.trim().length > 2 }
  );

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    let isMounted = true;

    const normalizeBarcode = (raw: string): string | null => {
      const matches = raw.match(/\d{8,14}/g);
      if (!matches || matches.length === 0) return null;
      return matches.sort((a, b) => b.length - a.length)[0];
    };

    const onScanSuccess = async (decodedText: string) => {
      const normalizedBarcode = normalizeBarcode(decodedText);
      if (!normalizedBarcode) {
        if (isMounted) {
          setScannerError("Scan detected, but no valid 8-14 digit barcode was found.");
          toast.error("Invalid barcode format");
        }
        return;
      }

      if (isMounted) {
        setScanResult(normalizedBarcode);
        setLookupLoading(true);
        setScannerError(null);
      }

      try {
        const product = await utils.food.lookupBarcode.fetch({ barcode: normalizedBarcode });

        if (!isMounted) return;

        if (product) {
          setSelectedFood({
            foodName: product.name,
            servingSize: `${product.servingSize}${product.servingUnit}`,
            calories: Number(product.calories) || 0,
            proteinGrams: Number(product.protein) || 0,
            carbsGrams: Number(product.carbs) || 0,
            fatGrams: Number(product.fat) || 0,
            sugarGrams: Number((product as any).sugar) || 0,
            sourceLabel: `Open Food Facts (${normalizedBarcode})`,
          });
          toast.success(`Found product: ${product.name}`);
        } else {
          toast.info("No Open Food Facts match. Try USDA search below.");
        }
      } catch (_error) {
        if (isMounted) {
          setScannerError("Barcode lookup failed. You can still search USDA below.");
          toast.error("Barcode lookup failed");
        }
      } finally {
        if (isMounted) {
          setLookupLoading(false);
        }
        if (scanner) {
          await scanner.stop().catch(() => undefined);
          scanner.clear();
        }
      }
    };

    const onScanFailure = () => {
      // Keep scanner quiet during normal frame misses.
    };

    const startScanner = async () => {
      scanner = new Html5Qrcode(readerElementId, { verbose: false });
      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      try {
        await scanner.start({ facingMode: "environment" }, scanConfig, onScanSuccess, onScanFailure);
      } catch (_error) {
        // Fallback for devices that don't expose an environment camera constraint.
        try {
          await scanner.start({ facingMode: "user" }, scanConfig, onScanSuccess, onScanFailure);
        } catch (_fallbackError) {
          if (isMounted) {
            setScannerError("Unable to start camera scanner. Check camera permissions and reload.");
            toast.error("Could not start camera scanner");
          }
        }
      }
    };

    void startScanner();

    return () => {
      isMounted = false;
      if (scanner) {
        void scanner.stop().catch(() => undefined);
        scanner.clear();
      }
    };
  }, [readerElementId, utils.food.lookupBarcode]);

  const handleUseUsdaResult = (food: any) => {
    const servingSize = food.servingSize || "100g";
    const servingUnit = food.servingUnit ? `${food.servingUnit}` : "";
    setSelectedFood({
      foodName: food.foodName || food.description || "USDA Food",
      servingSize: `${servingSize}${servingUnit}`,
      calories: Number(food.calories) || 0,
      proteinGrams: Number(food.proteinGrams) || 0,
      carbsGrams: Number(food.carbsGrams) || 0,
      fatGrams: Number(food.fatGrams) || 0,
      sugarGrams: Number((food as any).sugarGrams) || 0,
      sourceLabel: "USDA FoodData Central",
    });
  };

  const handleAddScannedFood = () => {
    if (!selectedFood) return;
    onFoodAdded({
      foodName: selectedFood.foodName,
      servingSize: selectedFood.servingSize,
      calories: selectedFood.calories,
      proteinGrams: selectedFood.proteinGrams,
      carbsGrams: selectedFood.carbsGrams,
      fatGrams: selectedFood.fatGrams,
      sugarGrams: selectedFood.sugarGrams,
    });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Barcode Scanner</h4>
        <p className="text-xs text-slate-400">
          Scan package barcode to fetch product data from Open Food Facts. If not found, use USDA search.
        </p>
      </div>

      <div id={readerElementId} className="w-full overflow-hidden rounded-lg border border-slate-700" />

      {lookupLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking up scanned barcode...
        </div>
      )}

      {scanResult && <p className="text-xs text-slate-400">Last scanned barcode: {scanResult}</p>}

      {scannerError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{scannerError}</span>
        </div>
      )}

      <div className="space-y-2 border-t border-slate-700 pt-4">
        <Label htmlFor="usda-search">USDA fallback search</Label>
        <Input
          id="usda-search"
          value={usdaQuery}
          onChange={(e) => setUsdaQuery(e.target.value)}
          placeholder="Search USDA foods if barcode lookup fails"
        />
        {usdaLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching USDA...
          </div>
        )}
        {usdaResults && usdaResults.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2 rounded border border-slate-700 p-2">
            {usdaResults.map((food) => (
              <button
                key={food.fdcId}
                type="button"
                onClick={() => handleUseUsdaResult(food)}
                className="w-full text-left p-2 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <p className="text-sm font-medium">{food.foodName}</p>
                <p className="text-xs text-slate-400">
                  {food.calories} cal | P {food.proteinGrams}g | C {food.carbsGrams}g | F {food.fatGrams}g | Sugar {(food as any).sugarGrams || 0}g
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFood && (
        <div className="space-y-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div>
            <p className="text-sm font-semibold text-white">{selectedFood.foodName}</p>
            <p className="text-xs text-cyan-300">Source: {selectedFood.sourceLabel}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-slate-900/60 p-2">Serving: {selectedFood.servingSize}</div>
            <div className="rounded bg-slate-900/60 p-2">Calories: {selectedFood.calories}</div>
            <div className="rounded bg-slate-900/60 p-2">Protein: {selectedFood.proteinGrams}g</div>
            <div className="rounded bg-slate-900/60 p-2">Carbs: {selectedFood.carbsGrams}g</div>
            <div className="rounded bg-slate-900/60 p-2">Fat: {selectedFood.fatGrams}g</div>
            <div className="rounded bg-slate-900/60 p-2">Sugar: {selectedFood.sugarGrams}g</div>
          </div>
          <Button onClick={handleAddScannedFood} className="w-full bg-cyan-600 hover:bg-cyan-700">
            Add Food
          </Button>
        </div>
      )}
    </div>
  );
}
