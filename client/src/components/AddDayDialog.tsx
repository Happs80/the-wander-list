import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreateItineraryDay } from "@/hooks/use-itinerary";
import { useToast } from "@/hooks/use-toast";

interface AddDayDialogProps {
  groupId: number;
  nextDayNum: number;
  lastDayDate?: string; // YYYY-MM-DD format
}

function getNextDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export function AddDayDialog({ groupId, nextDayNum, lastDayDate }: AddDayDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createDay = useCreateItineraryDay(groupId);
  
  const defaultDate = lastDayDate ? getNextDate(lastDayDate) : "";
  
  const [formData, setFormData] = useState({
    date: defaultDate,
    location: "",
    description: "",
  });

  // Update date when dialog opens or lastDayDate changes
  useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, [open, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDay.mutateAsync({
        dayNumber: nextDayNum,
        date: formData.date || undefined,
        location: formData.location || "Day " + nextDayNum,
        description: formData.description || undefined,
      });
      
      toast({ title: "Day added", description: `Day ${nextDayNum} added to itinerary.` });
      setOpen(false);
      setFormData({ date: defaultDate, location: "", description: "" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add day.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto shadow-none" data-testid="button-add-day">
          <Plus className="w-4 h-4 mr-2" />
          Add Day {nextDayNum}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Day {nextDayNum}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              data-testid="input-day-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location / Title</Label>
            <Input 
              id="location" 
              placeholder="e.g. Basecamp to Summit" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              data-testid="input-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Any notes about this day..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="resize-none"
              rows={3}
              data-testid="input-description"
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={createDay.isPending} data-testid="button-submit-day">
            {createDay.isPending ? "Adding..." : "Add Day"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
