import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Mountain, LogIn, LayoutDashboard, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import heroImage from "@assets/hero-background.jpg";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const { data: groups } = useQuery({
    queryKey: ['/api/groups'],
    enabled: isAuthenticated,
  });
  
  const hasTrips = groups && Array.isArray(groups) && groups.length > 0;
  const ctaText = hasTrips ? "Continue your journey" : "Start your first trip";

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background grainy flex flex-col">
      {/* Hero Section */}
      <header className="relative overflow-hidden min-h-screen">
        {/* Hero background image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 z-0 bg-black/40" />
        
        <div className="relative z-10 container mx-auto px-4 py-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Mountain className="w-8 h-8 text-white" />
            <span className="font-display text-xl font-bold text-white">The Wander List</span>
          </div>
          
          {isAuthenticated ? (
             <div className="flex items-center gap-4">
               <span className="text-sm font-medium hidden sm:block text-white">Hi {user?.nickname || user?.firstName || 'there'}</span>
               <div className="flex items-center gap-2">
                 <Link href="/dashboard">
                   <Button variant="secondary" className="gap-2">
                     <LayoutDashboard className="w-4 h-4" />
                     Your Dashboard
                   </Button>
                 </Link>
                 <Link href="/profile">
                   <Button variant="secondary" size="icon" data-testid="link-profile-home">
                     <User className="w-5 h-5" />
                   </Button>
                 </Link>
               </div>
             </div>
          ) : (
             <Button variant="secondary" onClick={() => window.location.href = '/api/login'}>
               <LogIn className="w-4 h-4 mr-2" />
               Log In
             </Button>
          )}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32 max-w-4xl text-center flex flex-col justify-center min-h-[60vh]">
          {/* Big Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
              <Mountain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-2 leading-[1.1] tracking-tight drop-shadow-lg">
              The Wander List
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              Your Adventure Planner
            </p>
          </div>
          
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            The adventure planning tool for you and your friends. Coordinate gear, manage weight, and plan your itinerary all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90" data-testid="button-start-trip-cta">
                  {ctaText}
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90" onClick={() => window.location.href = '/api/login'}>
                Start Planning
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
