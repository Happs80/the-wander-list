import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { MasterChecklistItem, Item, User } from "@shared/schema";

function normalize(str: string): string {
  return str.toLowerCase().replace(/\(s\)/g, 's').replace(/[-()]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tripItemMatchesChecklist(tripItemName: string, checklistName: string, aliases: string[] | null): boolean {
  const normalizedTripName = normalize(tripItemName);
  const normalizedChecklistName = normalize(checklistName);

  if (normalizedTripName === normalizedChecklistName) return true;

  if (normalizedTripName.includes(normalizedChecklistName)) return true;

  if (normalizedChecklistName.includes(normalizedTripName)) return true;

  if (aliases && aliases.length > 0) {
    return aliases.some(alias => normalizedTripName.includes(normalize(alias)));
  }

  return false;
}

export function useSuggestionCounts(
  category: "gear" | "clothing",
  tripItems: (Item & { user: User | null })[],
  scopeFilter?: "personal" | "group" | "all"
) {
  const { user } = useAuth();

  const { data: masterChecklistItems = [] } = useQuery<MasterChecklistItem[]>({
    queryKey: ['/api/master-checklist'],
  });

  const allCategoryItems = masterChecklistItems.filter(
    item => item.gearCategory === category
  );
  
  const categoryItems = allCategoryItems.filter(item => {
    if (!scopeFilter || scopeFilter === "all") return true;
    if (scopeFilter === "group") return item.scope === "group";
    return item.scope === "individual";
  });

  const getMissingItems = () => {
    return categoryItems.filter(masterItem => {
      if (masterItem.scope === 'group') {
        const existsInTrip = tripItems.some(tripItem =>
          tripItem.category === category &&
          tripItemMatchesChecklist(tripItem.name, masterItem.name, masterItem.aliases)
        );
        return !existsInTrip;
      } else {
        const existsForCurrentUser = tripItems.some(tripItem =>
          tripItem.category === category &&
          tripItem.userId === user?.id &&
          tripItemMatchesChecklist(tripItem.name, masterItem.name, masterItem.aliases)
        );
        return !existsForCurrentUser;
      }
    });
  };

  const missingItems = getMissingItems();
  const missingEssentialCount = missingItems.filter(item => item.isEssential !== false).length;
  
  const totalEssential = categoryItems.filter(item => item.isEssential !== false).length;
  
  const addedEssential = totalEssential - missingEssentialCount;

  return {
    essentialCount: missingEssentialCount,
    optionalCount: 0,
    totalCount: missingItems.length,
    missingItems,
    addedEssential,
    totalEssential,
    addedOptional: 0,
    totalOptional: 0,
  };
}
