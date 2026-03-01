import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppHeader } from "@/components/AppHeader";
import { useGroup } from "@/hooks/use-groups";
import { api } from "@shared/routes";
import { useItems } from "@/hooks/use-items";
import { AddFromClosetDialog } from "@/components/AddFromClosetDialog";
import { useItinerary, useDeleteItineraryDay, useGroupStages } from "@/hooks/use-itinerary";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Share2, MapPin, Backpack, Shirt, Utensils, Trash2, Pencil, Map, StickyNote, FileText, ListChecks } from "lucide-react";
import itineraryIcon from "@assets/noun-itinerary-7811198_1769600730107.png";
import { TbHanger } from "react-icons/tb";
import { ItemList } from "@/components/ItemList";
import { AddItemDialog } from "@/components/AddItemDialog";
import { AddDayDialog } from "@/components/AddDayDialog";
import { EditDayDialog } from "@/components/EditDayDialog";
import { TripMapModal } from "@/components/TripMapModal";
import { TripNotesModal } from "@/components/TripNotesModal";
import { TripChecklistModal } from "@/components/TripChecklistModal";
import { DayNotesModal } from "@/components/DayNotesModal";
import { useUpdateItineraryDay } from "@/hooks/use-itinerary";
import { StageList } from "@/components/StageList";
import { PackWeightSummary } from "@/components/PackWeightSummary";
import { WeatherBadge } from "@/components/WeatherBadge";
import { CategorySuggestions } from "@/components/CategorySuggestions";
import { usePreferences } from "@/hooks/use-preferences";
import { useSuggestionCounts } from "@/hooks/use-suggestion-counts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ItineraryDay } from "@shared/schema";

