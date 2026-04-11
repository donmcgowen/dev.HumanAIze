import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Camera, Mic, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FoodRecognitionResult {
  foods: Array<{
    name: string;
    portionSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

interface AIFoodScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodsRecognized: (foods: FoodRecognitionResult["foods"]) => void;
}

export function AIFoodScanner({ isOpen, onClose, onFoodsRecognized }: AIFoodScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<"photo" | "voice" | "photo+voice">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera
  useEffect(() => {
    if (!isOpen || cameraActive) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (error) {
        console.error("Camera error:", error);
        toast.error("Camera not available. Please check permissions.");
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
      }
    };
  }, [isOpen, cameraActive]);

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const imageData = canvasRef.current.toDataURL("image/jpeg");
    setPhotoData(imageData);
    toast.success("Photo captured!");
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        setAudioChunks([audioBlob]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (error) {
      console.error("Microphone error:", error);
      toast.error("Microphone not available. Please check permissions.");
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped!");
    }
  };

  // Upload file to S3 and get URL
  const uploadToStorage = async (blob: Blob, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, fileName);

    const response = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.url;
  };

  // Analyze food using Gemini AI
  const analyzeFoods = async () => {
    if (mode === "photo" && !photoData) {
      toast.error("Please capture a photo first");
      return;
    }
    if ((mode === "voice" || mode === "photo+voice") && audioChunks.length === 0) {
      toast.error("Please record voice description first");
      return;
    }

    setIsAnalyzing(true);
    try {
      let photoUrl: string | undefined;
      let audioUrl: string | undefined;

      // Upload photo if available
      if (photoData) {
        const photoBlob = await fetch(photoData).then((res) => res.blob());
        photoUrl = await uploadToStorage(photoBlob, `food-${Date.now()}.jpg`);
      }

      // Upload audio if available
      if (audioChunks.length > 0) {
        audioUrl = await uploadToStorage(audioChunks[0], `voice-${Date.now()}.webm`);
      }

      // Call backend AI recognition
      const result = await trpc.food.recognizeWithAI.useMutation().mutateAsync({
        mode,
        photoUrl,
        audioUrl,
      });

      if (result.foods && result.foods.length > 0) {
        onFoodsRecognized(result.foods);
        toast.success(`Recognized ${result.foods.length} food item(s)!`);
        onClose();
      } else {
        toast.error("No foods detected. Try again with a clearer image or description.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze food. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset scanner
  const reset = () => {
    setPhotoData(null);
    setAudioChunks([]);
    setIsRecording(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>AI Food Scanner</CardTitle>
            <CardDescription>Take a photo or describe your food with voice</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={mode === "photo" ? "default" : "outline"}
              onClick={() => {
                setMode("photo");
                reset();
              }}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              Photo Only
            </Button>
            <Button
              variant={mode === "voice" ? "default" : "outline"}
              onClick={() => {
                setMode("voice");
                reset();
              }}
              className="flex-1"
            >
              <Mic className="mr-2 h-4 w-4" />
              Voice Only
            </Button>
            <Button
              variant={mode === "photo+voice" ? "default" : "outline"}
              onClick={() => {
                setMode("photo+voice");
                reset();
              }}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              <Mic className="mr-2 h-4 w-4" />
              Both
            </Button>
          </div>

          {/* Photo Mode */}
          {(mode === "photo" || mode === "photo+voice") && (
            <div className="space-y-2">
              <h3 className="font-semibold">Camera</h3>
              {!photoData ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                  <Button onClick={capturePhoto} className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Photo
                  </Button>
                </>
              ) : (
                <>
                  <img src={photoData} alt="Captured food" className="w-full rounded-lg" />
                  <Button
                    variant="outline"
                    onClick={() => setPhotoData(null)}
                    className="w-full"
                  >
                    Retake Photo
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Voice Mode */}
          {(mode === "voice" || mode === "photo+voice") && (
            <div className="space-y-2">
              <h3 className="font-semibold">Voice Description</h3>
              {audioChunks.length === 0 ? (
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                    ✓ Voice recording captured
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAudioChunks([]);
                      setIsRecording(false);
                    }}
                    className="w-full"
                  >
                    Re-record
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeFoods}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              "Analyze & Get Macros"
            )}
          </Button>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}
