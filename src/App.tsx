import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import PacienteDetalhe from "./pages/PacienteDetalhe";
import Vendas from "./pages/Vendas";
import Marketing from "./pages/Marketing";
import Financeiro from "./pages/Financeiro";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import Convite from "./pages/Convite";
import NotFound from "./pages/NotFound";
import VegaGPS from "./pages/VegaGPS";
import Gestao from "./pages/Gestao";
import Leads from "./pages/Leads";
import Clinicas from "./pages/Clinicas";
import Academy from "./pages/Academy";
import InteligenciaVega from "./pages/InteligenciaVega";
import IAVendasNEPQ from "./pages/IAVendasNEPQ";
import BancoRoteiros from "./pages/BancoRoteiros";
import Autoridade from "./pages/Autoridade";
import RadarLucro from "./pages/RadarLucro";
import CalculadoraSobrevivencia from "./pages/CalculadoraSobrevivencia";
import AnamnesePublica from "./pages/AnamnesePublica";
import OrcamentoPublico from "./pages/OrcamentoPublico";

import AgendaVega from "./pages/gestao/AgendaVega";
import EquipeVega from "./pages/gestao/EquipeVega";
import FinancasVega from "./pages/gestao/FinancasVega";
import MetasMensais from "./pages/gestao/MetasMensais";

import FunilVendas from "./pages/vendas/FunilVendas";
import FollowUpInteligente from "./pages/vendas/FollowUpInteligente";

import Campanhas from "./pages/marketing/Campanhas";
import LeadsOrigem from "./pages/marketing/LeadsOrigem";
import PlanejamentoConteudo from "./pages/marketing/PlanejamentoConteudo";
import SugestoesEstrategicas from "./pages/marketing/SugestoesEstrategicas";

import HoraClinica from "./pages/vega/HoraClinica";
import PerguntasDecisao from "./pages/vega/PerguntasDecisao";

import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/convite/:token" element={<Convite />} />
            <Route path="/anamnese/:token" element={<AnamnesePublica />} />
            <Route path="/orcamento/:token" element={<OrcamentoPublico />} />

            {/* Protected */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
            <Route path="/pacientes/:id" element={<ProtectedRoute><PacienteDetalhe /></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="/gps" element={<ProtectedRoute><VegaGPS /></ProtectedRoute>} />
            <Route path="/gestao" element={<ProtectedRoute><Gestao /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/clinicas" element={<ProtectedRoute><Clinicas /></ProtectedRoute>} />
            <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
            <Route path="/inteligencia" element={<ProtectedRoute><InteligenciaVega /></ProtectedRoute>} />
            <Route path="/ia-vendas" element={<ProtectedRoute><IAVendasNEPQ /></ProtectedRoute>} />
            <Route path="/roteiros" element={<ProtectedRoute><BancoRoteiros /></ProtectedRoute>} />
            <Route path="/autoridade" element={<ProtectedRoute><Autoridade /></ProtectedRoute>} />
            <Route path="/radar-lucro" element={<ProtectedRoute><RadarLucro /></ProtectedRoute>} />
            <Route path="/calculadora" element={<ProtectedRoute><CalculadoraSobrevivencia /></ProtectedRoute>} />

            {/* Gestão */}
            <Route path="/gestao/agenda" element={<ProtectedRoute><AgendaVega /></ProtectedRoute>} />
            <Route path="/gestao/equipe" element={<ProtectedRoute><EquipeVega /></ProtectedRoute>} />
            <Route path="/gestao/financas" element={<ProtectedRoute><FinancasVega /></ProtectedRoute>} />
            <Route path="/gestao/metas" element={<ProtectedRoute><MetasMensais /></ProtectedRoute>} />

            {/* Vendas sub */}
            <Route path="/vendas/funil" element={<ProtectedRoute><FunilVendas /></ProtectedRoute>} />
            <Route path="/vendas/follow-up" element={<ProtectedRoute><FollowUpInteligente /></ProtectedRoute>} />

            {/* Marketing sub */}
            <Route path="/marketing/campanhas" element={<ProtectedRoute><Campanhas /></ProtectedRoute>} />
            <Route path="/marketing/leads-origem" element={<ProtectedRoute><LeadsOrigem /></ProtectedRoute>} />
            <Route path="/marketing/conteudo" element={<ProtectedRoute><PlanejamentoConteudo /></ProtectedRoute>} />
            <Route path="/marketing/sugestoes" element={<ProtectedRoute><SugestoesEstrategicas /></ProtectedRoute>} />

            {/* Vega tools */}
            <Route path="/vega/hora-clinica" element={<ProtectedRoute><HoraClinica /></ProtectedRoute>} />
            <Route path="/vega/perguntas" element={<ProtectedRoute><PerguntasDecisao /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
