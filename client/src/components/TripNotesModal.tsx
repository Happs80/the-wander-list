import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TripNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string | null | undefined;
  onSave: (notes: string) => Promise<void>;
  isSaving?: boolean;
}

export function TripNotesModal({ open, onOpenChange, notes, onSave, isSaving }: TripNotesModalProps) {
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
        description: "Your trip notes have been updated"
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Trip Notes
            </DialogTitle>
            <Button 
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              data-testid="button-save-notes"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 pt-2">
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Add notes about your trip... trail conditions, gear reminders, emergency contacts, permit info, etc."
            className="min-h-[300px] resize-none"
            data-testid="textarea-trip-notes"
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {hasChanges ? "You have unsaved changes" : "All changes saved"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