export default function GroupView() {
  const [match, params] = useRoute("/groups/:id");
  const id = parseInt(params?.id || "0");
  const { data: group, isLoading: groupLoading } = useGroup(id);
  const { data: items, isLoading: itemsLoading } = useItems(id);
  const { data: itinerary, isLoading: itineraryLoading } = useItinerary(id);
  const { data: allGroupStages } = useGroupStages(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const deleteDay = useDeleteItineraryDay(id);
  const { formatDate } = usePreferences();

  const updateGroup = useMutation({
    mutationFn: async (updates: { isChecklistEnabled?: boolean; gpxData?: string | null; notes?: string | null }) => {
      return apiRequest('PATCH', `/api/groups/${id}/settings`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.get.path, id] });
    },
  });
  
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [dayNotesOpen, setDayNotesOpen] = useState<ItineraryDay | null>(null);
  const updateDay = useUpdateItineraryDay(id);
  
  const handleGpxUpload = async (gpxContent: string) => {
    await updateGroup.mutateAsync({ gpxData: gpxContent });
  };
  
  const handleNotesSave = async (notes: string) => {
    await updateGroup.mutateAsync({ notes });
  };

  const handleDayNotesSave = async (notes: string) => {
    if (!dayNotesOpen) return;
    await updateDay.mutateAsync({ id: dayNotesOpen.id, data: { description: notes } });
  };

  const [activeTab, setActiveTab] = useState("itinerary");
  const [viewMode, setViewMode] = useState<"all" | "personal" | "group">("personal");
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);

  const gearItems = items?.filter(i => i.category === 'gear') || [];
  const clothingItems = items?.filter(i => i.category === 'clothing') || [];
  const gearSuggestions = useSuggestionCounts('gear', gearItems, viewMode);
  const clothingSuggestions = useSuggestionCounts('clothing', clothingItems, viewMode);

  if (groupLoading || itemsLoading || itineraryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!group) return <div className="p-8">Group not found</div>;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.shareCode);
    toast({ title: "Copied!", description: "Share code copied to clipboard." });
  };

  const effectiveViewMode = activeTab === 'clothing' ? 'personal' : viewMode;

  const filteredItems = items?.filter(item => {
    if (activeTab === "itinerary") return false;
    if (item.category !== activeTab) return false;
    
    if (effectiveViewMode === "all") {
      return true;
    } else if (effectiveViewMode === "personal") {
      return item.userId === user?.id;
    } else {
      return item.isShared === true;
    }
  }) || [];

  return (
    <div className="min-h-screen bg-background grainy">
      <AppHeader />
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground leading-none">{group.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono text-[10px] tracking-wider">
                  {group.members.length} Member(s)
                </Badge>
                <button onClick={handleCopyCode} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  Code: {group.shareCode}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/my-gear">
              <Button variant="outline" className="h-10 gap-2" data-testid="link-my-gear">
                <TbHanger className="w-4 h-4" />
                <span className="hidden sm:inline">My Gear Closet</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/30 p-3 sm:p-6 flex flex-col flex-1 min-h-0">
            {/* Unified Tab Row */}
            <TabsList className="h-12 p-1 bg-white/50 backdrop-blur-sm border border-border/50 rounded-xl w-auto inline-flex gap-1 mb-4 flex-shrink-0">
              <TabsTrigger value="itinerary" className="rounded-lg h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 px-3 sm:px-4">
                <img src={itineraryIcon} alt="" className="w-4 h-4" style={{ filter: activeTab === 'itinerary' ? 'brightness(0) invert(1)' : 'none' }} />
                <span className="text-xs sm:text-sm">Itinerary</span>
              </TabsTrigger>
              
              <div className="w-px bg-border/50 mx-1 my-2" />
              
              <TabsTrigger value="food" className="rounded-lg h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 px-3 sm:px-4">
                <Utensils className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Food</span>
              </TabsTrigger>
              <TabsTrigger value="gear" className="rounded-lg h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 px-3 sm:px-4">
                <Backpack className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Gear</span>
              </TabsTrigger>
              <TabsTrigger value="clothing" className="rounded-lg h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1.5 px-3 sm:px-4">
                <Shirt className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Clothes</span>
              </TabsTrigger>
            </TabsList>

            {activeTab !== "itinerary" ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Frozen header area */}
                <div className="space-y-4 flex-shrink-0 pb-4">
                  {/* Row 1: Title + Add Item buttons */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold capitalize">{activeTab}</h2>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <AddItemDialog 
                        groupId={id} 
                        category={activeTab as "gear" | "clothing" | "food"} 
                      />
                      {(activeTab === 'gear' || activeTab === 'clothing') && (
                        <AddFromClosetDialog 
                          groupId={id} 
                          category={activeTab as 'gear' | 'clothing'} 
                        />
                      )}
                    </div>
                  </div>

                  {/* Row 2: Controls - My List/Group List, Checklist, Pack Weight */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab !== 'clothing' && (
                        <div className="flex items-center bg-muted/50 p-1 rounded-lg h-9">
                          <button
                            onClick={() => setViewMode(viewMode === "personal" ? "all" : viewMode === "all" ? "group" : "personal")}
                            className={cn(
                              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
                              (viewMode === "personal" || viewMode === "all") 
                                ? "bg-primary text-white shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                            )}
                          >
                            My List
                          </button>
                          <button
                            onClick={() => setViewMode(viewMode === "group" ? "all" : viewMode === "all" ? "personal" : "group")}
                            className={cn(
                              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
                              (viewMode === "group" || viewMode === "all") 
                                ? "bg-primary text-white shadow-sm" 
                                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                            )}
                          >
                            Group List
                          </button>
                        </div>
                      )}
                      {(activeTab === 'gear' || activeTab === 'clothing') && (() => {
                        const isEnabled = group.isChecklistEnabled ?? true;
                        const suggestions = activeTab === 'gear' ? gearSuggestions : clothingSuggestions;
                        const hasItems = suggestions.totalEssential > 0;
                        
                        return (
                          <div className="flex items-center gap-2 px-3 h-9 bg-muted/60 rounded-lg border border-border/50">
                            <span className="text-xs font-medium text-muted-foreground">Checklist:</span>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => updateGroup.mutate({ isChecklistEnabled: checked })}
                              className="scale-75"
                              data-testid="switch-checklist-inline"
                            />
                            {isEnabled && hasItems && (
                              <Badge className="text-xs h-6 px-2 font-semibold bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white">
                                {suggestions.addedEssential}/{suggestions.totalEssential} essential
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <PackWeightSummary items={items || []} members={group.members} />
                  </div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                  <ItemList 
                    items={filteredItems} 
                    currentUserId={user?.id}
                    groupId={id}
                    isGroupView={effectiveViewMode === "group"}
                    groupMembers={group.members}
                  />

                  {(activeTab === 'gear' || activeTab === 'clothing') && (group.isChecklistEnabled ?? true) && (
                    <CategorySuggestions
                      groupId={id}
                      category={activeTab}
                      tripItems={items?.filter(i => i.category === activeTab) || []}
                      viewMode={effectiveViewMode}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Frozen header area */}
                <div className="space-y-4 flex-shrink-0 pb-4">
                  {/* Row 1: Title + Add Day button */}
                  <div className="flex items-start justify-between gap-4">
                     <div>
                      <h2 className="text-2xl font-display font-bold">Itinerary</h2>
                     </div>
                     <AddDayDialog 
                       groupId={id} 
                       nextDayNum={(itinerary?.length || 0) + 1} 
                       lastDayDate={itinerary && itinerary.length > 0 ? itinerary[itinerary.length - 1].date || undefined : undefined}
                     />
                  </div>

                  {/* Row 2: Notes, Checklist and Trail Map buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      variant="outline"
                      className="bg-white"
                      onClick={() => setIsNotesModalOpen(true)}
                      data-testid="button-trip-notes"
                    >
                      <StickyNote className="w-4 h-4 mr-2" />
                      Trip Notes
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-white"
                      onClick={() => setIsChecklistModalOpen(true)}
                      data-testid="button-trip-checklist"
                    >
                      <ListChecks className="w-4 h-4 mr-2" />
                      Checklist
                    </Button>
                    <Button 
                      variant="outline"
                      className="bg-white"
                      onClick={() => setIsMapModalOpen(true)}
                      data-testid="button-trail-map"
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Trail Map
                    </Button>
                  </div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
                  {itinerary?.length === 0 && (
                    <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-border">
                      <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No itinerary days planned yet.</p>
                    </div>
                  )}

                  {itinerary?.sort((a,b) => a.dayNumber - b.dayNumber).map((day) => (
                    <div key={day.id} className="relative pl-8 md:pl-0" data-testid={`itinerary-day-${day.id}`}>
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-border md:hidden" />
                      
                      <div className="bg-white rounded-xl border border-border p-3 sm:p-5 hover:shadow-md transition-shadow relative">
                         <div className="absolute left-3 top-5 w-2 h-2 rounded-full bg-primary -translate-x-[5px] md:hidden" />
                         
                         <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4">
                           <div className="flex flex-row md:flex-col items-center gap-2 md:gap-1">
                             <div className="bg-primary/5 text-primary rounded-lg px-2 sm:px-3 py-1 font-display font-bold text-base sm:text-lg min-w-[60px] sm:min-w-[80px] text-center">
                               Day {day.dayNumber}
                             </div>
                             {day.date && (
                               <div className="flex flex-col items-center gap-0.5">
                                 <span className="text-xs text-muted-foreground">{formatDate(day.date!)}</span>
                                 <WeatherBadge day={day} trip={group} stages={allGroupStages} />
                               </div>
                             )}
                           </div>
                           
                           <div className="flex-1 space-y-3">
                             <div className="flex items-start justify-between gap-2">
                               <h3 
                                 className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                                 onClick={() => setEditingDay(day)}
                               >
                                 {day.location}
                               </h3>
                               <div className="flex items-center gap-1">
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className={cn(
                                     "h-8 w-8 hover:text-primary hover:bg-primary/10",
                                     day.description ? "text-primary" : "text-muted-foreground"
                                   )}
                                   onClick={() => setDayNotesOpen(day)}
                                   data-testid={`button-day-notes-${day.id}`}
                                 >
                                   <FileText className="w-4 h-4" />
                                 </Button>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                   onClick={() => setEditingDay(day)}
                                   data-testid={`button-edit-day-${day.id}`}
                                 >
                                   <Pencil className="w-4 h-4" />
                                 </Button>
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                   onClick={() => {
                                     if(confirm("Delete this day?")) deleteDay.mutate(day.id);
                                   }}
                                   data-testid={`button-delete-day-${day.id}`}
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                             </div>

                             <StageList dayId={day.id} groupId={id} />
                           </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {editingDay && (
        <EditDayDialog
          day={editingDay}
          groupId={id}
          open={!!editingDay}
          onOpenChange={(open) => !open && setEditingDay(null)}
        />
      )}
      
      <TripMapModal
        open={isMapModalOpen}
        onOpenChange={setIsMapModalOpen}
        gpxData={group?.gpxData}
        onGpxUpload={handleGpxUpload}
      />
      
      <TripNotesModal
        open={isNotesModalOpen}
        onOpenChange={setIsNotesModalOpen}
        notes={group?.notes}
        onSave={handleNotesSave}
        isSaving={updateGroup.isPending}
      />

      <TripChecklistModal
        open={isChecklistModalOpen}
        onOpenChange={setIsChecklistModalOpen}
        groupId={id}
        members={group?.members || []}
      />
      
      {dayNotesOpen && (
        <DayNotesModal
          open={!!dayNotesOpen}
          onOpenChange={(open) => !open && setDayNotesOpen(null)}
          dayNumber={dayNotesOpen.dayNumber}
          dayLocation={dayNotesOpen.location}
          notes={dayNotesOpen.description}
          onSave={handleDayNotesSave}
          isSaving={updateDay.isPending}
        />
      )}
    </div>
  );
}
