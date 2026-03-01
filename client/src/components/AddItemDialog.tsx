import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Check } from "lucide-react";
import { useCreateItem } from "@/hooks/use-items";
import { useToast } from "@/hooks/use-toast";
import { GEAR_CATALOG } from "@shared/constants";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PhotoCaptureButton } from "./PhotoCaptureButton";

interface AddItemDialogProps {
  groupId: number;
  category: "gear" | "clothing" | "food";
  initialData?: {
    name?: string;
    type?: string;
    weightGrams?: number;
  };
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddItemDialog({ 
  groupId, 
  category, 
  initialData,
  externalOpen,
  onExternalOpenChange,
  trigger
}: AddItemDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (v: boolean) => onExternalOpenChange?.(v) : setInternalOpen;
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useToast();
  const createItem = useCreateItem(groupId);
  
  const getInitialFormData = () => ({
    name: initialData?.name || "",
    type: initialData?.type || "",
    brand: "",
    model: "",
    quantity: "1",
    weightGrams: initialData?.weightGrams?.toString() || "0",
    price: "0",
    isShared: false,
    isWorn: false,
    skipClosetSync: false
  });

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form when dialog opens with initial data
  useEffect(() => {
    if (open && initialData) {
      setFormData(getInitialFormData());
    }
  }, [open, initialData?.name, initialData?.type, initialData?.weightGrams]);

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
        type: formData.type || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        quantity: parseInt(formData.quantity) || 1,
        weightGrams: parseInt(formData.weightGrams) || 0,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        isShared: formData.isShared,
        isWorn: formData.isWorn,
        skipClosetSync: formData.skipClosetSync
      });
      
      toast({ title: "Item added", description: `${formData.name} added to your ${category} list.` });
      setOpen(false);
      setFormData({
        name: "",
        type: "",
        brand: "",
        model: "",
        quantity: "1",
        weightGrams: "0",
        price: "0",
        isShared: false,
        isWorn: false,
        skipClosetSync: false
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to add item. Please try again.", variant: "destructive" });
    }
  };

  // Update form when dialog opens with initial data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && initialData) {
      setFormData(getInitialFormData());
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto shadow-none">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background pb-2 z-10 mr-6">
          <div className="flex items-center gap-3">
            <DialogTitle className="flex-1">Add {category === 'gear' ? 'Gear' : category === 'clothing' ? 'Clothing' : 'Food'}</DialogTitle>
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
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <div className="flex gap-2">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="w-full justify-between font-normal"
                  >
                    {formData.name || "Select or type item..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-background border shadow-md" align="start">
                  <Command className="bg-background">
                    <CommandInput placeholder="Search catalog..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                      <CommandEmpty>No item found. Type to add custom.</CommandEmpty>
                      {Object.entries(groupedCatalog).map(([type, items]) => (
                        <CommandGroup key={type} heading={type}>
                          {items.map((item) => (
                            <CommandItem
                              key={item.name}
                              value={item.name}
                              onSelect={(currentValue) => {
                                const selected = filteredCatalog.find(i => i.name === currentValue);
                                if (selected) {
                                  setFormData({
                                    ...formData,
                                    name: selected.name,
                                    type: selected.type,
                                    weightGrams: selected.weightGrams.toString()
                                  });
                                }
                                setSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.name === item.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.name} ({item.weightGrams}g)
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Input 
              id="name" 
              placeholder="Or type custom name..." 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input 
              id="type" 
              placeholder="e.g. Sleep System, Outerwear" 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input 
                id="brand" 
                placeholder="e.g. Osprey"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                data-testid="input-brand"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input 
                id="model" 
                placeholder="e.g. Exos 58"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                data-testid="input-model"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required 
                data-testid="input-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (g)</Label>
              <Input 
                id="weight" 
                type="number" 
                min="0"
                value={formData.weightGrams}
                onChange={(e) => setFormData({...formData, weightGrams: e.target.value})}
                data-testid="input-weight"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input 
              id="price" 
              type="number" 
              min="0" 
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              data-testid="input-price"
            />
          </div>

          {category !== 'clothing' && (
            <div className="flex items-center justify-between rounded-lg border p-2 bg-muted/30">
              <div>
                <Label className="text-sm">Shared Item</Label>
                <p className="text-xs text-muted-foreground">For the whole group?</p>
              </div>
              <Switch 
                checked={formData.isShared}
                onCheckedChange={(checked) => setFormData({...formData, isShared: checked})}
                data-testid="switch-shared"
              />
            </div>
          )}

          {(category === 'gear' || category === 'clothing') && (
            <div className="flex items-center justify-between rounded-lg border p-2 bg-muted/30">
              <div>
                <Label className="text-sm">Worn Item</Label>
                <p className="text-xs text-muted-foreground">Worn (not in pack)?</p>
              </div>
              <Switch 
                checked={formData.isWorn}
                onCheckedChange={(checked) => setFormData({...formData, isWorn: checked})}
                data-testid="switch-worn"
              />
            </div>
          )}

          {(category === 'gear' || category === 'clothing') && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                id="skipClosetSync"
                checked={formData.skipClosetSync}
                onCheckedChange={(checked) => setFormData({...formData, skipClosetSync: checked as boolean})}
                data-testid="checkbox-skip-closet"
              />
              <label htmlFor="skipClosetSync" className="cursor-pointer">
                Don't save to my gear closet
              </label>
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={createItem.isPending}>
            {createItem.isPending ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
