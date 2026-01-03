import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      <ThemeToggle />
    </header>
  );
}
