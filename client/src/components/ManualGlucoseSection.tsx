import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Droplets } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function glucoseColor(mgdl: number) {
  if (mgdl < 70) return "text-red-400";
  if (mgdl <= 180) return "text-green-400";
  return "text-orange-400";
}

export function ManualGlucoseSection() {
  const utils = trpc.useUtils();
  const dayStart = todayStart();

  const [isAdding, setIsAdding] = useState(false);
  const [mgdl, setMgdl] = useState("");
  const [readingTime, setReadingTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:MM
  });
  const [notes, setNotes] = useState("");

  const { data: entries, isLoading } = trpc.manualGlucose.getTodayEntries.useQuery({ dayStart });

  const addMutation = trpc.manualGlucose.addEntry.useMutation({
    onSuccess: () => {
      setMgdl("");
      setNotes("");
      setIsAdding(false);
      toast.success("Glucose reading saved");
      utils.manualGlucose.getTodayEntries.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save reading");
    },
  });

  const deleteMutation = trpc.manualGlucose.deleteEntry.useMutation({
    onSuccess: () => {
      toast.success("Reading deleted");
      utils.manualGlucose.getTodayEntries.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete reading");
    },
  });

  const handleAdd = () => {
    const value = parseFloat(mgdl);
    if (!mgdl || isNaN(value) || value <= 0 || value > 1000) {
      toast.error("Enter a valid glucose value (1–1000 mg/dL)");
      return;
    }

    // Combine today's date with the chosen time
    const [hours, minutes] = readingTime.split(":").map(Number);
    const ts = new Date();
    ts.setHours(hours, minutes, 0, 0);

    addMutation.mutate({
      mgdl: value,
      readingAt: ts.getTime(),
      notes: notes || undefined,
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-red-400" />
          Manual Glucose Entry
        </CardTitle>
        <CardDescription>Log blood glucose readings from a meter or finger-stick</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {isAdding ? (
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Glucose (mg/dL)</label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="1000"
                  placeholder="e.g., 120"
                  value={mgdl}
                  onChange={(e) => setMgdl(e.target.value)}
                  className="bg-background"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Time</label>
                <Input
                  type="time"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Notes (optional)</label>
              <Textarea
                placeholder="e.g., fasting, after meal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={addMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {addMutation.isPending ? "Saving..." : "Save Reading"}
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setMgdl("");
                  setNotes("");
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Plus size={16} className="mr-2" />
            Add Glucose Reading
          </Button>
        )}

        {/* Today's entries */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Today's Readings</h3>
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold ${glucoseColor(entry.mgdl)}`}>
                        {entry.mgdl} <span className="text-sm font-normal text-muted-foreground">mg/dL</span>
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.readingAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-muted-foreground italic mt-1">{entry.notes}</div>
                    )}
                  </div>
                  <Button
                    onClick={() => deleteMutation.mutate({ entryId: entry.id })}
                    disabled={deleteMutation.isPending}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-6 rounded-lg bg-muted/30 border border-border">
              No readings logged today.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
