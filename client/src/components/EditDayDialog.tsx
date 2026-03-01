import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateItineraryDay } from "@/hooks/use-itinerary";
import { useToast } from "@/hooks/use-toast";
import type { ItineraryDay } from "@shared/schema";

interface EditDayDialogProps {
  day: ItineraryDay;
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDayDialog({ day, groupId, open, onOpenChange }: EditDayDialogProps) {
  const { toast } = useToast();
  const updateDay = useUpdateItineraryDay(groupId);
  
  const [formData, setFormData] = useState({
    date: day.date || "",
    location: day.location || "",
    description: day.description || "",
  });

  useEffect(() => {
    setFormData({
      date: day.date || "",
      location: day.location || "",
      description: day.description || "",
    });
  }, [day]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, string | undefined> = {};
      if (formData.date !== (day.date || "")) data.date = formData.date || undefined;
      if (formData.location !== (day.location || "")) data.location = formData.location;
      if (formData.description !== (day.description || "")) data.description = formData.description || undefined;
      
      await updateDay.mutateAsync({
        id: day.id,
        data,
      });
      
      toast({ title: "Day updated", description: `Day ${day.dayNumber} has been updated.` });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update day.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Day {day.dayNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input 
              id="edit-date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              data-testid="input-edit-day-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">Location / Title</Label>
            <Input 
              id="edit-location" 
              placeholder="e.g. Basecamp to Summit" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              data-testid="input-edit-day-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Notes (optional)</Label>
            <Textarea 
              id="edit-description" 
              placeholder="Any notes about this day..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="resize-none"
              rows={3}
              data-testid="input-edit-day-description"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={updateDay.isPending} data-testid="button-save-day">
              {updateDay.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
