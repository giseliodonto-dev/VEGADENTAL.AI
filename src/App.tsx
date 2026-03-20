import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Pacientes from "./pages/Pacientes.tsx";
import Agenda from "./pages/Agenda.tsx";
import Financeiro from "./pages/Financeiro.tsx";
import Equipe from "./pages/Equipe.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import VegaVendas from "./pages/vega/Vendas.tsx";
import VegaMarketing from "./pages/vega/Marketing.tsx";
import VegaGestao from "./pages/vega/Gestao.tsx";
import VegaFinancas from "./pages/vega/Financas.tsx";
import VegaAtendimento from "./pages/vega/Atendimento.tsx";
import VegaProcessos from "./pages/vega/Processos.tsx";
import VegaPessoas from "./pages/vega/Pessoas.tsx";
import VegaAutoridade from "./pages/vega/Autoridade.tsx";
import VegaPerguntasDecisao from "./pages/vega/PerguntasDecisao.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/vega/vendas" element={<VegaVendas />} />
          <Route path="/vega/marketing" element={<VegaMarketing />} />
          <Route path="/vega/gestao" element={<VegaGestao />} />
          <Route path="/vega/financas" element={<VegaFinancas />} />
          <Route path="/vega/atendimento" element={<VegaAtendimento />} />
          <Route path="/vega/processos" element={<VegaProcessos />} />
          <Route path="/vega/pessoas" element={<VegaPessoas />} />
          <Route path="/vega/autoridade" element={<VegaAutoridade />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
