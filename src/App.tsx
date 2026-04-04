import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Vendas from "./pages/Vendas";
import Marketing from "./pages/Marketing";
import Gestao from "./pages/Gestao";
import Autoridade from "./pages/Autoridade";
import Configuracoes from "./pages/Configuracoes";
import Clinicas from "./pages/Clinicas";
import Usuarios from "./pages/Usuarios";
import Pacientes from "./pages/Pacientes";
import PacienteDetalhe from "./pages/PacienteDetalhe";
import Leads from "./pages/Leads";
import PerguntasDecisao from "./pages/vega/PerguntasDecisao";
import HoraClinica from "./pages/vega/HoraClinica";
import FunilVendas from "./pages/vendas/FunilVendas";
import MetasMensais from "./pages/gestao/MetasMensais";
import AgendaVega from "./pages/gestao/AgendaVega";
import FinancasVega from "./pages/gestao/FinancasVega";
import EquipeVega from "./pages/gestao/EquipeVega";
import FollowUpInteligente from "./pages/vendas/FollowUpInteligente";
import VegaGPS from "./pages/VegaGPS";
import InteligenciaVega from "./pages/InteligenciaVega";
import PlanejamentoConteudo from "./pages/marketing/PlanejamentoConteudo";
import LeadsOrigem from "./pages/marketing/LeadsOrigem";
import Campanhas from "./pages/marketing/Campanhas";
import SugestoesEstrategicas from "./pages/marketing/SugestoesEstrategicas";
import OrcamentoPublico from "./pages/OrcamentoPublico";
import AnamnesePublica from "./pages/AnamnesePublica";
import Academy from "./pages/Academy";
import Convite from "./pages/Convite";
import Financeiro from "./pages/Financeiro";
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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gps"
            element={
              <ProtectedRoute>
                <VegaGPS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inteligencia"
            element={
              <ProtectedRoute>
                <InteligenciaVega />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinicas"
            element={
              <ProtectedRoute>
                <Clinicas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute>
                <Pacientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacientes/:id"
            element={
              <ProtectedRoute>
                <PacienteDetalhe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <Leads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas"
            element={
              <ProtectedRoute>
                <Vendas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas/perguntas-decisao"
            element={
              <ProtectedRoute>
                <PerguntasDecisao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas/funil"
            element={
              <ProtectedRoute>
                <FunilVendas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendas/follow-up"
            element={
              <ProtectedRoute>
                <FollowUpInteligente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing"
            element={
              <ProtectedRoute>
                <Marketing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing/conteudo"
            element={
              <ProtectedRoute>
                <PlanejamentoConteudo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing/leads-origem"
            element={
              <ProtectedRoute>
                <LeadsOrigem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing/campanhas"
            element={
              <ProtectedRoute>
                <Campanhas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketing/sugestoes"
            element={
              <ProtectedRoute>
                <SugestoesEstrategicas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao"
            element={
              <ProtectedRoute>
                <Gestao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao/agenda"
            element={
              <ProtectedRoute>
                <AgendaVega />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao/hora-clinica"
            element={
              <ProtectedRoute>
                <HoraClinica />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao/metas"
            element={
              <ProtectedRoute>
                <MetasMensais />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao/financas"
            element={
              <ProtectedRoute>
                <FinancasVega />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestao/equipe"
            element={
              <ProtectedRoute>
                <EquipeVega />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <ProtectedRoute>
                <Financeiro />
              </ProtectedRoute>
            }
          />
          <Route
            path="/autoridade"
            element={
              <ProtectedRoute>
                <Autoridade />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            }
          />
          <Route path="/orcamento/:token" element={<OrcamentoPublico />} />
          <Route path="/anamnese/:token" element={<AnamnesePublica />} />
          <Route path="/convite/:token" element={<Convite />} />
          <Route
            path="/academy"
            element={
              <ProtectedRoute>
                <Academy />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
