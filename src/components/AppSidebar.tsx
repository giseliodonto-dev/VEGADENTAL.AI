import {
  Home, CalendarCheck, Compass, TrendingUp, Contact,
  Wallet, Settings, LogOut, FileText, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import vegaLogo from "@/assets/vega-logo.svg";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarCounters } from "@/hooks/useSidebarCounters";
import { SidebarCountBadge } from "@/components/SidebarCountBadge";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ICON = "h-[18px] w-[18px] shrink-0";
const STROKE = 1.5;

const itemClasses = cn(
  "relative h-10 px-3 gap-3 rounded-lg text-sidebar-foreground transition-colors duration-200",
  "hover:bg-sidebar-accent/15 hover:text-white",
  "data-[active=true]:bg-sidebar-accent/20 data-[active=true]:text-white",
  "data-[active=true]:before:content-[''] data-[active=true]:before:absolute",
  "data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5",
  "data-[active=true]:before:w-[2px] data-[active=true]:before:rounded-r data-[active=true]:before:bg-gold",
);

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const { agenda, vendas, gpsAlerts } = useSidebarCounters();

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  const patientsBranchActive =
    pathname.startsWith("/pacientes") || pathname.startsWith("/documentos");
  const [patientsOpen, setPatientsOpen] = useState(patientsBranchActive);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={vegaLogo} alt="VEGA Dental AI" className="h-9 w-9 shrink-0" />
          {!collapsed && <span className="font-display font-bold text-sidebar-primary tracking-tight">VEGA Dental AI</span>}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu className="space-y-1.5">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/")} className={itemClasses} tooltip="Início">
                <NavLink to="/"><Home className={ICON} strokeWidth={STROKE} />{!collapsed && <span>Início</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/gestao/agenda")} className={itemClasses} tooltip="Agenda">
                <NavLink to="/gestao/agenda">
                  <CalendarCheck className={ICON} strokeWidth={STROKE} />
                  {!collapsed && <span>Agenda</span>}
                  <SidebarCountBadge count={agenda} collapsed={collapsed} />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/gps")} className={itemClasses} tooltip="GPS">
                <NavLink to="/gps" className="relative">
                  <Compass className={ICON} strokeWidth={STROKE} />
                  {!collapsed && <span>GPS</span>}
                  <SidebarCountBadge count={gpsAlerts} variant="alert" collapsed={collapsed} />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/vendas")} className={itemClasses} tooltip="Vendas">
                <NavLink to="/vendas">
                  <TrendingUp className={ICON} strokeWidth={STROKE} />
                  {!collapsed && <span>Vendas</span>}
                  <SidebarCountBadge count={vendas} collapsed={collapsed} />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Pacientes + sub-item Documentos */}
            <Collapsible open={collapsed ? false : patientsOpen} onOpenChange={setPatientsOpen} asChild>
              <SidebarMenuItem>
                <div className="flex items-center">
                  <SidebarMenuButton asChild isActive={isActive("/pacientes")} className={cn(itemClasses, "flex-1")} tooltip="Pacientes">
                    <NavLink to="/pacientes">
                      <Contact className={ICON} strokeWidth={STROKE} />
                      {!collapsed && <span>Pacientes</span>}
                    </NavLink>
                  </SidebarMenuButton>
                  {!collapsed && (
                    <CollapsibleTrigger
                      className="ml-1 grid h-7 w-7 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/15 hover:text-white"
                      aria-label="Expandir Pacientes"
                    >
                      <ChevronRight
                        className={cn("h-4 w-4 transition-transform", patientsOpen && "rotate-90")}
                        strokeWidth={STROKE}
                      />
                    </CollapsibleTrigger>
                  )}
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-4 mt-1 border-l border-sidebar-border/60 pl-2">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isActive("/documentos")}
                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent/15 hover:text-white data-[active=true]:bg-sidebar-accent/20 data-[active=true]:text-white">
                        <NavLink to="/documentos">
                          <FileText className="h-4 w-4" strokeWidth={STROKE} />
                          <span>Documentos</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/financeiro")} className={itemClasses} tooltip="Financeiro">
                <NavLink to="/financeiro"><Wallet className={ICON} strokeWidth={STROKE} />{!collapsed && <span>Financeiro</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/configuracoes")} className={itemClasses} tooltip="Configurações">
                <NavLink to="/configuracoes"><Settings className={ICON} strokeWidth={STROKE} />{!collapsed && <span>Configurações</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate("/auth"); }}
              tooltip="Sair"
              className="h-10 px-3 gap-3 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive"
            >
              <LogOut className={ICON} strokeWidth={STROKE} />{!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
