import jsPDF from "jspdf";
import { buildPaymentOptions, selectedPaymentKey } from "./paymentOptions";

interface PlanItem {
  procedure_name: string;
  tooth_number?: string | null;
  region?: string | null;
  value: number;
}

export interface TreatmentPlanPdfData {
  clinic: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    responsible_name?: string | null;
    responsible_cro?: string | null;
    logo_url?: string | null;
  };
  patient: {
    name: string;
    cpf?: string | null;
    phone?: string | null;
  };
  items: PlanItem[];
  totalValue: number;
  discount: number;
  finalValue: number;
  /** Condição escolhida no orçamento (texto livre salvo nas notas). */
  paymentMethod?: string | null;
  validUntil?: string | null;
  createdAt: string;
}

const PETROL: [number, number, number] = [16, 52, 68];
const GOLD: [number, number, number] = [180, 142, 70];

const fmt = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateTreatmentPlanPdf(data: TreatmentPlanPdfData) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  let y = 18;

  // ===== Logo
  if (data.clinic.logo_url) {
    const dataUrl = await loadImageAsDataUrl(data.clinic.logo_url);
    if (dataUrl) {
      try {
        const type = dataUrl.includes("image/png") ? "PNG" : "JPEG";
        doc.addImage(dataUrl, type, W / 2 - 9, y, 18, 18, undefined, "FAST");
        y += 22;
      } catch { /* ignore */ }
    }
  }

  // ===== Cabeçalho
  doc.setTextColor(...PETROL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.clinic.name, W / 2, y, { align: "center" });
  y += 6;

  const resp = [data.clinic.responsible_name, data.clinic.responsible_cro].filter(Boolean).join(" | ");
  if (resp) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(resp, W / 2, y, { align: "center" });
    y += 5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  const contact = [data.clinic.address, data.clinic.phone, data.clinic.email].filter(Boolean).join(" • ");
  if (contact) {
    const lines = doc.splitTextToSize(contact, W - M * 2);
    doc.text(lines, W / 2, y, { align: "center" });
    y += lines.length * 4;
  }

  y += 3;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 9;

  // ===== Título
  doc.setTextColor(...PETROL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PLANO DE TRATAMENTO E ORÇAMENTO", W / 2, y, { align: "center" });
  y += 4;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 28, y, W / 2 + 28, y);
  y += 10;

  // ===== Dados do paciente
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y - 5, W - M * 2, 20, 1.5, 1.5);
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("PACIENTE", M + 3, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PETROL);
  doc.text(data.patient.name, M + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  const pLine = [
    data.patient.cpf && `CPF: ${data.patient.cpf}`,
    data.patient.phone,
  ].filter(Boolean).join("  •  ");
  if (pLine) doc.text(pLine, M + 3, y + 11);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Emitido em ${data.createdAt}`, W - M - 3, y + 1, { align: "right" });
  if (data.validUntil) {
    doc.text(`Válido até ${data.validUntil}`, W - M - 3, y + 6, { align: "right" });
  }
  y += 24;

  // ===== Procedimentos
  doc.setTextColor(...PETROL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PROCEDIMENTOS PLANEJADOS", M, y);
  y += 5;

  doc.setFillColor(245, 240, 230);
  doc.rect(M, y - 4, W - M * 2, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(...PETROL);
  doc.text("Procedimento", M + 2, y);
  doc.text("Dente", M + 95, y);
  doc.text("Região", M + 120, y);
  doc.text("Valor", W - M - 2, y, { align: "right" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50);
  data.items.forEach((it) => {
    if (y > H - 90) { doc.addPage(); y = 24; }
    doc.text(doc.splitTextToSize(it.procedure_name, 80)[0], M + 2, y);
    doc.text(it.tooth_number || "—", M + 95, y);
    doc.text(it.region || "—", M + 120, y);
    doc.text(fmt(Number(it.value)), W - M - 2, y, { align: "right" });
    y += 5.5;
    doc.setDrawColor(230);
    doc.setLineWidth(0.1);
    doc.line(M, y - 2.5, W - M, y - 2.5);
  });

  // ===== Totais
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`Subtotal: ${fmt(data.totalValue)}`, W - M, y, { align: "right" });
  y += 5;
  if (data.discount > 0) {
    doc.text(`Desconto: - ${fmt(data.discount)}`, W - M, y, { align: "right" });
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PETROL);
  doc.text(`VALOR TOTAL: ${fmt(data.finalValue)}`, W - M, y + 1, { align: "right" });
  y += 11;

  // ===== Formas de pagamento
  const options = buildPaymentOptions(data.finalValue);
  const chosen = selectedPaymentKey(data.paymentMethod);
  const boxH = 12 + options.length * 11;
  if (y + boxH > H - 55) { doc.addPage(); y = 24; }

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y - 5, W - M * 2, boxH, 1.5, 1.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text("FORMAS DE PAGAMENTO", M + 3, y);
  let oy = y + 7;
  options.forEach((opt) => {
    const isChosen = chosen === opt.key;
    if (isChosen) {
      doc.setFillColor(250, 246, 236);
      doc.rect(M + 1.5, oy - 4, W - M * 2 - 3, 10, "F");
    }
    doc.setFont("helvetica", isChosen ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PETROL);
    doc.text(opt.label, M + 4, oy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(opt.highlight || "", W - M - 4, oy, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(opt.detail + (isChosen ? "  (condição escolhida)" : ""), M + 4, oy + 4);
    oy += 11;
  });
  y += boxH + 6;

  // ===== Assinaturas
  if (y > H - 45) { doc.addPage(); y = H - 60; }
  y = Math.max(y, H - 55);
  doc.setDrawColor(...PETROL);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 70, y);
  doc.line(W - M - 70, y, W - M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.text("Assinatura do Paciente", M, y + 4);
  doc.text(data.patient.name, M, y + 8);
  doc.text("Assinatura da Profissional", W - M - 70, y + 4);
  if (data.clinic.responsible_name) {
    doc.text(data.clinic.responsible_name, W - M - 70, y + 8);
    if (data.clinic.responsible_cro) {
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(data.clinic.responsible_cro, W - M - 70, y + 12);
    }
  }

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Documento emitido em ${data.createdAt}`, W / 2, H - 10, { align: "center" });

  return doc;
}
