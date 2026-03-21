import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home.tsx";
import Vendas from "./pages/Vendas.tsx";
import Marketing from "./pages/Marketing.tsx";
import Gestao from "./pages/Gestao.tsx";
import Autoridade from "./pages/Autoridade.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import PerguntasDecisao from "./pages/vega/PerguntasDecisao.tsx";
import HoraClinica from "./pages/vega/HoraClinica.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/vendas/perguntas-decisao" element={<PerguntasDecisao />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/gestao" element={<Gestao />} />
          <Route path="/gestao/hora-clinica" element={<HoraClinica />} />
          <Route path="/autoridade" element={<Autoridade />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
