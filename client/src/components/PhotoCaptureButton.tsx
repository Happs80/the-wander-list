import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyzedItem {
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  estimatedWeightGrams: number;
  estimatedPrice: number;
  confidence: "low" | "medium" | "high";
}

interface PhotoCaptureButtonProps {
  category: "gear" | "clothing" | "food";
  onItemAnalyzed: (item: AnalyzedItem) => void;
  disabled?: boolean;
}

export function PhotoCaptureButton({ category, onItemAnalyzed, disabled }: PhotoCaptureButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCapture = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[PhotoCapture] Button clicked, triggering file input");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("[PhotoCapture] File selected:", file?.name, file?.size);
    if (!file) return;

    setIsAnalyzing(true);

    try {
      console.log("[PhotoCapture] Resizing and converting to base64...");
      const base64 = await resizeAndConvertToBase64(file);
      console.log("[PhotoCapture] Base64 length:", base64.length);
      
      console.log("[PhotoCapture] Sending request to /api/analyze-gear-image");
      const response = await fetch("/api/analyze-gear-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image: base64, category }),
      });
      console.log("[PhotoCapture] Response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const result: AnalyzedItem = await response.json();
      
      toast({
        title: "Item identified!",
        description: `Detected: ${result.name} (${result.confidence} confidence)`,
      });

      onItemAnalyzed(result);
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis failed",
        description: "Could not identify the item. Please try again or add manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-photo-capture"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCapture}
        disabled={disabled || isAnalyzing}
        title="Take photo to identify item"
        data-testid="button-photo-capture"
        className="gap-1"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
        <span>Smart Add +</span>
      </Button>
    </>
  );
}

function resizeAndConvertToBase64(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', quality);
        console.log(`[PhotoCapture] Resized from ${img.naturalWidth}x${img.naturalHeight} to ${width}x${height}`);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
