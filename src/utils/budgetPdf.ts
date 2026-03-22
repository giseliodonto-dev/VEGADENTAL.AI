import jsPDF from "jspdf";

interface BudgetItem {
  procedure_name: string;
  tooth_number?: string | null;
  region?: string | null;
  value: number;
  notes?: string | null;
}

interface BudgetPdfData {
  clinicName: string;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  clinicAddress?: string | null;
  patientName: string;
  patientPhone?: string | null;
  items: BudgetItem[];
  totalValue: number;
  discount: number;
  finalValue: number;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
}

export function generateBudgetPdf(data: BudgetPdfData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.clinicName, pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contactParts: string[] = [];
  if (data.clinicPhone) contactParts.push(data.clinicPhone);
  if (data.clinicEmail) contactParts.push(data.clinicEmail);
  if (contactParts.length) {
    doc.text(contactParts.join(" | "), pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  if (data.clinicAddress) {
    doc.text(data.clinicAddress, pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  // Line separator
  y += 3;
  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ORÇAMENTO ODONTOLÓGICO", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Patient info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paciente: ${data.patientName}`, 15, y);
  if (data.patientPhone) {
    doc.text(`Telefone: ${data.patientPhone}`, pageWidth - 15, y, { align: "right" });
  }
  y += 6;
  doc.text(`Data: ${data.createdAt}`, 15, y);
  if (data.validUntil) {
    doc.text(`Válido até: ${data.validUntil}`, pageWidth - 15, y, { align: "right" });
  }
  y += 10;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 4, pageWidth - 30, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Procedimento", 18, y);
  doc.text("Dente", 110, y);
  doc.text("Região", 135, y);
  doc.text("Valor", pageWidth - 18, y, { align: "right" });
  y += 8;

  // Table rows
  doc.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.procedure_name, 18, y);
    doc.text(item.tooth_number || "—", 110, y);
    doc.text(item.region || "—", 135, y);
    doc.text(`R$ ${item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, pageWidth - 18, y, { align: "right" });
    y += 7;
  });

  // Totals
  y += 5;
  doc.line(15, y, pageWidth - 15, y);
  y += 8;

  doc.setFontSize(10);
  doc.text("Subtotal:", 120, y);
  doc.text(`R$ ${data.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, pageWidth - 18, y, { align: "right" });
  y += 7;

  if (data.discount > 0) {
    doc.text("Desconto:", 120, y);
    doc.setTextColor(220, 50, 50);
    doc.text(`- R$ ${data.discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, pageWidth - 18, y, { align: "right" });
    doc.setTextColor(0);
    y += 7;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", 120, y);
  doc.text(`R$ ${data.finalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, pageWidth - 18, y, { align: "right" });
  y += 15;

  // Notes
  if (data.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Observações:", 15, y);
    y += 5;
    const lines = doc.splitTextToSize(data.notes, pageWidth - 30);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 10;
  }

  // Signature area
  if (y > 240) { doc.addPage(); y = 40; }
  y = Math.max(y, 230);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.line(15, y, 90, y);
  doc.text("Assinatura do Paciente", 15, y + 5);
  doc.line(110, y, pageWidth - 15, y);
  doc.text("Assinatura do Profissional", 110, y + 5);

  return doc;
}
