import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";

export function ProfileCompleteDialog() {
  const { user, isLoading } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nickname: "",
    mobileNumber: ""
  });

  useEffect(() => {
    if (!isLoading && user && !user.nickname) {
      setOpen(true);
      setFormData({
        nickname: user.firstName || "",
        mobileNumber: user.mobileNumber || ""
      });
    }
  }, [user, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nickname.trim()) {
      toast({ title: "Error", description: "Nickname is required.", variant: "destructive" });
      return;
    }
    try {
      await updateProfile.mutateAsync({
        nickname: formData.nickname,
        mobileNumber: formData.mobileNumber || undefined
      });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      setOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Choose a nickname so your group members can recognize you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname *</Label>
            <Input 
              id="nickname" 
              placeholder="How should we call you?"
              value={formData.nickname}
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              required
              data-testid="input-profile-nickname"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number (optional)</Label>
            <Input 
              id="mobileNumber" 
              type="tel"
              placeholder="+1 555 123 4567"
              value={formData.mobileNumber}
              onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
              data-testid="input-profile-mobile"
            />
          </div>

          <Button type="submit" className="w-full" disabled={updateProfile.isPending} data-testid="button-save-profile">
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
