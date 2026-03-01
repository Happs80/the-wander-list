import { Backpack } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Item, User as UserType } from "@shared/schema";
import { usePreferences } from "@/hooks/use-preferences";

interface PackWeightSummaryProps {
  items: Item[];
  members: UserType[];
}

export function PackWeightSummary({ items, members }: PackWeightSummaryProps) {
  const { formatWeight } = usePreferences();

  const memberWeights = members.map(member => {
    // Exclude worn items from pack weight calculation
    const personalWeight = items
      .filter(item => item.userId === member.id && !item.isShared && !item.isWorn)
      .reduce((sum, item) => sum + (item.weightGrams * item.quantity), 0);
    
    const assignedWeight = items
      .filter(item => item.isShared && item.carriedByUserId === member.id && !item.isWorn)
      .reduce((sum, item) => sum + (item.weightGrams * item.quantity), 0);
    
    return {
      member,
      personalWeight,
      assignedWeight,
      totalWeight: personalWeight + assignedWeight
    };
  });

  // Exclude worn items from unassigned weight
  const unassignedWeight = items
    .filter(item => item.isShared && !item.carriedByUserId && !item.isWorn)
    .reduce((sum, item) => sum + (item.weightGrams * item.quantity), 0);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white/50 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-2 w-full sm:w-auto">
      <div className="flex items-center gap-2 sm:hidden">
        <Backpack className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">Pack Weights</span>
      </div>
      <Backpack className="w-4 h-4 text-primary shrink-0 hidden sm:block" />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
        {memberWeights.map(({ member, personalWeight, assignedWeight, totalWeight }) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center justify-between sm:justify-start gap-1.5 bg-primary/10 rounded-md px-2 py-1.5 sm:py-1 cursor-default w-full sm:w-auto"
                data-testid={`pack-weight-${member.id}`}
              >
                <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[80px]">
                  {member.nickname || member.firstName || 'Member'}'s Pack
                </span>
                <span className="text-xs font-bold text-primary font-mono">
                  {formatWeight(totalWeight)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <div>Personal: {formatWeight(personalWeight)}</div>
                <div>Group items: {formatWeight(assignedWeight)}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {unassignedWeight > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center justify-between sm:justify-start gap-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-md px-2 py-1.5 sm:py-1 cursor-default w-full sm:w-auto"
                data-testid="pack-weight-unassigned"
              >
                <span className="text-xs text-amber-700 dark:text-amber-400">Unassigned</span>
                <span className="text-xs font-bold text-amber-600 font-mono">
                  {formatWeight(unassignedWeight)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">Group items not yet assigned to a pack</div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
