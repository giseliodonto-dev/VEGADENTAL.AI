import {
  Home, TrendingUp, Megaphone, BarChart3, Crown,
  Settings, LogOut, Contact, Compass, Brain,
  CalendarCheck, GraduationCap, Wallet, Users, Sparkles, FileText, Mail
} from "lucide-react";
import vegaLogo from "@/assets/vega-logo.svg";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={vegaLogo} alt="VEGA Dental AI" className="h-9 w-9 shrink-0" />
          {!collapsed && <span className="font-bold text-sidebar-primary">VEGA Dental AI</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/"><Home className="h-4 w-4" />{!collapsed && <span>Início</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/pacientes"><Contact className="h-4 w-4 text-vendas" />{!collapsed && <span>Pacientes</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/gestao/agenda"><CalendarCheck className="h-4 w-4 text-gestao" />{!collapsed && <span>Agenda</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/gestao/equipe"><Users className="h-4 w-4 text-primary" />{!collapsed && <span>Equipe</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/financeiro"><Wallet className="h-4 w-4 text-gestao" />{!collapsed && <span>Financeiro</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/documentos"><FileText className="h-4 w-4 text-primary" />{!collapsed && <span>Documentos</span>}</NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <div className="mx-4 h-px bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest px-4">Estratégico</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/vendas"><TrendingUp className="h-4 w-4 text-vendas" />{!collapsed && <span>Vendas</span>}</NavLink></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/marketing"><Megaphone className="h-4 w-4 text-marketing" />{!collapsed && <span>Marketing</span>}</NavLink></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/gps"><Compass className="h-4 w-4 text-vendas" />{!collapsed && <span>GPS</span>}</NavLink></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/mentora"><Sparkles className="h-4 w-4 text-gold" />{!collapsed && <span>Mentor de IA</span>}</NavLink></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/admin/waitlist"><Mail className="h-4 w-4 text-primary" />{!collapsed && <span>Lista de Espera</span>}</NavLink></SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild><NavLink to="/configuracoes"><Settings className="h-4 w-4" />{!collapsed && <span>Configurações</span>}</NavLink></SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={async () => { await signOut(); navigate("/auth"); }} className="text-destructive">
              <LogOut className="h-4 w-4" />{!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
