import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Search, Plus, Phone, Mail, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const patients = [
  { id: 1, name: "Maria Oliveira", phone: "(11) 98765-4321", email: "maria@email.com", lastVisit: "12/03/2026", nextVisit: "26/03/2026", status: "Ativo" },
  { id: 2, name: "Carlos Santos", phone: "(11) 91234-5678", email: "carlos@email.com", lastVisit: "05/03/2026", nextVisit: "20/03/2026", status: "Ativo" },
  { id: 3, name: "Ana Costa", phone: "(21) 99876-5432", email: "ana@email.com", lastVisit: "28/02/2026", nextVisit: "28/03/2026", status: "Ativo" },
  { id: 4, name: "Pedro Almeida", phone: "(11) 97654-3210", email: "pedro@email.com", lastVisit: "10/01/2026", nextVisit: "-", status: "Inativo" },
  { id: 5, name: "Julia Ferreira", phone: "(31) 98765-1234", email: "julia@email.com", lastVisit: "15/03/2026", nextVisit: "22/03/2026", status: "Ativo" },
  { id: 6, name: "Lucas Martins", phone: "(11) 99999-8888", email: "lucas@email.com", lastVisit: "18/03/2026", nextVisit: "25/03/2026", status: "Ativo" },
  { id: 7, name: "Beatriz Souza", phone: "(21) 91111-2222", email: "beatriz@email.com", lastVisit: "01/03/2026", nextVisit: "-", status: "Inativo" },
  { id: 8, name: "Gabriel Lima", phone: "(11) 93333-4444", email: "gabriel@email.com", lastVisit: "19/03/2026", nextVisit: "02/04/2026", status: "Ativo" },
];

const Pacientes = () => {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Pacientes">
      <div className="space-y-4">
        {/* Header */}
        <div
          className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Table */}
        <div
          className="animate-fade-up rounded-xl border bg-card shadow-sm overflow-hidden"
          style={{ animationDelay: "100ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Paciente
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    Contato
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                    Última Visita
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                    Próxima Visita
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="transition-colors hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell tabular-nums">
                      {patient.lastVisit}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell tabular-nums">
                      {patient.nextVisit}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          patient.status === "Ativo"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors active:scale-95">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Nenhum paciente encontrado</p>
              <p className="text-xs">Tente buscar com outro termo</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Pacientes;
