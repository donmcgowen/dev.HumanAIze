import { FoodLogger } from "@/components/FoodLogger";
import { InsightsPanel } from "@/components/InsightsPanel";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export function FoodLogging() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Food Logging</h1>
          <p className="text-slate-400">Track your daily meals and macronutrients</p>
        </div>

        <FoodLogger userId={user.id} />

        <div className="mt-8">
          <InsightsPanel 
            insights={[
              {
                type: "tip" as const,
                title: "Log Your First Meal",
                description: "Start tracking your food intake to get personalized nutrition insights and recommendations.",
                action: "Add a meal above to begin tracking your daily macronutrients."
              },
              {
                type: "tip" as const,
                title: "Macro Balance Matters",
                description: "A balanced diet with proper protein, carbs, and fats supports your fitness goals.",
                action: "Aim for 30-40% protein, 30-40% carbs, and 20-30% fats based on your goal."
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
