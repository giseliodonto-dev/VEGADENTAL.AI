import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const appointments: Record<string, { time: string; patient: string; procedure: string; color: string }[]> = {
  "2026-03-20": [
    { time: "08:00", patient: "Maria Oliveira", procedure: "Limpeza", color: "bg-primary/10 border-l-primary" },
    { time: "09:30", patient: "Carlos Santos", procedure: "Restauração", color: "bg-warning/10 border-l-warning" },
    { time: "10:30", patient: "Ana Costa", procedure: "Ortodontia", color: "bg-info/10 border-l-info" },
    { time: "14:00", patient: "Julia Ferreira", procedure: "Consulta", color: "bg-success/10 border-l-success" },
    { time: "15:00", patient: "Lucas Martins", procedure: "Extração", color: "bg-destructive/10 border-l-destructive" },
  ],
  "2026-03-21": [
    { time: "08:30", patient: "Gabriel Lima", procedure: "Limpeza", color: "bg-primary/10 border-l-primary" },
    { time: "10:00", patient: "Beatriz Souza", procedure: "Canal", color: "bg-warning/10 border-l-warning" },
    { time: "14:30", patient: "Pedro Almeida", procedure: "Prótese", color: "bg-info/10 border-l-info" },
  ],
  "2026-03-22": [
    { time: "09:00", patient: "Fernanda Rocha", procedure: "Clareamento", color: "bg-primary/10 border-l-primary" },
    { time: "11:00", patient: "Marcos Vieira", procedure: "Restauração", color: "bg-warning/10 border-l-warning" },
  ],
};

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 20));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const selectedDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  const todayAppointments = appointments[selectedDateStr] || [];

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };

  const selectDay = (day: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  return (
    <AppLayout title="Agenda">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div
          className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold capitalize">
              {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {daysOfWeek.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasApts = appointments[dateStr]?.length > 0;
              const isSelected = currentDate.getDate() === day;

              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-sm transition-all active:scale-95 ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted"
                  }`}
                >
                  {day}
                  {hasApts && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <Button className="w-full mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        {/* Day view */}
        <div
          className="animate-fade-up lg:col-span-2 rounded-xl border bg-card p-5 shadow-sm"
          style={{ animationDelay: "100ms", opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">
                {currentDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <p className="text-xs text-muted-foreground">
                {todayAppointments.length} agendamento{todayAppointments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {todayAppointments.length > 0 ? (
            <div className="space-y-2">
              {todayAppointments.map((apt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-lg border-l-[3px] p-3 transition-colors hover:bg-muted/30 cursor-pointer ${apt.color}`}
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground w-14 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium tabular-nums">{apt.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{apt.patient}</p>
                    <p className="text-xs text-muted-foreground">{apt.procedure}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Nenhum agendamento</p>
              <p className="text-xs">Sem consultas marcadas para este dia</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Agenda;
