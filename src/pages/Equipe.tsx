import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone } from "lucide-react";

const teamMembers = [
  {
    id: 1,
    name: "Dr. Rafael Lima",
    role: "Dentista — Clínico Geral",
    specialty: "CRO 12345-SP",
    phone: "(11) 99876-5432",
    email: "rafael@odontogest.com",
    status: "Ativo",
    avatar: "RL",
    color: "bg-primary/10 text-primary",
  },
  {
    id: 2,
    name: "Dra. Camila Rodrigues",
    role: "Dentista — Ortodontista",
    specialty: "CRO 23456-SP",
    phone: "(11) 98765-4321",
    email: "camila@odontogest.com",
    status: "Ativo",
    avatar: "CR",
    color: "bg-info/10 text-info",
  },
  {
    id: 3,
    name: "Dr. Fernando Nascimento",
    role: "Dentista — Endodontista",
    specialty: "CRO 34567-SP",
    phone: "(11) 97654-3210",
    email: "fernando@odontogest.com",
    status: "Ativo",
    avatar: "FN",
    color: "bg-success/10 text-success",
  },
  {
    id: 4,
    name: "Patrícia Mendes",
    role: "Recepcionista",
    specialty: "",
    phone: "(11) 96543-2109",
    email: "patricia@odontogest.com",
    status: "Ativo",
    avatar: "PM",
    color: "bg-warning/10 text-warning",
  },
  {
    id: 5,
    name: "Renata Campos",
    role: "Auxiliar de Saúde Bucal",
    specialty: "ASB 5678",
    phone: "(11) 95432-1098",
    email: "renata@odontogest.com",
    status: "Ativo",
    avatar: "RC",
    color: "bg-primary/10 text-primary",
  },
  {
    id: 6,
    name: "Marcos Silva",
    role: "Administrador Financeiro",
    specialty: "",
    phone: "(11) 94321-0987",
    email: "marcos@odontogest.com",
    status: "Ativo",
    avatar: "MS",
    color: "bg-info/10 text-info",
  },
];

const Equipe = () => {
  return (
    <AppLayout title="Equipe">
      <div className="space-y-4">
        <div
          className="animate-fade-up flex items-center justify-between"
          style={{ opacity: 0, animationFillMode: "forwards" }}
        >
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} membros da equipe
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teamMembers.map((member, i) => (
            <div
              key={member.id}
              className="animate-fade-up rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
              style={{
                animationDelay: `${100 + i * 70}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${member.color}`}
                >
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  {member.specialty && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {member.specialty}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-success/10 text-success">
                  {member.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Equipe;
