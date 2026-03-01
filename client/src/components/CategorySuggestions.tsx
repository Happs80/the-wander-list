import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddItemDialog } from "./AddItemDialog";
import { useSuggestionCounts } from "@/hooks/use-suggestion-counts";
import { GEAR_CATALOG } from "@shared/constants";
import type { MasterChecklistItem, Item, User } from "@shared/schema";

interface CategorySuggestionsProps {
  groupId: number;
  category: "gear" | "clothing";
  tripItems: (Item & { user: User | null })[];
  viewMode?: "personal" | "group" | "all";
}

export function CategorySuggestions({ groupId, category, tripItems, viewMode = "all" }: CategorySuggestionsProps) {
  const [selectedItem, setSelectedItem] = useState<MasterChecklistItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { missingItems, essentialCount } = useSuggestionCounts(category, tripItems);
  
  const scopeFiltered = missingItems.filter(item => {
    if (viewMode === "all") return true;
    if (viewMode === "group") return item.scope === "group";
    return item.scope === "individual";
  });
  
  const essentialMissing = scopeFiltered.filter(item => item.isEssential !== false);

  const handleAddClick = (item: MasterChecklistItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  };

  if (scopeFiltered.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {essentialMissing.length > 0 && (
        <div className="space-y-2 p-3 rounded-lg border-l-4 border-l-teal-600 dark:border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/30">
          <p className="text-xs text-teal-700 dark:text-teal-400 uppercase tracking-wider font-semibold">
            Missing Essentials
          </p>
          <div className="space-y-2">
            {essentialMissing.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 bg-white/60 dark:bg-teal-900/20 rounded-lg border border-teal-200/50 dark:border-teal-800/50"
                data-testid={`suggestion-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  {item.scope === 'group' && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">
                      Group
                    </Badge>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleAddClick(item)}
                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-teal-900/40"
                  data-testid={`button-add-suggestion-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddItemDialog
        groupId={groupId}
        category={category}
        initialData={selectedItem ? (() => {
          const catalogMatch = GEAR_CATALOG.find(
            g => g.name.toLowerCase() === selectedItem.name.toLowerCase() && g.category === category
          );
          return {
            name: selectedItem.name,
            type: catalogMatch?.type,
            weightGrams: catalogMatch?.weightGrams,
          };
        })() : undefined}
        externalOpen={dialogOpen}
        onExternalOpenChange={handleDialogClose}
        trigger={null}
      />
    </div>
  );
}
