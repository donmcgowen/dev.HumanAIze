import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsightsPanel } from "@/components/InsightsPanel";
import { toast } from "sonner";
import { Loader2, Trash2, Plus } from "lucide-react";

const EXERCISE_TYPES = [
  { name: "Cardio", examples: "Running, Cycling, Swimming, HIIT" },
  { name: "Strength", examples: "Weight lifting, Resistance training" },
  { name: "Flexibility", examples: "Yoga, Stretching, Pilates" },
  { name: "Sports", examples: "Basketball, Tennis, Soccer" },
  { name: "Other", examples: "Walking, Hiking, etc." },
];

export function Workouts() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [formData, setFormData] = useState({
    exerciseName: "",
    exerciseType: "Cardio",
    durationMinutes: "",
    caloriesBurned: "",
    intensity: "moderate",
    notes: "",
  });

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.exerciseName || !formData.durationMinutes) {
      toast.error("Please fill in exercise name and duration");
      return;
    }

    toast.success("Workout logged successfully!");
    setFormData({
      exerciseName: "",
      exerciseType: "Cardio",
      durationMinutes: "",
      caloriesBurned: "",
      intensity: "moderate",
      notes: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Workout Tracking</h1>
          <p className="text-slate-400">Log your exercises and track your fitness progress</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workout Entry Card */}
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Log Workout</CardTitle>
              <CardDescription>Record your exercise session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exerciseName" className="text-slate-300">
                    Exercise Name
                  </Label>
                  <Input
                    id="exerciseName"
                    name="exerciseName"
                    placeholder="e.g., Morning Run"
                    value={formData.exerciseName}
                    onChange={handleInputChange}
                    className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="exerciseType" className="text-slate-300">
                    Exercise Type
                  </Label>
                  <Select value={formData.exerciseType} onValueChange={(value) => handleSelectChange("exerciseType", value)}>
                    <SelectTrigger className="mt-2 bg-slate-900 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {EXERCISE_TYPES.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          <span className="text-white">{type.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="durationMinutes" className="text-slate-300">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="durationMinutes"
                    name="durationMinutes"
                    type="number"
                    placeholder="30"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="caloriesBurned" className="text-slate-300">
                    Calories Burned (optional)
                  </Label>
                  <Input
                    id="caloriesBurned"
                    name="caloriesBurned"
                    type="number"
                    placeholder="250"
                    value={formData.caloriesBurned}
                    onChange={handleInputChange}
                    className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <Label htmlFor="intensity" className="text-slate-300">
                    Intensity
                  </Label>
                  <Select value={formData.intensity} onValueChange={(value) => handleSelectChange("intensity", value)}>
                    <SelectTrigger className="mt-2 bg-slate-900 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="light">
                        <span className="text-white">Light</span>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <span className="text-white">Moderate</span>
                      </SelectItem>
                      <SelectItem value="intense">
                        <span className="text-white">Intense</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-slate-300">
                  Notes (optional)
                </Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="How did you feel? Any observations?"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-2 bg-slate-900 border-white/10 text-white placeholder-slate-500"
                />
              </div>

              <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Log Workout
              </Button>
            </CardContent>
          </Card>

          {/* Insights Section */}
          <InsightsPanel 
            insights={[
              {
                type: "tip" as const,
                title: "Start Your Fitness Journey",
                description: "Log your first workout to track your exercise consistency and progress toward your goals.",
                action: "Begin with a workout type that matches your current fitness level."
              },
              {
                type: "tip" as const,
                title: "Recovery Matters",
                description: "Combine your workout data with sleep tracking for optimal recovery and performance.",
                action: "Connect an Oura Ring or similar device to monitor sleep quality."
              }
            ]}
          />

          {/* Exercise Type Guide */}
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Exercise Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXERCISE_TYPES.map((type) => (
                  <div key={type.name} className="p-3 rounded-lg bg-slate-900 border border-white/10">
                    <p className="font-semibold text-cyan-400">{type.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{type.examples}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for Workout History */}
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Recent Workouts</CardTitle>
              <CardDescription>Your workout history will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-center py-8">No workouts logged yet. Start by logging your first workout above!</p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
