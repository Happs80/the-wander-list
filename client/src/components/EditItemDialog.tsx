import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateItem } from "@/hooks/use-items";
import { useCreateMasterItem } from "@/hooks/use-master-items";
import { useToast } from "@/hooks/use-toast";
import { TbHanger } from "react-icons/tb";
import type { Item } from "@shared/schema";

interface EditItemDialogProps {
  item: Item;
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, groupId, open, onOpenChange }: EditItemDialogProps) {
  const { toast } = useToast();
  const updateItem = useUpdateItem(groupId);
  const createMasterItem = useCreateMasterItem();
  
  const [formData, setFormData] = useState({
    name: item.name,
    type: item.type || "",
    brand: item.brand || "",
    model: item.model || "",
    quantity: String(item.quantity),
    weightGrams: String(item.weightGrams),
    price: String((item.price / 100).toFixed(2)),
    isShared: item.isShared ?? false,
    isWorn: item.isWorn ?? false
  });

  useEffect(() => {
    setFormData({
      name: item.name,
      type: item.type || "",
      brand: item.brand || "",
      model: item.model || "",
      quantity: String(item.quantity),
      weightGrams: String(item.weightGrams),
      price: String((item.price / 100).toFixed(2)),
      isShared: item.isShared ?? false,
      isWorn: item.isWorn ?? false
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceValue = parseFloat(formData.price);
      await updateItem.mutateAsync({
        id: item.id,
        name: formData.name,
        type: formData.type || undefined,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        quantity: parseInt(formData.quantity) || 1,
        weightGrams: parseInt(formData.weightGrams) || 0,
        price: isNaN(priceValue) ? 0 : Math.round(priceValue * 100),
        isShared: formData.isShared,
        isWorn: formData.isWorn
      });
      
      toast({ title: "Item updated", description: `${formData.name} has been updated.` });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update item. Please try again.", variant: "destructive" });
    }
  };

  const handleSaveToCloset = async () => {
    if (item.category !== 'gear' && item.category !== 'clothing') {
      toast({ title: "Not applicable", description: "Only gear and clothing can be saved to your closet.", variant: "destructive" });
      return;
    }
    
    try {
      const priceValue = parseFloat(formData.price);
      await createMasterItem.mutateAsync({
        category: item.category as 'gear' | 'clothing',
        type: formData.type || null,
        name: formData.name,
        brand: formData.brand || null,
        model: formData.model || null,
        quantity: parseInt(formData.quantity) || 1,
        weightGrams: parseInt(formData.weightGrams) || 0,
        price: isNaN(priceValue) ? 0 : Math.round(priceValue * 100),
      });
      
      toast({ title: "Saved to closet", description: `${formData.name} has been added to your gear closet.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save to closet. It may already exist.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Item Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              data-testid="input-edit-item-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Input
                id="edit-type"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                placeholder="e.g. Tent, Jacket"
                data-testid="input-edit-item-type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                placeholder="e.g. Osprey"
                data-testid="input-edit-item-brand"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-model">Model</Label>
            <Input
              id="edit-model"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              placeholder="e.g. Exos 48"
              data-testid="input-edit-item-model"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Qty</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                data-testid="input-edit-item-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Weight (g)</Label>
              <Input
                id="edit-weight"
                type="number"
                min="0"
                value={formData.weightGrams}
                onChange={(e) => setFormData({...formData, weightGrams: e.target.value})}
                data-testid="input-edit-item-weight"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                data-testid="input-edit-item-price"
              />
            </div>
          </div>

          {item.category !== 'clothing' && (
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="edit-shared" className="cursor-pointer">Share with group</Label>
              <Switch
                id="edit-shared"
                checked={formData.isShared}
                onCheckedChange={(checked) => setFormData({...formData, isShared: checked})}
                data-testid="switch-edit-item-shared"
              />
            </div>
          )}

          {(item.category === 'gear' || item.category === 'clothing') && (
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-worn" className="cursor-pointer">Worn item</Label>
              <Switch
                id="edit-worn"
                checked={formData.isWorn}
                onCheckedChange={(checked) => setFormData({...formData, isWorn: checked})}
                data-testid="switch-edit-item-worn"
              />
            </div>
          )}

          {(item.category === 'gear' || item.category === 'clothing') && (
            <div className="pt-2 border-t">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full gap-2 text-muted-foreground"
                onClick={handleSaveToCloset}
                disabled={createMasterItem.isPending}
                data-testid="button-save-to-closet"
              >
                <TbHanger className="w-4 h-4" />
                {createMasterItem.isPending ? "Saving..." : "Save to My Gear Closet"}
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={updateItem.isPending} data-testid="button-save-item">
              {updateItem.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
