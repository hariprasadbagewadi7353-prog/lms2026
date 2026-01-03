import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import Enroll from "@/pages/enroll";
import Dashboard from "@/pages/dashboard";
import RenewalReminders from "@/pages/renewal-reminders";
import AboutUs from "@/pages/about-us";
import NotFound from "@/pages/not-found";

function Router() {
  const isAuth = localStorage.getItem("libraryOwnerAuth");

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route
        path="/enroll"
        component={() => (isAuth ? <Enroll /> : <Login />)}
      />
      <Route
        path="/dashboard"
        component={() => (isAuth ? <Dashboard /> : <Login />)}
      />
      <Route
        path="/renewal-reminders"
        component={() => (isAuth ? <RenewalReminders /> : <Login />)}
      />
      <Route
        path="/about-us"
        component={() => (isAuth ? <AboutUs /> : <Login />)}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const isAuth = localStorage.getItem("libraryOwnerAuth");
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-auto p-8">
            <div className="mx-auto max-w-7xl">
              <Router />
            </div>
          </main>
          <AppFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
