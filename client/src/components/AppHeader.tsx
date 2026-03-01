import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tent, User, LayoutDashboard } from "lucide-react";

export function AppHeader({ wrapped = false }: { wrapped?: boolean }) {
  const content = (
    <div className="py-3 flex items-center justify-between">
      <Link href="/">
        <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Tent className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">The Wander List</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="secondary" size="icon" className="sm:w-auto sm:px-4 sm:gap-2" data-testid="link-dashboard-header">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Your Dashboard</span>
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="link-profile-header">
            <User className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );

  if (wrapped) {
    return content;
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {content}
      </div>
    </header>
  );
}
