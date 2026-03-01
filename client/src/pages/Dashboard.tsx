import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGroups, useCreateGroup, useJoinGroup, useUpdateGroup } from "@/hooks/use-groups";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, ArrowRight, Loader2, Tent, Mountain, Bike, Footprints, Waves, Snowflake, Car, Ship, Plane, MoreHorizontal, Trees, Compass, MapPin, Sunrise, Flame, Backpack, Binoculars, CloudSun, Flag, Leaf, Star, Moon, Share2, Pencil } from "lucide-react";
import type { Group } from "@shared/schema";
import { GiCanoe, GiHorseHead } from "react-icons/gi";
import { TbKayak, TbHanger } from "react-icons/tb";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { ACTIVITY_TYPES } from "@shared/constants";

const ACTIVITY_ICONS: Record<string, any> = {
  hike: Mountain,
  run: Footprints,
  cycle: Bike,
  swim: Waves,
  kayak: TbKayak,
  canoe: GiCanoe,
  ski: Snowflake,
  horseriding: GiHorseHead,
  drive: Car,
  flight: Plane,
  boat: Ship,
  other: MoreHorizontal,
};

const ADVENTURE_ICON_MAP: Record<string, any> = {
  tent: Tent,
  mountain: Mountain,
  trees: Trees,
  compass: Compass,
  "map-pin": MapPin,
  sunrise: Sunrise,
  campfire: Flame,
  backpack: Backpack,
  binoculars: Binoculars,
  "cloud-sun": CloudSun,
  flag: Flag,
  footprints: Footprints,
  leaf: Leaf,
  star: Star,
  moon: Moon,
};

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const updateGroup = useUpdateGroup();
  const { toast } = useToast();

  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [tripTypes, setTripTypes] = useState<string[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTripTypes, setEditTripTypes] = useState<string[]>([]);

  const toggleTripType = (value: string) => {
    setTripTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const toggleEditTripType = (value: string) => {
    setEditTripTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const openEditDialog = (group: Group, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingGroup(group);
    setEditName(group.name);
    setEditLocation(group.location || "");
    setEditTripTypes(group.tripTypes || []);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await updateGroup.mutateAsync({
        id: editingGroup.id,
        updates: {
          name: editName,
          location: editLocation || null,
          tripTypes: editTripTypes.length > 0 ? editTripTypes : null,
        },
      });
      toast({ title: "Trip updated!" });
      setEditingGroup(null);
    } catch {
      toast({ title: "Error", description: "Failed to update trip", variant: "destructive" });
    }
  };

  if (authLoading || groupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup.mutateAsync({ 
        name: createName, 
        location: createLocation || undefined,
        tripTypes: tripTypes.length > 0 ? tripTypes : undefined,
      });
      toast({ title: "Group created!", description: "Start planning your trip." });
      setOpenCreate(false);
      setCreateName("");
      setCreateLocation("");
      setTripTypes([]);
    } catch (e) {
      toast({ title: "Error", description: "Failed to create group", variant: "destructive" });
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinGroup.mutateAsync({ shareCode: joinCode });
      toast({ title: "Joined group!", description: "You are now a member." });
      setOpenJoin(false);
      setJoinCode("");
    } catch (e) {
      toast({ title: "Error", description: "Invalid code or already a member", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background grainy">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <AppHeader wrapped />
          </div>
        </div>
      </div>
      <div className="px-4 md:px-8 py-4 md:py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">My Adventures</h1>
              <p className="text-muted-foreground mt-1">Ready for your next trip, {user?.nickname || user?.firstName || 'adventurer'}?</p>
            </div>
          
          <div className="flex items-center gap-3">
            <Link href="/my-gear">
              <Button variant="outline" className="h-10 gap-2" data-testid="link-my-gear">
                <TbHanger className="w-4 h-4" />
                My Gear Closet
              </Button>
            </Link>

            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  New Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a New Adventure</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-4">
                   <div className="space-y-2">
                     <Label htmlFor="tripName">Trip Name</Label>
                     <Input 
                        id="tripName"
                        placeholder="e.g. Wonderland Trail" 
                        value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        required
                        data-testid="input-trip-name"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="tripLocation">Location</Label>
                     <Input 
                        id="tripLocation"
                        placeholder="e.g. Victorian Alps, Australia" 
                        value={createLocation}
                        onChange={e => setCreateLocation(e.target.value)}
                        data-testid="input-trip-location"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label>Trip Activities</Label>
                     <div className="grid grid-cols-3 gap-2">
                       {ACTIVITY_TYPES.map((activity) => {
                         const Icon = ACTIVITY_ICONS[activity.value];
                         const isSelected = tripTypes.includes(activity.value);
                         return (
                           <button
                             key={activity.value}
                             type="button"
                             onClick={() => toggleTripType(activity.value)}
                             className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors duration-200 ${
                               isSelected 
                                 ? 'bg-primary/10 border-primary text-primary' 
                                 : 'border-border hover:bg-muted'
                             }`}
                             data-testid={`button-activity-${activity.value}`}
                           >
                             {Icon && <Icon className="w-4 h-4" />}
                             <span className="truncate">{activity.label}</span>
                           </button>
                         );
                       })}
                     </div>
                   </div>

                   <Button type="submit" className="w-full" disabled={createGroup.isPending} data-testid="button-create-trip">
                     {createGroup.isPending ? "Creating..." : "Create Trip"}
                   </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="group cursor-pointer h-full">
                <Card className="h-full border-2 border-border/50 hover:border-primary/50 hover:bg-white transition-colors duration-200 overflow-hidden bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-3">
                      {(() => {
                        const TripIcon = ADVENTURE_ICON_MAP[group.icon || 'tent'] || Tent;
                        return (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                            <TripIcon className="w-5 h-5" />
                          </div>
                        );
                      })()}
                      {group.tripTypes && group.tripTypes.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {group.tripTypes.slice(0, 4).map((type) => {
                            const Icon = ACTIVITY_ICONS[type];
                            return Icon ? (
                              <div key={type} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground" title={type}>
                                <Icon className="w-3 h-3" />
                              </div>
                            ) : null;
                          })}
                          {group.tripTypes.length > 4 && (
                            <span className="text-xs text-muted-foreground">+{group.tripTypes.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">
                        {group.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="invisible group-hover:visible flex-shrink-0 text-muted-foreground"
                        onClick={(e) => openEditDialog(group, e)}
                        data-testid={`button-edit-trip-${group.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                    {group.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate" data-testid={`text-trip-location-${group.id}`}>{group.location}</span>
                      </div>
                    )}
                    <CardDescription className="flex items-center gap-1.5 text-xs font-mono pt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      CODE: {group.shareCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Members */}
                    {group.members && group.members.length > 0 && (
                      <div className="flex items-center gap-2 pb-3">
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {group.members.map((member) => (
                            <span 
                              key={member.id} 
                              className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md"
                            >
                              {member.nickname || member.firstName || 'Member'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/50">
                      <span>View Trip</span>
                      <ArrowRight className="w-4 h-4 -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>
          ))}

          {/* Join Trip Card */}
          <Dialog open={openJoin} onOpenChange={setOpenJoin}>
            <DialogTrigger asChild>
              <div className="cursor-pointer h-full">
                <Card className="h-full border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-white/70 transition-colors duration-200 overflow-hidden bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[200px]" data-testid="card-join-trip">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-display font-medium text-foreground">Start or Join a Trip</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-center">
                      Enter a share code to join
                    </p>
                  </CardContent>
                </Card>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start your Adventure</DialogTitle>
              </DialogHeader>
              <Button 
                className="w-full bg-primary text-white" 
                onClick={() => {
                  setOpenJoin(false);
                  setOpenCreate(true);
                }}
                data-testid="button-new-trip-from-join"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start a New Trip
              </Button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <form onSubmit={handleJoin} className="space-y-4">
                 <Input 
                    placeholder="Enter share code..." 
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    required
                    data-testid="input-join-code"
                 />
                 <Button type="submit" variant="outline" className="w-full" disabled={joinGroup.isPending} data-testid="button-join-submit">
                   <Share2 className="w-4 h-4 mr-2" />
                   {joinGroup.isPending ? "Joining..." : "Join Trip"}
                 </Button>
              </form>
            </DialogContent>
          </Dialog>

          {groups?.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-white/30">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No adventures yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                Create a new trip or join one with a share code.
              </p>
            </div>
          )}
        </div>

        <Dialog open={!!editingGroup} onOpenChange={(open) => { if (!open) setEditingGroup(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Trip</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editTripName">Trip Name</Label>
                <Input 
                  id="editTripName"
                  placeholder="e.g. Wonderland Trail" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  data-testid="input-edit-trip-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTripLocation">Location</Label>
                <Input 
                  id="editTripLocation"
                  placeholder="e.g. Victorian Alps, Australia" 
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  data-testid="input-edit-trip-location"
                />
              </div>

              <div className="space-y-2">
                <Label>Trip Activities</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.value];
                    const isSelected = editTripTypes.includes(activity.value);
                    return (
                      <button
                        key={activity.value}
                        type="button"
                        onClick={() => toggleEditTripType(activity.value)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors duration-200 ${
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'border-border hover:bg-muted'
                        }`}
                        data-testid={`button-edit-activity-${activity.value}`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className="truncate">{activity.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateGroup.isPending} data-testid="button-save-edit-trip">
                {updateGroup.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        </div>
      </div>
    </div>
  );
}
