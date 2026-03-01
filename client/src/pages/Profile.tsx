import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Trash2, Loader2, Settings, Ruler, Calendar } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    nickname: "",
    mobileNumber: "",
    unitSystem: "metric",
    dateFormat: "DD-MM-YYYY",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || "",
        mobileNumber: user.mobileNumber || "",
        unitSystem: user.unitSystem || "metric",
        dateFormat: user.dateFormat || "DD-MM-YYYY",
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nickname.trim()) {
      toast({ title: "Error", description: "Nickname is required.", variant: "destructive" });
      return;
    }
    try {
      await updateProfile.mutateAsync({
        nickname: formData.nickname,
        mobileNumber: formData.mobileNumber || undefined,
        unitSystem: formData.unitSystem,
        dateFormat: formData.dateFormat,
      });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast({ title: "Account deleted", description: "Your account has been removed." });
        window.location.href = "/";
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
    }
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grainy">
      <AppHeader />
      <div className="p-4 md:p-8">
        <div className="max-w-lg mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm">Manage your account settings</p>
          </div>

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Details
            </CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname *</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Your display name"
                  required
                  data-testid="input-nickname"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number (optional)</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+1 555 123 4567"
                  data-testid="input-mobile"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email is managed by your login provider</p>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Preferences</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                      Units
                    </Label>
                    <div className="flex rounded-xl border-2 border-input overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 ${
                          formData.unitSystem === "metric"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => setFormData({ ...formData, unitSystem: "metric" })}
                        data-testid="button-unit-metric"
                      >
                        Metric (kg, km)
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 ${
                          formData.unitSystem === "imperial"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => setFormData({ ...formData, unitSystem: "imperial" })}
                        data-testid="button-unit-imperial"
                      >
                        Imperial (lb, mi)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      Date Format
                    </Label>
                    <div className="flex rounded-xl border-2 border-input overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 ${
                          formData.dateFormat === "DD-MM-YYYY"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => setFormData({ ...formData, dateFormat: "DD-MM-YYYY" })}
                        data-testid="button-date-dmy"
                      >
                        DD-MM-YYYY
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 ${
                          formData.dateFormat === "MM-DD-YYYY"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={() => setFormData({ ...formData, dateFormat: "MM-DD-YYYY" })}
                        data-testid="button-date-mdy"
                      >
                        MM-DD-YYYY
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateProfile.isPending} data-testid="button-save">
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" data-testid="button-delete-account">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleDeleteAccount} data-testid="button-confirm-delete">
                    Delete Forever
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
