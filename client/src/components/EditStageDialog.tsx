import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Mountain, Bike, MoreHorizontal, Footprints, Waves, Ship, Snowflake, Plane } from "lucide-react";
import { GiCanoe, GiHorseHead } from "react-icons/gi";
import { TbKayak } from "react-icons/tb";
import { useUpdateStage } from "@/hooks/use-itinerary";
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

interface EditStageDialogProps {
  stage: ItineraryStage;
  dayId: number;
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStageDialog({ stage, dayId, groupId, open, onOpenChange }: EditStageDialogProps) {
  const { toast } = useToast();
  const updateStage = useUpdateStage(dayId, groupId);
  
  const [mode, setMode] = useState(stage.mode);
  const [startPoint, setStartPoint] = useState(stage.startPoint || "");
  const [endPoint, setEndPoint] = useState(stage.endPoint || "");
  const [startLatitude, setStartLatitude] = useState(stage.startLatitude?.toString() || "");
  const [startLongitude, setStartLongitude] = useState(stage.startLongitude?.toString() || "");
  const [endLatitude, setEndLatitude] = useState(stage.endLatitude?.toString() || "");
  const [endLongitude, setEndLongitude] = useState(stage.endLongitude?.toString() || "");
  const [description, setDescription] = useState(stage.description || "");
  const [distanceKm, setDistanceKm] = useState(stage.distanceKm?.toString() || "");
  const [elevationGain, setElevationGain] = useState(stage.elevationGain?.toString() || "");
  const [durationMinutes, setDurationMinutes] = useState(stage.durationMinutes?.toString() || "");
  const [departTime, setDepartTime] = useState(stage.departTime || "");
  const [arriveTime, setArriveTime] = useState(stage.arriveTime || "");

  useEffect(() => {
    setMode(stage.mode);
    setStartPoint(stage.startPoint || "");
    setEndPoint(stage.endPoint || "");
    setStartLatitude(stage.startLatitude?.toString() || "");
    setStartLongitude(stage.startLongitude?.toString() || "");
    setEndLatitude(stage.endLatitude?.toString() || "");
    setEndLongitude(stage.endLongitude?.toString() || "");
    setDescription(stage.description || "");
    setDistanceKm(stage.distanceKm?.toString() || "");
    setElevationGain(stage.elevationGain?.toString() || "");
    setDurationMinutes(stage.durationMinutes?.toString() || "");
    setDepartTime(stage.departTime || "");
    setArriveTime(stage.arriveTime || "");
  }, [stage]);

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
      const distanceVal = parseFloat(distanceKm);
      const elevationVal = parseInt(elevationGain);
      const durationVal = parseInt(durationMinutes);
      const startLat = parseFloat(startLatitude);
      const startLng = parseFloat(startLongitude);
      const endLat = parseFloat(endLatitude);
      const endLng = parseFloat(endLongitude);
      
      await updateStage.mutateAsync({
        id: stage.id,
        data: {
          mode,
          startPoint: startPoint || undefined,
          endPoint: endPoint || undefined,
          startLatitude: !isNaN(startLat) ? startLat : undefined,
          startLongitude: !isNaN(startLng) ? startLng : undefined,
          endLatitude: !isNaN(endLat) ? endLat : undefined,
          endLongitude: !isNaN(endLng) ? endLng : undefined,
          description: description || undefined,
          distanceKm: !isNaN(distanceVal) ? distanceVal : undefined,
          elevationGain: !isNaN(elevationVal) ? elevationVal : undefined,
          durationMinutes: !isNaN(durationVal) ? durationVal : undefined,
          departTime: departTime || undefined,
          arriveTime: arriveTime || undefined,
        }
      });
      
      toast({ title: "Stage updated", description: "Stage has been updated." });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update stage.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Activity</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger data-testid="select-edit-stage-mode">
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
                data-testid="input-edit-stage-start"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  value={startLatitude}
                  onChange={(e) => setStartLatitude(e.target.value)}
                  placeholder="Lat"
                  className="text-xs"
                  data-testid="input-edit-stage-start-lat"
                />
                <Input
                  type="number"
                  step="any"
                  value={startLongitude}
                  onChange={(e) => setStartLongitude(e.target.value)}
                  placeholder="Lng"
                  className="text-xs"
                  data-testid="input-edit-stage-start-lng"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Point</Label>
              <Input
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="e.g., Campsite"
                data-testid="input-edit-stage-end"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="any"
                  value={endLatitude}
                  onChange={(e) => setEndLatitude(e.target.value)}
                  placeholder="Lat"
                  className="text-xs"
                  data-testid="input-edit-stage-end-lat"
                />
                <Input
                  type="number"
                  step="any"
                  value={endLongitude}
                  onChange={(e) => setEndLongitude(e.target.value)}
                  placeholder="Lng"
                  className="text-xs"
                  data-testid="input-edit-stage-end-lng"
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
                data-testid="input-edit-stage-depart"
              />
            </div>
            <div className="space-y-2">
              <Label>Arrive Time</Label>
              <Input
                type="time"
                value={arriveTime}
                onChange={(e) => setArriveTime(e.target.value)}
                data-testid="input-edit-stage-arrive"
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
                data-testid="input-edit-stage-distance"
              />
            </div>
            <div className="space-y-2">
              <Label>Elevation (m)</Label>
              <Input
                type="number"
                value={elevationGain}
                onChange={(e) => setElevationGain(e.target.value)}
                placeholder="0"
                data-testid="input-edit-stage-elevation"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="0"
                data-testid="input-edit-stage-duration"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
              data-testid="input-edit-stage-description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStage.isPending} data-testid="button-save-stage">
              {updateStage.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
