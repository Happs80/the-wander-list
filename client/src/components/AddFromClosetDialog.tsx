import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Check } from "lucide-react";
import { useMasterItems, useAddFromCloset } from "@/hooks/use-master-items";
import { useItems } from "@/hooks/use-items";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/hooks/use-preferences";
import type { MasterItem } from "@shared/schema";

interface AddFromClosetDialogProps {
  groupId: number;
  category: "gear" | "clothing";
}

export function AddFromClosetDialog({ groupId, category }: AddFromClosetDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { data: masterItems, isLoading } = useMasterItems();
  const { data: tripItemsData } = useItems(groupId);
  const addFromCloset = useAddFromCloset();

  const alreadyInTripIds = useMemo(() => {
    const tripItems = tripItemsData || [];
    return new Set(tripItems.filter((i: any) => i.masterItemId != null).map((i: any) => i.masterItemId as number));
  }, [tripItemsData]);

  const filteredItems = useMemo(() => {
    return (masterItems || []).filter(item => item.category === category);
  }, [masterItems, category]);

  const availableItems = useMemo(() => {
    return filteredItems.filter(item => !alreadyInTripIds.has(item.id));
  }, [filteredItems, alreadyInTripIds]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MasterItem[]> = {};
    filteredItems.forEach(item => {
      const type = item.type || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleToggle = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableItems.map(i => i.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const result = await addFromCloset.mutateAsync({
        groupId,
        masterItemIds: Array.from(selectedIds)
      });
      toast({ 
        title: "Items added", 
        description: `Added ${result.added} item${result.added !== 1 ? 's' : ''} from your closet.` 
      });
      setOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      toast({ title: "Error", description: "Failed to add items. Please try again.", variant: "destructive" });
    }
  };

  const { formatWeight } = usePreferences();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setSelectedIds(new Set());
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-from-closet">
          <Download className="w-4 h-4 mr-2" />
          Add from Closet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add from My Gear Closet</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading your closet...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No {category} items in your closet yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Items you add to trips will automatically save here.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2 border-b">
              <button
                onClick={handleSelectAll}
                className="text-sm text-primary hover:underline"
                data-testid="button-select-all"
              >
                {selectedIds.size === availableItems.length ? "Deselect all" : "Select all"}
              </button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} of {availableItems.length} available
              </span>
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([type, items]) => (
                  <div key={type}>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{type}</h4>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const inTrip = alreadyInTripIds.has(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${inTrip ? 'opacity-50 cursor-default' : 'hover:bg-muted/50 cursor-pointer'}`}
                            data-testid={`closet-item-${item.id}`}
                          >
                            {inTrip ? (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={() => handleToggle(item.id)}
                                data-testid={`checkbox-item-${item.id}`}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.name}</div>
                              {(item.brand || item.model) && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {[item.brand, item.model].filter(Boolean).join(" ")}
                                </div>
                              )}
                            </div>
                            {inTrip ? (
                              <span className="text-xs text-muted-foreground shrink-0">In trip</span>
                            ) : (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {formatWeight(item.weightGrams)}
                              </Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedIds.size === 0 || addFromCloset.isPending}
            data-testid="button-add-selected"
          >
            {addFromCloset.isPending ? "Adding..." : `Add ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
