import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateMacros, getActivityLevelLabel, type ActivityLevel, type FitnessGoal, type MacroSuggestion } from "../../../shared/macroCalculator";
import { Zap } from "lucide-react";

interface MacroCalculatorProps {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  fitnessGoal: FitnessGoal;
  activityLevel?: ActivityLevel;
  onApply: (macros: MacroSuggestion, activityLevel: ActivityLevel) => void;
  isLoading?: boolean;
}

export function MacroCalculator({
  heightCm,
  weightKg,
  ageYears,
  fitnessGoal,
  activityLevel = "moderately_active",
  onApply,
  isLoading = false,
}: MacroCalculatorProps) {
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<ActivityLevel>(activityLevel);

  // Calculate macros based on current inputs
  const suggestion = calculateMacros({
    heightCm,
    weightKg,
    ageYears,
    fitnessGoal,
    activityLevel: selectedActivityLevel,
  });

  const handleApply = () => {
    onApply(suggestion, selectedActivityLevel);
  };

  return (
    <Card className="border border-white/10 bg-slate-950">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Macro Calculator
            </CardTitle>
            <CardDescription>Get personalized macro recommendations based on your profile</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activity Level Selector */}
        <div>
          <Label htmlFor="activityLevel" className="text-slate-300 mb-2 block">
            Activity Level
          </Label>
          <Select value={selectedActivityLevel} onValueChange={(value) => setSelectedActivityLevel(value as ActivityLevel)}>
            <SelectTrigger className="bg-slate-900 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
              <SelectItem value="lightly_active">Lightly Active (1-3 days/week)</SelectItem>
              <SelectItem value="moderately_active">Moderately Active (3-5 days/week)</SelectItem>
              <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
              <SelectItem value="extremely_active">Extremely Active (physical job)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400 mt-2">{getActivityLevelLabel(selectedActivityLevel)}</p>
        </div>

        {/* Macro Suggestions */}
        <div className="space-y-3">
          <p className="text-slate-300 text-sm font-semibold">Recommended Daily Targets</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Calories */}
            <div className="bg-slate-900 p-4 rounded-lg border border-cyan-500/20">
              <p className="text-slate-400 text-xs mb-1">Calories</p>
              <p className="text-cyan-400 text-2xl font-bold">{suggestion.dailyCalories}</p>
              <p className="text-slate-500 text-xs mt-1">kcal/day</p>
            </div>

            {/* Protein */}
            <div className="bg-slate-900 p-4 rounded-lg border border-red-500/20">
              <p className="text-slate-400 text-xs mb-1">Protein</p>
              <p className="text-red-400 text-2xl font-bold">{suggestion.dailyProtein}g</p>
              <p className="text-slate-500 text-xs mt-1">{suggestion.proteinPercentage}%</p>
            </div>

            {/* Carbs */}
            <div className="bg-slate-900 p-4 rounded-lg border border-blue-500/20">
              <p className="text-slate-400 text-xs mb-1">Carbs</p>
              <p className="text-blue-400 text-2xl font-bold">{suggestion.dailyCarbs}g</p>
              <p className="text-slate-500 text-xs mt-1">{suggestion.carbsPercentage}%</p>
            </div>

            {/* Fat */}
            <div className="bg-slate-900 p-4 rounded-lg border border-yellow-500/20">
              <p className="text-slate-400 text-xs mb-1">Fat</p>
              <p className="text-yellow-400 text-2xl font-bold">{suggestion.dailyFat}g</p>
              <p className="text-slate-500 text-xs mt-1">{suggestion.fatPercentage}%</p>
            </div>
          </div>
        </div>

        {/* Macro Breakdown Visualization */}
        <div className="space-y-2">
          <p className="text-slate-300 text-sm font-semibold">Macro Breakdown</p>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden bg-slate-900 border border-white/10">
            <div
              className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${suggestion.proteinPercentage}%` }}
              title={`Protein: ${suggestion.proteinPercentage}%`}
            >
              {suggestion.proteinPercentage > 10 && `${suggestion.proteinPercentage}%`}
            </div>
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${suggestion.carbsPercentage}%` }}
              title={`Carbs: ${suggestion.carbsPercentage}%`}
            >
              {suggestion.carbsPercentage > 10 && `${suggestion.carbsPercentage}%`}
            </div>
            <div
              className="bg-yellow-500 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${suggestion.fatPercentage}%` }}
              title={`Fat: ${suggestion.fatPercentage}%`}
            >
              {suggestion.fatPercentage > 10 && `${suggestion.fatPercentage}%`}
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-slate-400">Protein</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-slate-400">Carbs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span className="text-slate-400">Fat</span>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <Button
          onClick={handleApply}
          disabled={isLoading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
        >
          {isLoading ? "Applying..." : "Apply These Targets"}
        </Button>

        {/* Info */}
        <div className="p-3 rounded-lg bg-slate-900 border border-white/10">
          <p className="text-slate-400 text-xs">
            💡 These recommendations are based on the Mifflin-St Jeor formula for BMR calculation and standard macro ratios for your fitness goal. You can adjust these values manually if needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
