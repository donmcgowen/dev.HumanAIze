import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightsPanel } from "@/components/InsightsPanel";
import { Loader2, Activity, TrendingUp, Zap } from "lucide-react";
import { useLocation } from "wouter";

export function Monitoring() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const { data: sources, isLoading: sourcesLoading } = trpc.sources.list.useQuery();
  const [, navigate] = useLocation();

  if (isLoading || sourcesLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const connectedSources = sources?.filter((s) => s.status === "connected") || [];
  const readySources = sources?.filter((s) => s.status === "ready") || [];

  // Generate insights based on connected sources
  const generateInsights = () => {
    const insights = [];
    
    if (connectedSources.length === 0) {
      insights.push({
        type: "tip" as const,
        title: "Get Started with Health Monitoring",
        description: "Connect your first health data source to begin tracking glucose, activity, sleep, and more.",
        action: "Start by connecting Dexcom for continuous glucose monitoring or Fitbit for activity tracking."
      });
    } else {
      insights.push({
        type: "success" as const,
        title: "Data Sources Connected",
        description: `You have ${connectedSources.length} active health data source${connectedSources.length !== 1 ? 's' : ''} syncing your metrics.`,
        action: "Keep your sources connected for continuous health insights."
      });
      
      if (connectedSources.length < 3) {
        insights.push({
          type: "tip" as const,
          title: "Enhance Your Health Profile",
          description: "Add more data sources for comprehensive health analysis and better personalized recommendations.",
          action: "Consider connecting sleep (Oura), activity (Fitbit), or nutrition (Custom App) data."
        });
      }
    }
    
    return insights;
  };

  const getSourceIcon = (provider: string) => {
    const icons: Record<string, React.ReactNode> = {
      dexcom: <Zap className="w-5 h-5 text-red-400" />,
      fitbit: <Activity className="w-5 h-5 text-blue-400" />,
      oura: <TrendingUp className="w-5 h-5 text-cyan-400" />,
      apple_health: <Activity className="w-5 h-5 text-gray-400" />,
      google_fit: <Activity className="w-5 h-5 text-green-400" />,
      custom_app: <Zap className="w-5 h-5 text-yellow-400" />,
    };
    return icons[provider] || <Activity className="w-5 h-5" />;
  };

  const getSourceLabel = (provider: string) => {
    const labels: Record<string, string> = {
      dexcom: "Dexcom CGM",
      fitbit: "Fitbit",
      oura: "Oura Ring",
      apple_health: "Apple Health",
      google_fit: "Google Fit",
      custom_app: "Custom App",
    };
    return labels[provider] || provider;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Health Monitoring</h1>
          <p className="text-slate-400">Connect and manage your health data sources</p>
        </div>

        {/* Connected Sources */}
        {connectedSources.length > 0 && (
          <Card className="mb-6 border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Connected Sources</CardTitle>
              <CardDescription>Your active health data connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedSources.map((source) => (
                  <div key={source.id} className="p-4 rounded-lg bg-slate-900 border border-green-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSourceIcon(source.provider)}
                        <div>
                          <p className="font-semibold text-white">{getSourceLabel(source.provider)}</p>
                          <p className="text-xs text-slate-400">Connected</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    </div>
                    {source.lastSyncAt && (
                      <p className="text-xs text-slate-400">
                        Last sync: {new Date(source.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 border-white/10 text-slate-300 hover:text-white">
                        Sync Now
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-white/10 text-red-400 hover:text-red-300">
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Sources */}
        {readySources.length > 0 && (
          <Card className="mb-6 border border-white/10 bg-slate-950">
            <CardHeader>
              <CardTitle className="text-white">Available Sources</CardTitle>
              <CardDescription>Connect additional health data sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {readySources.map((source) => (
                  <div key={source.id} className="p-4 rounded-lg bg-slate-900 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSourceIcon(source.provider)}
                        <div>
                          <p className="font-semibold text-white">{getSourceLabel(source.provider)}</p>
                          <p className="text-xs text-slate-400">Not connected</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate("/sources")}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
                    >
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights Section */}
        <InsightsPanel insights={generateInsights()} />

        {/* Health Metrics Summary */}
        <Card className="border border-white/10 bg-slate-950 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Health Metrics</CardTitle>
            <CardDescription>Your current health data summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">Average Glucose</p>
                <p className="text-2xl font-bold text-red-400">-- mg/dL</p>
                <p className="text-xs text-slate-500 mt-1">Connect Dexcom to view</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">Daily Steps</p>
                <p className="text-2xl font-bold text-blue-400">-- steps</p>
                <p className="text-xs text-slate-500 mt-1">Connect Fitbit or Apple Health</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">Average Sleep</p>
                <p className="text-2xl font-bold text-purple-400">-- hours</p>
                <p className="text-xs text-slate-500 mt-1">Connect Oura or Apple Health</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">Heart Rate</p>
                <p className="text-2xl font-bold text-orange-400">-- bpm</p>
                <p className="text-xs text-slate-500 mt-1">Connect Fitbit or Oura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
