import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DayNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNumber: number;
  dayLocation: string;
  notes: string | null | undefined;
  onSave: (notes: string) => Promise<void>;
  isSaving?: boolean;
}

export function DayNotesModal({ 
  open, 
  onOpenChange, 
  dayNumber,
  dayLocation,
  notes, 
  onSave, 
  isSaving 
}: DayNotesModalProps) {
  const [content, setContent] = useState(notes || "");
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setContent(notes || "");
      setHasChanges(false);
    }
  }, [open, notes]);

  const handleChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== (notes || ""));
  };

  const handleSave = async () => {
    try {
      await onSave(content);
      setHasChanges(false);
      toast({
        title: "Notes saved",
        description: `Day ${dayNumber} notes have been updated`
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Day {dayNumber} Notes
            </DialogTitle>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              data-testid="button-save-day-notes"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground -mt-1">{dayLocation}</p>
        
        <div className="flex-1 min-h-0 pt-2">
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Add notes for this day... campsite info, water sources, landmarks, resupply stops, etc."
            className="min-h-[200px] resize-none"
            data-testid="textarea-day-notes"
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
