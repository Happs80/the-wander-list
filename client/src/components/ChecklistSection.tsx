import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Item, ChecklistStatus, User, MasterChecklistItem } from "@shared/schema";
import { Check, X, Users, User as UserIcon, AlertCircle, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChecklistSectionProps {
  groupId: number;
  items: (Item & { user: User | null; carriedByUser: User | null })[];
  viewMode: "all" | "personal" | "group";
}

type ChecklistItemStatus = "pending" | "packed" | "not_needed";

type ChecklistItemType = {
  name: string;
  category: string;
  scope: string;
  gearCategory: string | null;
  isEssential?: boolean;
};

export function ChecklistSection({ groupId, items, viewMode }: ChecklistSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: masterChecklistItems = [] } = useQuery<MasterChecklistItem[]>({
    queryKey: ['/api/master-checklist'],
  });

  const { data: checklistStatuses = [] } = useQuery<ChecklistStatus[]>({
    queryKey: ['/api/groups', groupId, 'checklist'],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/master-checklist/seed', {});
      return res.json() as Promise<{ added: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-checklist'] });
      toast({ title: `Added ${data.added} checklist items` });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemName, status, scope }: { itemName: string; status: string; scope: string }) => {
      return apiRequest('POST', `/api/groups/${groupId}/checklist`, { itemName, status, scope });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'checklist'] });
    },
  });

  const getStatusForItem = (itemName: string, scope: string): ChecklistItemStatus => {
    const status = checklistStatuses.find(s => 
      s.itemName === itemName && 
      (scope === 'group' ? s.userId === null : s.userId === user?.id)
    );
    return (status?.status as ChecklistItemStatus) || 'pending';
  };

  const isItemInPack = (checklistItemName: string): boolean => {
    const lowerName = checklistItemName.toLowerCase();
    return items.some(item => {
      const itemLower = item.name.toLowerCase();
      return itemLower.includes(lowerName) || lowerName.includes(itemLower) ||
        (item.type && item.type.toLowerCase().includes(lowerName));
    });
  };

  const handleStatusChange = (itemName: string, scope: string, newStatus: ChecklistItemStatus) => {
    const currentStatus = getStatusForItem(itemName, scope);
    const statusToSet = currentStatus === newStatus ? 'pending' : newStatus;
    updateStatusMutation.mutate({ itemName, status: statusToSet, scope });
  };

  const filterByViewMode = (item: ChecklistItemType) => {
    if (viewMode === "all") return true;
    if (viewMode === "personal") return item.scope === "individual";
    return item.scope === "group";
  };

  const checklistItems: ChecklistItemType[] = masterChecklistItems
    .filter(item => item.isEssential !== false)
    .map(item => ({
      name: item.name,
      category: 'essential',
      scope: item.scope,
      gearCategory: item.gearCategory,
      isEssential: true,
    }));

  const essentialItems = checklistItems.filter(filterByViewMode);

  const renderChecklistItem = (item: ChecklistItemType) => {
    const status = getStatusForItem(item.name, item.scope);
    const inPack = isItemInPack(item.name);
    
    return (
      <div
        key={`${item.name}-${item.scope}`}
        className={cn(
          "flex items-center justify-between p-3 rounded-md border transition-colors duration-200",
          status === 'packed' && "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
          status === 'not_needed' && "bg-muted/50 border-muted opacity-60",
          status === 'pending' && "bg-background border-border hover:border-primary/50"
        )}
        data-testid={`checklist-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {item.scope === 'group' ? (
              <Users className="w-4 h-4 text-blue-500" />
            ) : (
              <UserIcon className="w-4 h-4 text-orange-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className={cn(
              "text-sm font-medium",
              status === 'not_needed' && "line-through text-muted-foreground"
            )}>
              {item.name}
            </span>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  item.scope === 'group' 
                    ? "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400" 
                    : "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400"
                )}
              >
                {item.scope === 'group' ? 'Group' : 'Personal'}
              </Badge>
              
              {inPack && status !== 'packed' && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                  <Package className="w-3 h-3 mr-1" />
                  In pack
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant={status === 'packed' ? 'default' : 'ghost'}
            className={cn(status === 'packed' && "toggle-elevate toggle-elevated")}
            onClick={() => handleStatusChange(item.name, item.scope, 'packed')}
            disabled={updateStatusMutation.isPending}
            data-testid={`btn-pack-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Check className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            variant={status === 'not_needed' ? 'secondary' : 'ghost'}
            onClick={() => handleStatusChange(item.name, item.scope, 'not_needed')}
            disabled={updateStatusMutation.isPending}
            data-testid={`btn-skip-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const calculateProgress = (itemsList: ChecklistItemType[]) => {
    const total = itemsList.length;
    const completed = itemsList.filter(item => {
      const status = getStatusForItem(item.name, item.scope);
      // Count as completed if: explicitly marked packed/not_needed, OR detected in pack
      return status === 'packed' || status === 'not_needed' || isItemInPack(item.name);
    }).length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const essentialProgress = calculateProgress(essentialItems);

  const getMissingEssentials = () => {
    return essentialItems.filter(item => {
      const status = getStatusForItem(item.name, item.scope);
      return status === 'pending' && !isItemInPack(item.name);
    });
  };

  const missingEssentials = getMissingEssentials();

  if (masterChecklistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4" data-testid="checklist-section-empty">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Checklist Items Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Load default checklist items to get started, or add your own in Trip Settings.
          </p>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            data-testid="button-load-defaults"
          >
            <Download className="w-4 h-4 mr-2" />
            {seedMutation.isPending ? "Loading..." : "Load Default Checklist"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="checklist-section">
      {missingEssentials.length > 0 && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Missing Essentials</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {missingEssentials.length} essential item{missingEssentials.length !== 1 ? 's' : ''} not yet packed or marked as not needed.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{essentialProgress.completed}/{essentialProgress.total} ({essentialProgress.percentage}%)</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${essentialProgress.percentage}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        {essentialItems.filter(i => {
          const status = getStatusForItem(i.name, i.scope);
          return status === 'pending' && !isItemInPack(i.name);
        }).length > 0 && (
          <>
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" /> Missing
            </h4>
            {essentialItems.filter(i => {
              const status = getStatusForItem(i.name, i.scope);
              return status === 'pending' && !isItemInPack(i.name);
            }).map(renderChecklistItem)}
          </>
        )}
        
        {essentialItems.filter(i => {
          const status = getStatusForItem(i.name, i.scope);
          return status !== 'pending' || isItemInPack(i.name);
        }).length > 0 && (
          <>
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-6 mb-3">
              <Check className="w-4 h-4" /> Included
            </h4>
            {essentialItems.filter(i => {
              const status = getStatusForItem(i.name, i.scope);
              return status !== 'pending' || isItemInPack(i.name);
            }).map(renderChecklistItem)}
          </>
        )}
      </div>
    </div>
  );
}
