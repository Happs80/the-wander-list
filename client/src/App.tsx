import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Tent } from "lucide-react";

import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import GroupView from "@/pages/GroupView";
import MyGear from "@/pages/MyGear";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { ProfileCompleteDialog } from "@/components/ProfileCompleteDialog";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Tent className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Adventure Awaits</h2>
        <p className="text-muted-foreground mb-6">Please log in to access your dashboard and groups.</p>
        <Button onClick={() => window.location.href = "/api/login"}>
          Log In to Continue
        </Button>
      </div>
    );
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/groups/:id">
        <ProtectedRoute component={GroupView} />
      </Route>
      <Route path="/my-gear">
        <ProtectedRoute component={MyGear} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <ProfileCompleteDialog />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
