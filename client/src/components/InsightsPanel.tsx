import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface Insight {
  type: "tip" | "warning" | "success" | "trend";
  title: string;
  description: string;
  action?: string;
}

interface InsightsPanelProps {
  title?: string;
  insights: Insight[];
  isLoading?: boolean;
}

export function InsightsPanel({ title = "AI Insights & Recommendations", insights, isLoading }: InsightsPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "tip":
        return <Lightbulb className="w-5 h-5 text-yellow-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "trend":
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      default:
        return <Lightbulb className="w-5 h-5 text-slate-400" />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case "tip":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "warning":
        return "bg-red-500/10 border-red-500/30";
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "trend":
        return "bg-cyan-500/10 border-cyan-500/30";
      default:
        return "bg-slate-900 border-white/10";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-white/10 bg-slate-950">
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-slate-900 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-slate-950">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription>Personalized analysis based on your data</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="p-6 text-center">
            <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Connect more data sources to get personalized insights</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getInsightBgColor(insight.type)}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">{insight.title}</p>
                    <p className="text-sm text-slate-300 mb-2">{insight.description}</p>
                    {insight.action && (
                      <p className="text-xs text-slate-400 italic">💡 {insight.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
