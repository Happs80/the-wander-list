import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Car, Mountain, Bike, MoreHorizontal, Footprints, Waves, Ship, Snowflake, Plane } from "lucide-react";
import { GiCanoe, GiHorseHead } from "react-icons/gi";
import { TbKayak } from "react-icons/tb";
import { useCreateStage } from "@/hooks/use-itinerary";
import { useToast } from "@/hooks/use-toast";
import type { ItineraryStage } from "@shared/schema";

const STAGE_MODES = [
  { value: "hike", label: "Hike", icon: Mountain },
  { value: "run", label: "Run", icon: Footprints },
  { value: "cycle", label: "Cycle", icon: Bike },
  { value: "swim", label: "Swim", icon: Waves },
  { value: "kayak", label: "Kayak", icon: TbKayak },
  { value: "canoe", label: "Canoe", icon: GiCanoe },
  { value: "ski", label: "Ski", icon: Snowflake },
  { value: "horseriding", label: "Horse Riding", icon: GiHorseHead },
  { value: "drive", label: "Drive", icon: Car },
  { value: "flight", label: "Flight", icon: Plane },
  { value: "boat", label: "Boat", icon: Ship },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

interface AddStageDialogProps {
  dayId: number;
  groupId: number;
  existingStagesCount: number;
  trigger?: React.ReactNode;
}

export function AddStageDialog({ dayId, groupId, existingStagesCount, trigger }: AddStageDialogProps) {
  const [open, setOpen] = useState(false);
  const createStage = useCreateStage(dayId, groupId);
  const { toast } = useToast();
  
  const [mode, setMode] = useState("hike");
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [startLatitude, setStartLatitude] = useState("");
  const [startLongitude, setStartLongitude] = useState("");
  const [endLatitude, setEndLatitude] = useState("");
  const [endLongitude, setEndLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [departTime, setDepartTime] = useState("");
  const [arriveTime, setArriveTime] = useState("");

  useEffect(() => {
    if (departTime && arriveTime) {
      const [dh, dm] = departTime.split(":").map(Number);
      const [ah, am] = arriveTime.split(":").map(Number);
      let diff = (ah * 60 + am) - (dh * 60 + dm);
      if (diff < 0) diff += 24 * 60;
      setDurationMinutes(String(diff));
    }
  }, [departTime, arriveTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startLat = parseFloat(startLatitude);
      const startLng = parseFloat(startLongitude);
      const endLat = parseFloat(endLatitude);
      const endLng = parseFloat(endLongitude);
      
      await createStage.mutateAsync({
        stageNumber: existingStagesCount + 1,
        mode,
        startPoint: startPoint || undefined,
        endPoint: endPoint || undefined,
        startLatitude: !isNaN(startLat) ? startLat : undefined,
        startLongitude: !isNaN(startLng) ? startLng : undefined,
        endLatitude: !isNaN(endLat) ? endLat : undefined,
        endLongitude: !isNaN(endLng) ? endLng : undefined,
        description: description || undefined,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        elevationGain: elevationGain ? parseInt(elevationGain) : undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        departTime: departTime || undefined,
        arriveTime: arriveTime || undefined,
      });
      
      toast({ title: "Stage added", description: "New stage added to the day." });
      setOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add stage.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setMode("hike");
    setStartPoint("");
    setEndPoint("");
    setStartLatitude("");
    setStartLongitude("");
    setEndLatitude("");
    setEndLongitude("");
    setDescription("");
    setDistanceKm("");
    setElevationGain("");
    setDurationMinutes("");
    setDepartTime("");
    setArriveTime("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 gap-1" data-testid="button-add-stage">
            <Plus className="w-3 h-3" />
            Add Stage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Stage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Activity</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger data-testid="select-stage-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_MODES.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Point</Label>
              <Input
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="e.g., Trailhead"
                data-testid="input-stage-start"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  value={startLatitude}
                  onChange={(e) => setStartLatitude(e.target.value)}
                  placeholder="Lat"
                  className="text-xs"
                  data-testid="input-stage-start-lat"
                />
                <Input
                  type="number"
                  step="any"
                  value={startLongitude}
                  onChange={(e) => setStartLongitude(e.target.value)}
                  placeholder="Lng"
                  className="text-xs"
                  data-testid="input-stage-start-lng"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Point</Label>
              <Input
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="e.g., Campsite"
                data-testid="input-stage-end"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  value={endLatitude}
                  onChange={(e) => setEndLatitude(e.target.value)}
                  placeholder="Lat"
                  className="text-xs"
                  data-testid="input-stage-end-lat"
                />
                <Input
                  type="number"
                  step="any"
                  value={endLongitude}
                  onChange={(e) => setEndLongitude(e.target.value)}
                  placeholder="Lng"
                  className="text-xs"
                  data-testid="input-stage-end-lng"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Depart Time</Label>
              <Input
                type="time"
                value={departTime}
                onChange={(e) => setDepartTime(e.target.value)}
                data-testid="input-stage-depart"
              />
            </div>
            <div className="space-y-2">
              <Label>Arrive Time</Label>
              <Input
                type="time"
                value={arriveTime}
                onChange={(e) => setArriveTime(e.target.value)}
                data-testid="input-stage-arrive"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="0"
                data-testid="input-stage-distance"
              />
            </div>
            <div className="space-y-2">
              <Label>Elevation (m)</Label>
              <Input
                type="number"
                value={elevationGain}
                onChange={(e) => setElevationGain(e.target.value)}
                placeholder="0"
                data-testid="input-stage-elevation"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="0"
                data-testid="input-stage-duration"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
              data-testid="input-stage-description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createStage.isPending} data-testid="button-save-stage">
              {createStage.isPending ? "Adding..." : "Add Stage"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function getModeIcon(mode: string) {
  const modeConfig = STAGE_MODES.find(m => m.value === mode);
  return modeConfig?.icon || MoreHorizontal;
}

export function getModeLabel(mode: string) {
  const modeConfig = STAGE_MODES.find(m => m.value === mode);
  return modeConfig?.label || mode;
}
