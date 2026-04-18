import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsightsPanel } from "@/components/InsightsPanel";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Mic, MicOff, Sparkles } from "lucide-react";

type WorkoutIntensity = "light" | "moderate" | "intense";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const EXERCISE_TYPES = [
  { name: "Cardio", examples: "Running, Cycling, Swimming, HIIT" },
  { name: "Strength", examples: "Weight lifting, Resistance training" },
  { name: "Flexibility", examples: "Yoga, Stretching, Pilates" },
  { name: "Sports", examples: "Basketball, Tennis, Soccer" },
  { name: "Other", examples: "Walking, Hiking, etc." },
];

export function Workouts() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    exerciseName: "",
    exerciseType: "Cardio",
    durationMinutes: "",
    caloriesBurned: "",
    intensity: "moderate" as WorkoutIntensity,
    notes: "",
  });
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const speechSupported = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  const { data: workoutEntries = [] } = trpc.workouts.getEntries.useQuery({ days: 60 }, { enabled: !!user });
  const { data: recommendations = [] } = trpc.workouts.getDailyRecommendations.useQuery(undefined, { enabled: !!user });

  const addWorkoutMutation = trpc.workouts.addEntry.useMutation({
    onSuccess: () => {
      toast.success("Workout logged successfully!");
      setFormData({
        exerciseName: "",
        exerciseType: "Cardio",
        durationMinutes: "",
        caloriesBurned: "",
        intensity: "moderate",
        notes: "",
      });
      setVoiceTranscript("");
      utils.workouts.getEntries.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save workout");
    },
  });

  const deleteWorkoutMutation = trpc.workouts.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success("Workout deleted");
      utils.workouts.getEntries.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete workout");
    },
  });

  const estimateFromTextMutation = trpc.workouts.estimateFromText.useMutation({
    onSuccess: (result) => {
      setFormData((prev) => ({
        ...prev,
        exerciseName: result.exerciseName,
        exerciseType: result.exerciseType,
        durationMinutes: String(result.durationMinutes),
        caloriesBurned: String(result.caloriesBurned),
        intensity: result.intensity,
      }));

      toast.success(result.usedFallback ? "Workout parsed with fallback estimate" : "AI estimated workout calories");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to estimate calories");
    },
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

  const startVoiceCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
      setVoiceTranscript(transcript);
      if (transcript.length > 0) {
        estimateFromTextMutation.mutate({ transcript });
      }
    };

    recognition.onerror = (event) => {
      toast.error(`Voice capture failed: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.exerciseName || !formData.durationMinutes) {
      toast.error("Please fill in exercise name and duration");
      return;
    }

    addWorkoutMutation.mutate({
      exerciseName: formData.exerciseName,
      exerciseType: formData.exerciseType,
      durationMinutes: Math.max(1, Number(formData.durationMinutes)),
      caloriesBurned: formData.caloriesBurned ? Math.max(0, Number(formData.caloriesBurned)) : 0,
      intensity: formData.intensity,
      notes: formData.notes || undefined,
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
              <CardDescription>
                Record your exercise session, or use voice input like "I did 35 minutes of cycling"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={startVoiceCapture}
                    disabled={!speechSupported || isRecording || estimateFromTextMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Use Voice Input
                      </>
                    )}
                  </Button>
                  {!speechSupported && (
                    <span className="text-xs text-slate-300">Browser does not support speech recognition.</span>
                  )}
                </div>
                {voiceTranscript && (
                  <p className="text-sm text-slate-200">
                    Heard: <span className="text-cyan-300">{voiceTranscript}</span>
                  </p>
                )}
                <p className="text-xs text-slate-300">
                  Hint: try saying "45 minutes intense cycling" or "30 minutes light yoga".
                </p>
              </div>

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
                {addWorkoutMutation.isPending ? "Saving..." : "Log Workout"}
              </Button>
            </CardContent>
          </Card>

          {/* AI Workout Recommendations */}
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                AI Workout Recommendations
              </CardTitle>
              <CardDescription>Suggested for today based on your profile goals</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-slate-400">No recommendations yet. Update your profile goals to get better suggestions.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((item, idx) => (
                    <div key={`${item.title}-${idx}`} className="p-3 rounded-lg bg-slate-900 border border-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-cyan-300">{item.title}</p>
                        <p className="text-xs text-slate-400">{item.durationMinutes} min • {item.intensity}</p>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <InsightsPanel 
            insights={[
              {
                type: "tip" as const,
                title: "Voice + AI Workflow",
                description: "Use voice input to quickly fill workout details and calories burned estimates.",
                action: "Say phrases like '45 minutes intense HIIT' and review before saving."
              },
              {
                type: "tip" as const,
                title: "Consistency Wins",
                description: "Short daily sessions are often better than long inconsistent sessions.",
                action: "Aim for at least 20-30 minutes of intentional movement today."
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

          {/* Workout History */}
          <Card className="border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Recent Workouts</CardTitle>
              <CardDescription>Latest saved workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutEntries.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No workouts logged yet. Start by logging your first workout above!</p>
              ) : (
                <div className="space-y-2">
                  {workoutEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 p-3">
                      <div>
                        <p className="font-semibold text-white">{entry.exerciseName}</p>
                        <p className="text-xs text-slate-400">
                          {entry.exerciseType} • {entry.durationMinutes} min • {entry.caloriesBurned} kcal • {entry.intensity}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(entry.recordedAt).toLocaleString()}</p>
                        {entry.notes && <p className="text-xs text-slate-300 mt-1">{entry.notes}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deleteWorkoutMutation.isPending}
                        onClick={() => deleteWorkoutMutation.mutate({ entryId: entry.id })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
