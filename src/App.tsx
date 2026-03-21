import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import CadastroPaciente from "./pages/CadastroPaciente";
import Home from "./pages/Home";
import Vendas from "./pages/Vendas";
import Marketing from "./pages/Marketing";
import Gestao from "./pages/Gestao";
import Autoridade from "./pages/Autoridade";
import Configuracoes from "./pages/Configuracoes";
import Clinicas from "./pages/Clinicas";
import Usuarios from "./pages/Usuarios";
import Pacientes from "./pages/Pacientes";
import Leads from "./pages/Leads";
import PerguntasDecisao from "./pages/vega/PerguntasDecisao";
import HoraClinica from "./pages/vega/HoraClinica";
import FunilVendas from "./pages/vendas/FunilVendas";
import FollowUpInteligente from "./pages/vendas/FollowUpInteligente";
import VegaGPS from "./pages/VegaGPS";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/gps" element={<ProtectedRoute><VegaGPS /></ProtectedRoute>} />
          <Route path="/cadastro-paciente" element={<ProtectedRoute><CadastroPaciente /></ProtectedRoute>} />
          <Route path="/clinicas" element={<ProtectedRoute><Clinicas /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
          <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
          <Route path="/vendas/perguntas-decisao" element={<ProtectedRoute><PerguntasDecisao /></ProtectedRoute>} />
          <Route path="/vendas/funil" element={<ProtectedRoute><FunilVendas /></ProtectedRoute>} />
          <Route path="/vendas/follow-up" element={<ProtectedRoute><FollowUpInteligente /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
          <Route path="/gestao" element={<ProtectedRoute><Gestao /></ProtectedRoute>} />
          <Route path="/gestao/hora-clinica" element={<ProtectedRoute><HoraClinica /></ProtectedRoute>} />
          <Route path="/autoridade" element={<ProtectedRoute><Autoridade /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
