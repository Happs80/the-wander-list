import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Plus, Trash2, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildUrl } from "@shared/routes";
import type { User, TripChecklistItem } from "@shared/schema";

type TripChecklistItemWithUsers = TripChecklistItem & {
  assignedUser: User | null;
  createdByUser: User | null;
};

interface TripChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  members: User[];
}

export function TripChecklistModal({ open, onOpenChange, groupId, members }: TripChecklistModalProps) {
  const [newItemText, setNewItemText] = useState("");
  const [newItemAssignee, setNewItemAssignee] = useState<string>("unassigned");
  const { toast } = useToast();

  const { data: checklistItems = [], isLoading } = useQuery<TripChecklistItemWithUsers[]>({
    queryKey: ['/api/groups', groupId, 'trip-checklist'],
    queryFn: async () => {
      const res = await fetch(buildUrl('/api/groups/:groupId/trip-checklist', { groupId }));
      if (!res.ok) throw new Error("Failed to fetch checklist");
      return res.json();
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { text: string; assignedUserId?: string | null }) => {
      const res = await apiRequest("POST", buildUrl('/api/groups/:groupId/trip-checklist', { groupId }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'trip-checklist'] });
      setNewItemText("");
      setNewItemAssignee("unassigned");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; text?: string; assignedUserId?: string | null; isCompleted?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/trip-checklist/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'trip-checklist'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/trip-checklist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', groupId, 'trip-checklist'] });
    },
  });

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    createMutation.mutate({
      text: newItemText.trim(),
      assignedUserId: newItemAssignee === "unassigned" ? null : newItemAssignee,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const completedCount = checklistItems.filter(i => i.isCompleted).length;
  const totalCount = checklistItems.length;

  const getMemberDisplayName = (user: User) => {
    return (user as any).nickname || user.firstName || user.email || "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Trip Checklist
            {totalCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {completedCount}/{totalCount} done
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 items-end" data-testid="trip-checklist-add-form">
          <div className="flex-1">
            <Input
              placeholder="Add a task... e.g. Bring gas stove"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="input-trip-checklist-text"
            />
          </div>
          <Select value={newItemAssignee} onValueChange={setNewItemAssignee}>
            <SelectTrigger className="w-[140px]" data-testid="select-trip-checklist-assignee">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">No one</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {getMemberDisplayName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            onClick={handleAddItem}
            disabled={!newItemText.trim() || createMutation.isPending}
            data-testid="button-add-trip-checklist-item"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pt-2">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          )}

          {!isLoading && checklistItems.length === 0 && (
            <div className="text-center py-8">
              <ListChecks className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tasks yet. Add one above!</p>
            </div>
          )}

          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group ${
                item.isCompleted ? "opacity-60" : ""
              }`}
              data-testid={`trip-checklist-item-${item.id}`}
            >
              <Checkbox
                checked={item.isCompleted}
                onCheckedChange={(checked) =>
                  updateMutation.mutate({ id: item.id, isCompleted: !!checked })
                }
                data-testid={`checkbox-trip-checklist-${item.id}`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                  {item.text}
                </p>
                {item.assignedUser && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <UserCircle className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {getMemberDisplayName(item.assignedUser)}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate(item.id)}
                data-testid={`button-delete-trip-checklist-${item.id}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
