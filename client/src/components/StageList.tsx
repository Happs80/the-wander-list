import { useState } from "react";
import { useStages, useDeleteStage } from "@/hooks/use-itinerary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Car, Mountain, Anchor, Bike, Bus, Train, MoreHorizontal, ArrowRight, Pencil, Plane } from "lucide-react";
import { AddStageDialog } from "./AddStageDialog";
import { EditStageDialog } from "./EditStageDialog";
import type { ItineraryStage } from "@shared/schema";
import { usePreferences } from "@/hooks/use-preferences";

const MODE_ICONS: Record<string, any> = {
  hike: Mountain,
  drive: Car,
  flight: Plane,
  boat: Anchor,
  bike: Bike,
  bus: Bus,
  train: Train,
  other: MoreHorizontal,
};

interface StageListProps {
  dayId: number;
  groupId: number;
}

export function StageList({ dayId, groupId }: StageListProps) {
  const { data: stages, isLoading } = useStages(dayId);
  const deleteStage = useDeleteStage(dayId, groupId);
  const [editingStage, setEditingStage] = useState<ItineraryStage | null>(null);
  const { formatDistance, formatElevation } = usePreferences();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading stages...</div>;
  }

  const sortedStages = stages?.sort((a, b) => a.stageNumber - b.stageNumber) || [];

  return (
    <div className="mt-4 space-y-2">
      {sortedStages.length > 0 && (
        <div className="space-y-2">
          {sortedStages.map((stage) => {
            const Icon = MODE_ICONS[stage.mode] || MoreHorizontal;
            
            return (
              <div 
                key={stage.id} 
                className="flex flex-col gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setEditingStage(stage)}
                data-testid={`stage-${stage.id}`}
              >
                {/* Row 1: Mode badge + location + action buttons */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 px-2 flex-shrink-0">
                    <Icon className="w-3 h-3" />
                    <span className="capitalize text-xs">{stage.mode}</span>
                  </Badge>
                  
                  <div className="flex-1 min-w-0 flex items-center gap-1 text-sm overflow-hidden">
                    {(stage.startPoint || stage.endPoint) && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="truncate text-xs sm:text-sm">{stage.startPoint || "—"}</span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{stage.endPoint || "—"}</span>
                      </div>
                    )}
                    
                    {stage.description && !stage.startPoint && !stage.endPoint && (
                      <span className="text-muted-foreground truncate text-xs sm:text-sm">{stage.description}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => { e.stopPropagation(); setEditingStage(stage); }}
                      data-testid={`button-edit-stage-${stage.id}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this stage?")) {
                          deleteStage.mutate(stage.id);
                        }
                      }}
                      data-testid={`button-delete-stage-${stage.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Row 2: Distance/Elevation/Duration badges - visible when any exist */}
                {(stage.distanceKm || stage.elevationGain || stage.durationMinutes) && (
                  <div className="flex items-center gap-1.5 flex-wrap pl-0 sm:pl-2">
                    {stage.distanceKm && (
                      <Badge variant="secondary" className="text-xs">{formatDistance(stage.distanceKm)}</Badge>
                    )}
                    {stage.elevationGain && (
                      <Badge variant="secondary" className="text-xs">{formatElevation(stage.elevationGain)}</Badge>
                    )}
                    {stage.durationMinutes && (
                      <Badge variant="secondary" className="text-xs">
                        {stage.durationMinutes >= 60 
                          ? `${Math.floor(stage.durationMinutes / 60)}h ${stage.durationMinutes % 60}m`
                          : `${stage.durationMinutes}m`
                        }
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <AddStageDialog 
        dayId={dayId} 
        groupId={groupId} 
        existingStagesCount={sortedStages.length} 
      />

      {editingStage && (
        <EditStageDialog
          stage={editingStage}
          dayId={dayId}
          groupId={groupId}
          open={!!editingStage}
          onOpenChange={(open) => !open && setEditingStage(null)}
        />
      )}
    </div>
  );
}
