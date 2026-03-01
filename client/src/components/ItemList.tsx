import { useState } from "react";
import { Item, User } from "@shared/schema";
import { Trash2, ShoppingBag, User as UserIcon, Pencil, Backpack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteItem, useUpdateItem } from "@/hooks/use-items";
import { Badge } from "@/components/ui/badge";
import { EditItemDialog } from "./EditItemDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePreferences } from "@/hooks/use-preferences";

interface ItemListProps {
  items: (Item & { user: User | null; carriedByUser?: User | null })[];
  currentUserId?: string;
  groupId: number;
  isGroupView?: boolean;
  groupMembers?: User[];
}

export function ItemList({ items, currentUserId, groupId, isGroupView = false, groupMembers = [] }: ItemListProps) {
  const deleteItem = useDeleteItem(groupId);
  const updateItem = useUpdateItem(groupId);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { formatWeightUnit, formatWeightTotal } = usePreferences();

  const handlePackAssignment = (itemId: number, carrierId: string | null) => {
    updateItem.mutate({ 
      id: itemId, 
      carriedByUserId: carrierId 
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-border">
        <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No items in this list yet.</p>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem.mutate(id);
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group relative flex items-center p-4 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/80 transition-colors duration-200 cursor-pointer"
          onClick={() => (!isGroupView || item.userId === currentUserId) && setEditingItem(item)}
          data-testid={`item-row-${item.id}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground truncate">{item.name}</h4>
              {item.type && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal opacity-70 uppercase tracking-wider">
                  {item.type}
                </Badge>
              )}
              {item.brand && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                  {item.brand}
                </span>
              )}
              {isGroupView && item.user && (
                 <Badge variant="outline" className="ml-auto text-xs font-normal h-5 bg-secondary/5 text-secondary border-secondary/20">
                    <UserIcon className="w-3 h-3 mr-1 opacity-70" />
                    {item.user.nickname || item.user.firstName || 'Member'}
                 </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <span className="font-mono font-medium text-foreground mr-1">{item.quantity}</span>
                <span className="text-xs">qty</span>
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center">
                <span className="font-mono font-medium text-foreground mr-1">{formatWeightUnit(item.weightGrams).value}</span>
                <span className="text-xs">{formatWeightUnit(item.weightGrams).unit}</span>
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center">
                <span className="font-mono font-medium text-foreground mr-1">${(item.price / 100).toFixed(2)}</span>
              </span>
            </div>
            
            {/* Pack Assignment for shared items in group view */}
            {isGroupView && item.isShared === true && groupMembers.length > 0 && (
              <div 
                className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50"
                onClick={(e) => e.stopPropagation()}
              >
                <Backpack className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Carried by:</span>
                <Select
                  value={item.carriedByUserId || "unassigned"}
                  onValueChange={(value) => handlePackAssignment(item.id, value === "unassigned" ? null : value)}
                >
                  <SelectTrigger 
                    className="h-7 text-xs border bg-background hover:bg-muted px-2 min-w-[120px]"
                    data-testid={`select-pack-${item.id}`}
                  >
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {groupMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nickname || member.firstName || 'Member'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions - Only allow editing/deleting own items */}
          {(!isGroupView || item.userId === currentUserId) && (
            <div className="ml-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                data-testid={`button-edit-item-${item.id}`}
              >
                <Pencil className="w-4 h-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                disabled={deleteItem.isPending}
                data-testid={`button-delete-item-${item.id}`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Totals Footer */}
      <div className="mt-6 flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-secondary/10">
        <span className="text-sm font-semibold text-secondary">Total</span>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground mr-2">Weight:</span>
            <span className="font-mono font-bold text-foreground">
              {formatWeightTotal(items.reduce((sum, item) => sum + (item.weightGrams * item.quantity), 0))}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground mr-2">Cost:</span>
            <span className="font-mono font-bold text-foreground">
              ${(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          groupId={groupId}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}
    </div>
  );
}
