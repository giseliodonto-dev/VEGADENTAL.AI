import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center bg-card/80 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-10 border-b-0"
            style={{ borderBottom: "1px solid transparent", borderImage: "linear-gradient(90deg, hsl(var(--border)), hsl(var(--border) / 0.3), transparent) 1" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {title && (
                <div>
                  <h1 className="text-sm font-semibold text-foreground font-display">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-[11px] text-muted-foreground -mt-0.5">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
