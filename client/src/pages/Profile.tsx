import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ProgressPhotos } from "@/components/ProgressPhotos";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { calculateMacros, getActivityLevelLabel, type ActivityLevel, type MacroSuggestion } from "../../../shared/macroCalculator";

export function Profile() {
  const { data: profile, isLoading: isLoadingProfile, refetch } = trpc.profile.get.useQuery();
  const updateProfile = trpc.profile.upsert.useMutation();

  const [formData, setFormData] = useState({
    heightCm: "0",
    weightKg: "0",
    ageYears: "0",
    fitnessGoal: "",
  });

  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string>("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("lbs");
  const [heightUnit, setHeightUnit] = useState<"cm" | "in">("in");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderately_active");
  
  // Maintenance calories state
  const [maintenanceCalories, setMaintenanceCalories] = useState<MacroSuggestion | null>(null);
  const [customMaintenanceCalories, setCustomMaintenanceCalories] = useState<string>("");
  
  // Goal-based targets state
  const [goalWeightKg, setGoalWeightKg] = useState<string>("");
  const [goalDate, setGoalDate] = useState<string>("");
  const [goalTargets, setGoalTargets] = useState<MacroSuggestion | null>(null);
  
  // Customizable daily targets
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState<string>("");
  const [dailyProteinTarget, setDailyProteinTarget] = useState<string>("");
  const [dailyCarbsTarget, setDailyCarbsTarget] = useState<string>("");
  const [dailyFatTarget, setDailyFatTarget] = useState<string>("");

  // Unit conversion helpers
  const convertWeight = (kg: number, toUnit: "kg" | "lbs") => {
    return toUnit === "lbs" ? Math.round(kg * 2.20462 * 10) / 10 : kg;
  };

  const convertHeight = (cm: number, toUnit: "cm" | "in") => {
    return toUnit === "in" ? Math.round(cm / 2.54 * 10) / 10 : cm;
  };

  const displayWeight = () => {
    const kg = parseFloat(formData.weightKg);
    if (isNaN(kg) || kg <= 0) return "0";
    return convertWeight(kg, weightUnit).toString();
  };

  const displayHeight = () => {
    const cm = parseFloat(formData.heightCm);
    if (isNaN(cm) || cm <= 0) return "0";
    return convertHeight(cm, heightUnit).toString();
  };

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setFormData({
        heightCm: profile.heightCm ? profile.heightCm.toString() : "0",
        weightKg: profile.weightKg ? profile.weightKg.toString() : "0",
        ageYears: profile.ageYears ? profile.ageYears.toString() : "0",
        fitnessGoal: profile.fitnessGoal || "",
      });
      setDailyCalorieTarget(profile.dailyCalorieTarget ? profile.dailyCalorieTarget.toString() : "0");
      setDailyProteinTarget(profile.dailyProteinTarget ? profile.dailyProteinTarget.toString() : "0");
      setDailyCarbsTarget(profile.dailyCarbsTarget ? profile.dailyCarbsTarget.toString() : "0");
      setDailyFatTarget(profile.dailyFatTarget ? profile.dailyFatTarget.toString() : "0");
      setGoalWeightKg(profile.goalWeightKg ? profile.goalWeightKg.toString() : "");
      if (profile.goalDate) {
        const date = new Date(profile.goalDate);
        setGoalDate(date.toISOString().split('T')[0]);
      }
    }
  }, [profile]);

  // Calculate BMI whenever height or weight changes
  useEffect(() => {
    const heightInput = parseFloat(formData.heightCm);
    const weightInput = parseFloat(formData.weightKg);

    if (heightInput > 0 && weightInput > 0) {
      let calculatedBmi: number;
      
      if (heightUnit === "in" && weightUnit === "lbs") {
        calculatedBmi = (weightInput / (heightInput * heightInput)) * 703;
      } else if (heightUnit === "cm" && weightUnit === "kg") {
        const heightM = heightInput / 100;
        calculatedBmi = weightInput / (heightM * heightM);
      } else {
        // Mixed units - convert to metric first
        let heightCm = heightInput;
        let weightKg = weightInput;
        if (heightUnit === "in") heightCm = heightInput * 2.54;
        if (weightUnit === "lbs") weightKg = weightInput / 2.20462;
        const heightM = heightCm / 100;
        calculatedBmi = weightKg / (heightM * heightM);
      }

      const roundedBmi = Math.round(calculatedBmi * 10) / 10;
      setBmi(roundedBmi);

      if (roundedBmi < 18.5) setBmiCategory("Underweight");
      else if (roundedBmi < 25) setBmiCategory("Normal weight");
      else if (roundedBmi < 30) setBmiCategory("Overweight");
      else setBmiCategory("Obese");
    } else {
      setBmi(null);
      setBmiCategory("");
    }
  }, [formData.heightCm, formData.weightKg, heightUnit, weightUnit]);

  // Calculate maintenance calories whenever biometric data or activity level changes
  useEffect(() => {
    const heightInput = parseFloat(formData.heightCm);
    const weightInput = parseFloat(formData.weightKg);
    const ageInput = parseInt(formData.ageYears);

    if (heightInput > 0 && weightInput > 0 && ageInput > 0) {
      try {
        const maintenance = calculateMacros({
          heightCm: heightInput,
          weightKg: weightInput,
          ageYears: ageInput,
          fitnessGoal: "maintain",
          activityLevel,
        });
        setMaintenanceCalories(maintenance);
        setCustomMaintenanceCalories(maintenance.dailyCalories.toString());
      } catch (error) {
        console.error("Error calculating maintenance calories:", error);
      }
    }
  }, [formData.heightCm, formData.weightKg, formData.ageYears, activityLevel]);

  // Calculate goal-based targets when goal is selected
  useEffect(() => {
    if (formData.fitnessGoal && formData.fitnessGoal !== "maintain") {
      const heightInput = parseFloat(formData.heightCm);
      const weightInput = parseFloat(formData.weightKg);
      const ageInput = parseInt(formData.ageYears);

      if (heightInput > 0 && weightInput > 0 && ageInput > 0) {
        try {
          const targets = calculateMacros({
            heightCm: heightInput,
            weightKg: weightInput,
            ageYears: ageInput,
            fitnessGoal: formData.fitnessGoal as "lose_fat" | "build_muscle",
            activityLevel,
          });
          setGoalTargets(targets);
          // Auto-populate daily targets with calculated values
          setDailyCalorieTarget(targets.dailyCalories.toString());
          setDailyProteinTarget(targets.dailyProtein.toString());
          setDailyCarbsTarget(targets.dailyCarbs.toString());
          setDailyFatTarget(targets.dailyFat.toString());
        } catch (error) {
          console.error("Error calculating goal targets:", error);
        }
      }
    } else {
      setGoalTargets(null);
    }
  }, [formData.fitnessGoal, formData.heightCm, formData.weightKg, formData.ageYears, activityLevel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGoalChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      fitnessGoal: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let heightCmValue = formData.heightCm ? parseFloat(formData.heightCm) : undefined;
      let weightKgValue = formData.weightKg ? parseFloat(formData.weightKg) : undefined;
      
      if (heightCmValue && heightUnit === "in") {
        heightCmValue = heightCmValue * 2.54;
      }
      if (weightKgValue && weightUnit === "lbs") {
        weightKgValue = weightKgValue / 2.20462;
      }

      let goalWeightValue = goalWeightKg ? parseFloat(goalWeightKg) : undefined;
      if (goalWeightValue && weightUnit === "lbs") {
        goalWeightValue = goalWeightValue / 2.20462;
      }

      let goalDateTimestamp = undefined;
      if (goalDate) {
        goalDateTimestamp = new Date(goalDate).getTime();
      }

      await updateProfile.mutateAsync({
        heightCm: heightCmValue && heightCmValue > 0 ? heightCmValue : undefined,
        weightKg: weightKgValue && weightKgValue > 0 ? weightKgValue : undefined,
        ageYears: formData.ageYears && parseInt(formData.ageYears) > 0 ? parseInt(formData.ageYears) : undefined,
        fitnessGoal: (formData.fitnessGoal as "lose_fat" | "build_muscle" | "maintain") || undefined,
        goalWeightKg: goalWeightValue && goalWeightValue > 0 ? goalWeightValue : undefined,
        goalDate: goalDateTimestamp,
        dailyCalorieTarget: dailyCalorieTarget && parseInt(dailyCalorieTarget) > 0 ? parseInt(dailyCalorieTarget) : undefined,
        dailyProteinTarget: dailyProteinTarget && parseInt(dailyProteinTarget) > 0 ? parseInt(dailyProteinTarget) : undefined,
        dailyCarbsTarget: dailyCarbsTarget && parseInt(dailyCarbsTarget) > 0 ? parseInt(dailyCarbsTarget) : undefined,
        dailyFatTarget: dailyFatTarget && parseInt(dailyFatTarget) > 0 ? parseInt(dailyFatTarget) : undefined,
      });

      toast.success("Profile updated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const getBmiColor = () => {
    if (!bmiCategory) return "text-gray-400";
    if (bmiCategory === "Underweight") return "text-blue-400";
    if (bmiCategory === "Normal weight") return "text-green-400";
    if (bmiCategory === "Overweight") return "text-yellow-400";
    return "text-red-400";
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white">User Profile</h1>
        <p className="text-slate-400">Manage your biometric data and fitness goals</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Biometric Data Card */}
        <Card className="border border-white/10 bg-slate-950">
          <CardHeader>
            <CardTitle className="text-white">Biometric Data</CardTitle>
            <CardDescription>Enter your height, weight, and age for BMI calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Height */}
            <div>
              <Label htmlFor="heightCm" className="text-slate-300">
                Height
              </Label>
              <div className="flex gap-2 mt-2">
              <Input
                id="heightCm"
                name="heightCm"
                type="number"
                placeholder={heightUnit === "in" ? "5" : "170"}
                  value={formData.heightCm}
                  onChange={handleInputChange}
                  className="bg-slate-900 border-white/10 text-white placeholder-slate-500"
                />
                <Select value={heightUnit} onValueChange={(value) => setHeightUnit(value as "cm" | "in")}>
                  <SelectTrigger className="w-20 bg-slate-900 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center px-3 bg-slate-900 border border-white/10 rounded text-white">
                  {displayHeight()} {heightUnit}
                </div>
              </div>
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weightKg" className="text-slate-300">
                Weight
              </Label>
              <div className="flex gap-2 mt-2">
              <Input
                id="weightKg"
                name="weightKg"
                type="number"
                placeholder={weightUnit === "lbs" ? "154" : "70"}
                  value={formData.weightKg}
                  onChange={handleInputChange}
                  className="bg-slate-900 border-white/10 text-white placeholder-slate-500"
                />
                <Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as "kg" | "lbs")}>
                  <SelectTrigger className="w-20 bg-slate-900 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center px-3 bg-slate-900 border border-white/10 rounded text-white">
                  {displayWeight()} {weightUnit}
                </div>
              </div>
            </div>

            {/* Age */}
            <div>
              <Label htmlFor="ageYears" className="text-slate-300">
                Age (years)
              </Label>
              <Input
                id="ageYears"
                name="ageYears"
                type="number"
                placeholder="30"
                value={formData.ageYears}
                onChange={handleInputChange}
                className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
              />
            </div>

            {/* BMI Display */}
            {bmi !== null && (
              <div className="mt-6 p-4 rounded-lg bg-slate-900 border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm">Your BMI</p>
                    <p className={`text-3xl font-bold ${getBmiColor()}`}>{bmi}</p>
                    <p className={`text-sm mt-1 ${getBmiColor()}`}>{bmiCategory}</p>
                  </div>
                  <div className="text-right text-slate-400 text-xs">
                    <p>BMI Categories:</p>
                    <p className="text-blue-400">Underweight: &lt;18.5</p>
                    <p className="text-green-400">Normal: 18.5-24.9</p>
                    <p className="text-yellow-400">Overweight: 25-29.9</p>
                    <p className="text-red-400">Obese: ≥30</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Level Card */}
        <Card className="border border-white/10 bg-slate-950">
          <CardHeader>
            <CardTitle className="text-white">Activity Level</CardTitle>
            <CardDescription>Select your typical weekly activity level</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={activityLevel} onValueChange={(value) => setActivityLevel(value as ActivityLevel)}>
              <SelectTrigger className="bg-slate-900 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="sedentary">
                  <span className="text-white">Sedentary (little or no exercise)</span>
                </SelectItem>
                <SelectItem value="lightly_active">
                  <span className="text-white">Lightly Active (1-3 days/week)</span>
                </SelectItem>
                <SelectItem value="moderately_active">
                  <span className="text-white">Moderately Active (3-5 days/week)</span>
                </SelectItem>
                <SelectItem value="very_active">
                  <span className="text-white">Very Active (6-7 days/week)</span>
                </SelectItem>
                <SelectItem value="extremely_active">
                  <span className="text-white">Extremely Active (physical job)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Maintenance Calories Card */}
        {maintenanceCalories && (
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Maintenance Calories</CardTitle>
              <CardDescription>Your daily calorie needs at current activity level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Daily Calories</p>
                  <p className="text-2xl font-bold text-cyan-400">{maintenanceCalories.dailyCalories}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Protein</p>
                  <p className="text-2xl font-bold text-blue-400">{maintenanceCalories.dailyProtein}g</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Carbs</p>
                  <p className="text-2xl font-bold text-green-400">{maintenanceCalories.dailyCarbs}g</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Fat</p>
                  <p className="text-2xl font-bold text-yellow-400">{maintenanceCalories.dailyFat}g</p>
                </div>
              </div>

              {/* Customize Maintenance Calories */}
              <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-white/10">
                <Label htmlFor="customMaintenance" className="text-slate-300">
                  Customize Maintenance Calories (optional)
                </Label>
                <Input
                  id="customMaintenance"
                  type="number"
                  value={customMaintenanceCalories}
                  onChange={(e) => setCustomMaintenanceCalories(e.target.value)}
                  placeholder="Enter custom maintenance calories"
                  className="mt-2 bg-slate-800 border-white/10 text-white placeholder-slate-500"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fitness Goal Card */}
        <Card className="border border-white/10 bg-slate-950">
          <CardHeader>
            <CardTitle className="text-white">Fitness Goal</CardTitle>
            <CardDescription>Select your primary fitness objective</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={formData.fitnessGoal} onValueChange={handleGoalChange}>
              <SelectTrigger className="bg-slate-900 border-white/10 text-white">
                <SelectValue placeholder="Select your fitness goal" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="lose_fat">
                  <span className="text-white">Lose Fat</span>
                </SelectItem>
                <SelectItem value="build_muscle">
                  <span className="text-white">Build Muscle</span>
                </SelectItem>
                <SelectItem value="maintain">
                  <span className="text-white">Maintain</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Goal-Based Targets Card - Only show if goal is selected */}
        {formData.fitnessGoal && formData.fitnessGoal !== "maintain" && goalTargets && (
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">
                Daily Targets for {formData.fitnessGoal === "lose_fat" ? "Lose Fat" : "Build Muscle"}
              </CardTitle>
              <CardDescription>Calculated targets to reach your goal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Goal Weight and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goalWeight" className="text-slate-300">
                    Goal Weight ({weightUnit})
                  </Label>
                  <Input
                    id="goalWeight"
                    type="number"
                    value={goalWeightKg}
                    onChange={(e) => setGoalWeightKg(e.target.value)}
                    placeholder="Enter goal weight"
                    className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <Label htmlFor="goalDate" className="text-slate-300">
                    Target Date
                  </Label>
                  <Input
                    id="goalDate"
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Calculated Targets Display */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Daily Calories</p>
                  <p className="text-2xl font-bold text-cyan-400">{goalTargets.dailyCalories}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Protein</p>
                  <p className="text-2xl font-bold text-blue-400">{goalTargets.dailyProtein}g</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Carbs</p>
                  <p className="text-2xl font-bold text-green-400">{goalTargets.dailyCarbs}g</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                  <p className="text-slate-400 text-sm">Fat</p>
                  <p className="text-2xl font-bold text-yellow-400">{goalTargets.dailyFat}g</p>
                </div>
              </div>

              {/* Customize Daily Targets */}
              <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-white/10">
                <p className="text-slate-300 font-semibold mb-4">Customize your daily targets (optional):</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dailyCalories" className="text-slate-300">
                      Calories
                    </Label>
                    <Input
                      id="dailyCalories"
                      type="number"
                      value={dailyCalorieTarget}
                      onChange={(e) => setDailyCalorieTarget(e.target.value)}
                      className="mt-1 bg-slate-800 border-white/10 text-white placeholder-slate-500 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyProtein" className="text-slate-300">
                      Protein (g)
                    </Label>
                    <Input
                      id="dailyProtein"
                      type="number"
                      value={dailyProteinTarget}
                      onChange={(e) => setDailyProteinTarget(e.target.value)}
                      className="mt-1 bg-slate-800 border-white/10 text-white placeholder-slate-500 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyCarbs" className="text-slate-300">
                      Carbs (g)
                    </Label>
                    <Input
                      id="dailyCarbs"
                      type="number"
                      value={dailyCarbsTarget}
                      onChange={(e) => setDailyCarbsTarget(e.target.value)}
                      className="mt-1 bg-slate-800 border-white/10 text-white placeholder-slate-500 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyFat" className="text-slate-300">
                      Fat (g)
                    </Label>
                    <Input
                      id="dailyFat"
                      type="number"
                      value={dailyFatTarget}
                      onChange={(e) => setDailyFatTarget(e.target.value)}
                      className="mt-1 bg-slate-800 border-white/10 text-white placeholder-slate-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Photos Section */}
        <ProgressPhotos />



        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
