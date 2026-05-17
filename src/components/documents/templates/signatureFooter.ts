export const SIGNATURE_LINES = {
  dentist: "Dra. Giseli da Costa Lage",
  role: "Cirurgiã-Dentista | CROSP 165429 | GC Odontologia",
  units: "Atendimento Clínico: Unidades Cajamar e Alphaville",
  city: "Cajamar",
};

export function dataPorExtenso(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
}

export function cidadeData(date: Date = new Date()): string {
  return `${SIGNATURE_LINES.city}, ${dataPorExtenso(date)}.`;
}
