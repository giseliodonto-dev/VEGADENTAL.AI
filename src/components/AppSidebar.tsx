import {
  Home,
  UserPlus,
  TrendingUp,
  Megaphone,
  BarChart3,
  Crown,
  Settings,
  Zap,
  LogOut,
  Building2,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const pillarItems = [
  { title: "Vendas", url: "/vendas", icon: TrendingUp, color: "text-vendas" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, color: "text-marketing" },
  { title: "Gestão", url: "/gestao", icon: BarChart3, color: "text-gestao" },
  { title: "Autoridade", url: "/autoridade", icon: Crown, color: "text-autoridade" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { role } = useClinic();
  const isDono = role === "dono";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vendas">
            <Zap className="h-5 w-5 text-vendas-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-slide-in">
              <p className="text-sm font-bold text-sidebar-primary font-display">
                VEGA Dental AI
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 tracking-wide">
                Inteligência Estratégica
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className="transition-colors duration-150"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  >
                    <Home className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Início</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isDono && <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/usuarios"
                    className="transition-colors duration-150"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  >
                    <Users className="h-4 w-4 shrink-0 text-primary" />
                    {!collapsed && <span>Usuários</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/cadastro-paciente"
                    className="transition-colors duration-150"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  >
                    <UserPlus className="h-4 w-4 shrink-0 text-vendas" />
                    {!collapsed && <span>Cadastro Rápido</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/clinicas"
                    className="transition-colors duration-150"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-gestao" />
                    {!collapsed && <span>Clínicas</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-medium">
            Pilares Estratégicos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pillarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="transition-colors duration-150"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/configuracoes"
                className="transition-colors duration-150"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate("/auth"); }}
              className="text-sidebar-foreground/60 hover:text-destructive transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
