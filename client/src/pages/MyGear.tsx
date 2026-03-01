import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMasterItems, useCreateMasterItem, useUpdateMasterItem, useDeleteMasterItem, useAddFromCloset } from "@/hooks/use-master-items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Search, Backpack, Shirt, Check, ClipboardList, Download, Pencil, X, MapPin } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Group } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { PhotoCaptureButton } from "@/components/PhotoCaptureButton";
import { GEAR_CATALOG } from "@shared/constants";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/use-preferences";
import type { MasterItem, MasterChecklistItem } from "@shared/schema";

export default function MyGear() {
  const { data: masterItems, isLoading } = useMasterItems();
  const [activeTab, setActiveTab] = useState<"gear" | "clothing" | "checklist">("gear");
  const { formatWeightTotal } = usePreferences();

  const gearItems = useMemo(() => 
    masterItems?.filter(i => i.category === 'gear') || [], 
    [masterItems]
  );
  
  const clothingItems = useMemo(() => 
    masterItems?.filter(i => i.category === 'clothing') || [], 
    [masterItems]
  );

  const groupedItems = useMemo(() => {
    const items = activeTab === 'gear' ? gearItems : clothingItems;
    const groups: Record<string, MasterItem[]> = {};
    items.forEach(item => {
      const type = item.type || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  }, [activeTab, gearItems, clothingItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your gear...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-background dark:from-green-950/20">
      <AppHeader />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Gear Closet</h1>
          <p className="text-muted-foreground">
            Your personal gear and clothing inventory. Sync these to any trip for quick setup.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gear" | "clothing" | "checklist")}>
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <TabsList className="grid grid-cols-3 w-[300px]">
              <TabsTrigger value="gear" className="gap-2" data-testid="tab-gear">
                <Backpack className="w-4 h-4" />
                Gear
              </TabsTrigger>
              <TabsTrigger value="clothing" className="gap-2" data-testid="tab-clothing">
                <Shirt className="w-4 h-4" />
                Clothing
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2" data-testid="tab-checklist">
                <ClipboardList className="w-4 h-4" />
                Checklist
              </TabsTrigger>
            </TabsList>
            {(activeTab === 'gear' || activeTab === 'clothing') && (
              <div className="flex items-center gap-2 flex-wrap">
                <AddToTripDialog category={activeTab} />
                <AddMasterItemDialog category={activeTab} />
              </div>
            )}
          </div>

          <TabsContent value="gear" className="mt-0">
            <MasterItemsGrid items={groupedItems} category="gear" />
          </TabsContent>
          <TabsContent value="clothing" className="mt-0">
            <MasterItemsGrid items={groupedItems} category="clothing" />
          </TabsContent>
          <TabsContent value="checklist" className="mt-0">
            <MasterChecklistManager />
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium">Total Items</p>
              <p className="text-2xl font-bold text-primary">
                {(gearItems.length + clothingItems.length)} items
              </p>
            </div>
            <div>
              <p className="font-medium">Total Weight</p>
              <p className="text-2xl font-bold text-primary">
                {formatWeightTotal(gearItems.reduce((s, i) => s + i.weightGrams * i.quantity, 0) + 
                   clothingItems.reduce((s, i) => s + i.weightGrams * i.quantity, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterItemsGrid({ items, category }: { items: Record<string, MasterItem[]>; category: string }) {
  const deleteItem = useDeleteMasterItem();
  const updateItem = useUpdateMasterItem();
  const { toast } = useToast();
  const { formatWeightUnit } = usePreferences();
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteItem.mutateAsync(id);
      toast({ title: "Item removed from your gear closet" });
    } catch {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  if (Object.keys(items).length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 dark:bg-card/50 rounded-2xl border border-dashed">
        <Backpack className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No {category} items in your closet yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Add items or sync from a trip.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(items).map(([type, typeItems]) => (
        <div key={type}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{type}</h3>
          <div className="grid gap-3">
            {typeItems.map((item) => (
              <Card key={item.id} className="group hover:bg-muted/50 transition-colors duration-200">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingItem(item)} data-testid={`button-edit-master-${item.id}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{item.name}</span>
                      {item.brand && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {item.brand}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{item.quantity} qty</span>
                      <span>{formatWeightUnit(item.weightGrams).value} {formatWeightUnit(item.weightGrams).unit}</span>
                      <span>${(item.price / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                      onClick={() => setEditingItem(item)}
                      data-testid={`button-edit-icon-master-${item.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`button-delete-master-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {editingItem && (
        <EditMasterItemDialog
          key={editingItem.id}
          item={editingItem}
          category={category}
          open={!!editingItem}
          onOpenChange={(open) => { if (!open) setEditingItem(null); }}
          onSave={async (updates) => {
            try {
              await updateItem.mutateAsync({ id: editingItem.id, updates });
              toast({ title: "Item updated" });
              setEditingItem(null);
            } catch {
              toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
            }
          }}
          isPending={updateItem.isPending}
        />
      )}
    </div>
  );
}

function EditMasterItemDialog({
  item,
  category,
  open,
  onOpenChange,
  onSave,
  isPending,
}: {
  item: MasterItem;
  category: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Omit<MasterItem, 'id' | 'userId'>>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: item.name,
    type: item.type || "",
    brand: item.brand || "",
    model: item.model || "",
    quantity: item.quantity.toString(),
    weightGrams: item.weightGrams.toString(),
    price: (item.price / 100).toFixed(2),
  });

  const filteredCatalog = useMemo(() => {
    return GEAR_CATALOG.filter(c => c.category === category);
  }, [category]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, typeof GEAR_CATALOG> = {};
    filteredCatalog.forEach(c => {
      const t = c.type || "Other";
      if (!groups[t]) groups[t] = [];
      groups[t].push(c);
    });
    return groups;
  }, [filteredCatalog]);

  const [searchOpen, setSearchOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      type: formData.type || null,
      brand: formData.brand || null,
      model: formData.model || null,
      quantity: parseInt(formData.quantity) || 1,
      weightGrams: parseInt(formData.weightGrams) || 0,
      price: Math.round(parseFloat(formData.price) * 100),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit {category === 'gear' ? 'Gear' : 'Clothing'} Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  {formData.name || "Select or type item..."}
                  <Search className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-background border shadow-md" align="start">
                <Command className="bg-background">
                  <CommandInput placeholder="Search catalog..." />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty>No item found.</CommandEmpty>
                    {Object.entries(groupedCatalog).map(([type, catalogItems]) => (
                      <CommandGroup key={type} heading={type}>
                        {catalogItems.map((ci) => (
                          <CommandItem
                            key={ci.name}
                            value={ci.name}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                name: ci.name,
                                type: ci.type || "",
                                weightGrams: ci.weightGrams.toString(),
                              });
                              setSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.name === ci.name ? "opacity-100" : "opacity-0")} />
                            {ci.name} ({ci.weightGrams}g)
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Or type custom name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              data-testid="input-edit-name"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Input
              placeholder="e.g. Sleep System, Footwear"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              data-testid="input-edit-type"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                placeholder="e.g. Osprey"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                data-testid="input-edit-brand"
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                placeholder="e.g. Exos 58"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                data-testid="input-edit-model"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                data-testid="input-edit-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (g)</Label>
              <Input
                type="number"
                min="0"
                value={formData.weightGrams}
                onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                data-testid="input-edit-weight"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              data-testid="input-edit-price"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-edit">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddToTripDialog({ category }: { category: "gear" | "clothing" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select-items" | "select-trip">("select-items");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { data: masterItems } = useMasterItems();
  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: open,
  });
  const addFromCloset = useAddFromCloset();
  const { toast } = useToast();
  const { formatWeightUnit } = usePreferences();

  const filteredItems = useMemo(() => {
    return (masterItems || []).filter(item => item.category === category);
  }, [masterItems, category]);

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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleAddToTrip = async (groupId: number) => {
    try {
      const result = await addFromCloset.mutateAsync({
        groupId,
        masterItemIds: Array.from(selectedIds),
      });
      toast({
        title: "Items added to trip",
        description: `${result.added} item(s) added successfully.`,
      });
      setOpen(false);
      setStep("select-items");
      setSelectedIds(new Set());
    } catch {
      toast({ title: "Error", description: "Failed to add items to trip.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setStep("select-items");
        setSelectedIds(new Set());
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-add-to-trip">
          <MapPin className="w-4 h-4 mr-2" />
          Add to Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "select-items" ? `Select ${category === 'gear' ? 'Gear' : 'Clothing'} Items` : "Choose a Trip"}
          </DialogTitle>
        </DialogHeader>

        {step === "select-items" ? (
          <>
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No {category} items in your closet yet.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={handleSelectAll}
                    data-testid="button-select-all-trip"
                  >
                    {selectedIds.size === filteredItems.length ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                </div>
                <ScrollArea className="max-h-[350px] pr-3">
                  <div className="space-y-4">
                    {Object.entries(groupedItems).map(([type, items]) => (
                      <div key={type}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{type}</h4>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              data-testid={`checkbox-trip-item-${item.id}`}
                            >
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={() => handleToggle(item.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">{item.name}</span>
                                  {item.brand && (
                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.brand}</span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatWeightUnit(item.weightGrams).value} {formatWeightUnit(item.weightGrams).unit}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  className="w-full mt-2"
                  disabled={selectedIds.size === 0}
                  onClick={() => setStep("select-trip")}
                  data-testid="button-next-select-trip"
                >
                  Next: Choose Trip ({selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""})
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            {groupsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading your trips...</div>
            ) : !groups || groups.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                You don't have any trips yet. Create a trip first from the dashboard.
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handleAddToTrip(group.id)}
                    disabled={addFromCloset.isPending}
                    data-testid={`button-trip-${group.id}`}
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{group.name}</div>
                      {group.location && (
                        <div className="text-xs text-muted-foreground">{group.location}</div>
                      )}
                    </div>
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setStep("select-items")}
                  data-testid="button-back-to-items"
                >
                  Back to item selection
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddMasterItemDialog({ category }: { category: "gear" | "clothing" }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const createItem = useCreateMasterItem();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    brand: "",
    model: "",
    quantity: "1",
    weightGrams: "0",
    price: "0"
  });

  const filteredCatalog = useMemo(() => {
    return GEAR_CATALOG.filter(item => item.category === category);
  }, [category]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, typeof GEAR_CATALOG> = {};
    filteredCatalog.forEach(item => {
      const type = item.type || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  }, [filteredCatalog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem.mutateAsync({
        category,
        name: formData.name,
        type: formData.type || null,
        brand: formData.brand || null,
        model: formData.model || null,
        quantity: parseInt(formData.quantity) || 1,
        weightGrams: parseInt(formData.weightGrams) || 0,
        price: Math.round(parseFloat(formData.price) * 100)
      });
      toast({ title: "Item added to your gear closet" });
      setOpen(false);
      setFormData({ name: "", type: "", brand: "", model: "", quantity: "1", weightGrams: "0", price: "0" });
    } catch {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-master-item">
          <Plus className="w-4 h-4 mr-2" />
          Add {category === 'gear' ? 'Gear' : 'Clothing'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add to {category === 'gear' ? 'Gear' : 'Clothing'} Closet</DialogTitle>
            <PhotoCaptureButton
              category={category}
              onItemAnalyzed={(item) => {
                setFormData({
                  ...formData,
                  name: item.name,
                  type: item.type,
                  brand: item.brand || "",
                  model: item.model || "",
                  weightGrams: item.estimatedWeightGrams.toString(),
                  price: (item.estimatedPrice / 100).toFixed(2)
                });
              }}
            />
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Item Name</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  {formData.name || "Select or type item..."}
                  <Search className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 bg-background border shadow-md" align="start">
                <Command className="bg-background">
                  <CommandInput placeholder="Search catalog..." />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty>No item found.</CommandEmpty>
                    {Object.entries(groupedCatalog).map(([type, items]) => (
                      <CommandGroup key={type} heading={type}>
                        {items.map((item) => (
                          <CommandItem
                            key={item.name}
                            value={item.name}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                name: item.name,
                                type: item.type || "",
                                weightGrams: item.weightGrams.toString()
                              });
                              setSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.name === item.name ? "opacity-100" : "opacity-0")} />
                            {item.name} ({item.weightGrams}g)
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Or type custom name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Input
              placeholder="e.g. Sleep System, Footwear"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                placeholder="e.g. Osprey"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                data-testid="input-brand"
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                placeholder="e.g. Exos 58"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                data-testid="input-model"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                data-testid="input-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (g)</Label>
              <Input
                type="number"
                min="0"
                value={formData.weightGrams}
                onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                data-testid="input-weight"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              data-testid="input-price"
            />
          </div>

          <Button type="submit" className="w-full" disabled={createItem.isPending}>
            {createItem.isPending ? "Adding..." : "Add to Closet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MasterChecklistManager() {
  const [editingItem, setEditingItem] = useState<MasterChecklistItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemScope, setNewItemScope] = useState<"individual" | "group">("individual");
  const [newItemCategory, setNewItemCategory] = useState<"gear" | "clothing" | "food">("gear");
  const [newItemIsEssential, setNewItemIsEssential] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const { data: masterChecklistItems = [], isLoading } = useQuery<MasterChecklistItem[]>({
    queryKey: ['/api/master-checklist'],
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

  const createItemMutation = useMutation({
    mutationFn: async (item: { name: string; scope: string; category: string; gearCategory: string; isEssential: boolean }) => {
      return apiRequest('POST', '/api/master-checklist', item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-checklist'] });
      setNewItemName("");
      setShowAddForm(false);
      toast({ title: "Item added" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<MasterChecklistItem> }) => {
      return apiRequest('PATCH', `/api/master-checklist/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-checklist'] });
      setEditingItem(null);
      toast({ title: "Item updated" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/master-checklist/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/master-checklist'] });
      toast({ title: "Item deleted" });
    },
  });

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    createItemMutation.mutate({
      name: newItemName.trim(),
      scope: newItemScope,
      category: newItemCategory,
      gearCategory: newItemCategory,
      isEssential: newItemIsEssential,
    });
  };

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, { essential: MasterChecklistItem[]; optional: MasterChecklistItem[] }> = {
      gear: { essential: [], optional: [] },
      clothing: { essential: [], optional: [] },
      food: { essential: [], optional: [] },
    };
    masterChecklistItems.forEach(item => {
      const cat = item.gearCategory || 'gear';
      if (groups[cat]) {
        if (item.isEssential) {
          groups[cat].essential.push(item);
        } else {
          groups[cat].optional.push(item);
        }
      }
    });
    return groups;
  }, [masterChecklistItems]);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading checklist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">Pre-Trip Checklist</h3>
          <p className="text-sm text-muted-foreground">Items to remind you before each trip</p>
        </div>
        <div className="flex gap-2">
          {masterChecklistItems.length === 0 && (
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              data-testid="button-seed-checklist"
            >
              <Download className="w-4 h-4 mr-2" />
              Load Defaults
            </Button>
          )}
          <Button onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-checklist-item">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              data-testid="input-new-checklist-item-name"
            />
            <div className="flex gap-2 flex-wrap">
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as "gear" | "clothing" | "food")}
                data-testid="select-new-checklist-item-category"
              >
                <option value="gear">Gear</option>
                <option value="clothing">Clothing</option>
                <option value="food">Food</option>
              </select>
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={newItemScope}
                onChange={(e) => setNewItemScope(e.target.value as "individual" | "group")}
                data-testid="select-new-checklist-item-scope"
              >
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={newItemIsEssential ? "essential" : "optional"}
                onChange={(e) => setNewItemIsEssential(e.target.value === "essential")}
              >
                <option value="essential">Essential</option>
                <option value="optional">Optional</option>
              </select>
              <Button size="sm" onClick={handleAddItem} disabled={createItemMutation.isPending}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {masterChecklistItems.length === 0 ? (
        <div className="text-center py-12 bg-white/50 dark:bg-card/50 rounded-2xl border border-dashed">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No checklist items yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Load Defaults" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([cat, items]) => {
            const allItems = [...items.essential, ...items.optional];
            if (allItems.length === 0) return null;
            
            return (
              <div key={cat}>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  {cat === 'gear' && <Backpack className="w-4 h-4" />}
                  {cat === 'clothing' && <Shirt className="w-4 h-4" />}
                  {cat === 'food' && <span>🍽️</span>}
                  {cat}
                </h4>
                
                {items.essential.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-2">Essential</div>
                    <div className="grid gap-2">
                      {items.essential.map((item) => (
                        <ChecklistItemRow 
                          key={item.id} 
                          item={item} 
                          editingItem={editingItem}
                          setEditingItem={setEditingItem}
                          updateItemMutation={updateItemMutation}
                          deleteItemMutation={deleteItemMutation}
                          variant="essential"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {items.optional.length > 0 && (
                  <div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">Optional</div>
                    <div className="grid gap-2">
                      {items.optional.map((item) => (
                        <ChecklistItemRow 
                          key={item.id} 
                          item={item}
                          editingItem={editingItem}
                          setEditingItem={setEditingItem}
                          updateItemMutation={updateItemMutation}
                          deleteItemMutation={deleteItemMutation}
                          variant="optional"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChecklistItemRow({ 
  item, 
  editingItem, 
  setEditingItem, 
  updateItemMutation, 
  deleteItemMutation,
  variant 
}: { 
  item: MasterChecklistItem;
  editingItem: MasterChecklistItem | null;
  setEditingItem: (item: MasterChecklistItem | null) => void;
  updateItemMutation: any;
  deleteItemMutation: any;
  variant: 'essential' | 'optional';
}) {
  const bgClass = variant === 'essential' 
    ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/50 dark:border-teal-800/50'
    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/50';

  if (editingItem?.id === item.id) {
    return (
      <Card className={cn("border", bgClass)}>
        <CardContent className="p-3 flex items-center gap-2">
          <Input
            value={editingItem.name}
            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
            className="h-8 flex-1"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateItemMutation.mutate({ id: item.id, updates: { name: editingItem.name } })}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("group border", bgClass)}>
      <CardContent className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{item.name}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex-shrink-0">
            {item.scope}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditingItem(item)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => deleteItemMutation.mutate(item.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
