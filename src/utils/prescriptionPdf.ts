import jsPDF from "jspdf";
import type { Medication } from "@/lib/prescriptionAi";

interface PrescriptionPdfData {
  clinicName: string;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  clinicAddress?: string | null;
  clinicLogoUrl?: string | null;
  patientName: string;
  patientCpf?: string | null;
  dentistName?: string | null;
  dentistCro?: string | null;
  medications: Medication[];
  notes?: string | null;
  createdAt: string;
}

const PETROLEO: [number, number, number] = [16, 52, 68];
const GOLD: [number, number, number] = [184, 150, 74];

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generatePrescriptionPdf(data: PrescriptionPdfData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  // Logo
  if (data.clinicLogoUrl) {
    const dataUrl = await loadImageAsDataUrl(data.clinicLogoUrl);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", 15, y - 4, 24, 24);
      } catch {}
    }
  }

  // Cabeçalho clínica (à direita)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PETROLEO);
  doc.text(data.clinicName, pageWidth - 15, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  if (data.clinicAddress) {
    doc.text(data.clinicAddress, pageWidth - 15, y, { align: "right" });
    y += 4;
  }
  const contact = [data.clinicPhone, data.clinicEmail].filter(Boolean).join(" · ");
  if (contact) {
    doc.text(contact, pageWidth - 15, y, { align: "right" });
    y += 4;
  }

  // Linha dourada
  y = Math.max(y, 30);
  y += 4;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(15, y, pageWidth - 15, y);
  y += 12;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PETROLEO);
  doc.text("RECEITUÁRIO", pageWidth / 2, y, { align: "center" });
  y += 9;

  // Paciente
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`Paciente: ${data.patientName}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  if (data.patientCpf) {
    doc.text(`CPF: ${data.patientCpf}`, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  doc.setTextColor(120);
  doc.text(`Data: ${data.createdAt}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Medicamentos
  doc.setTextColor(30);
  data.medications.forEach((m, i) => {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 25;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PETROLEO);
    doc.text(`${i + 1}. ${m.name}`, 18, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text(`Uso: ${m.usage_type}  ·  Duração: ${m.duration_days} dia(s)`, 22, y);
    y += 6;

    doc.setTextColor(40);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(`Posologia: ${m.posology}`, pageWidth - 40);
    doc.text(lines, 22, y);
    y += lines.length * 5 + 6;
  });

  // Observações
  if (data.notes) {
    if (y > pageHeight - 80) { doc.addPage(); y = 25; }
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80);
    const noteLines = doc.splitTextToSize(`Obs.: ${data.notes}`, pageWidth - 30);
    doc.text(noteLines, 15, y);
    y += noteLines.length * 5;
  }

  // Rodapé: assinatura + carimbo
  const footerY = pageHeight - 45;
  doc.setDrawColor(120);
  doc.setLineWidth(0.2);
  doc.line(25, footerY, pageWidth / 2 - 10, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  const dentistLine = data.dentistName
    ? `${data.dentistName}${data.dentistCro ? ` · CRO ${data.dentistCro}` : ""}`
    : "Assinatura do(a) Cirurgião(ã)-Dentista";
  doc.text(dentistLine, (25 + pageWidth / 2 - 10) / 2, footerY + 5, { align: "center" });
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text(`Data: ${data.createdAt}`, (25 + pageWidth / 2 - 10) / 2, footerY + 10, { align: "center" });

  // Carimbo
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  const stampX = pageWidth / 2 + 15;
  const stampW = pageWidth - 15 - stampX;
  doc.rect(stampX, footerY - 12, stampW, 22);
  doc.setTextColor(...GOLD);
  doc.setFontSize(8);
  doc.text("Carimbo", stampX + stampW / 2, footerY + 1, { align: "center" });

  return doc;
}

// ===== Helpers de entrega (download / impressão / WhatsApp) =====
import { buildWhatsAppUrl } from "@/lib/whatsapp";

function slugifyName(name: string): string {
  return (name || "paciente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "paciente";
}

export function downloadPrescriptionPdf(doc: jsPDF, patientName: string) {
  doc.save(`receita-${slugifyName(patientName)}.pdf`);
}

export function printPrescriptionPdf(doc: jsPDF) {
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  iframe.src = blobUrl;
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error("print failed", err);
    }
  };
  document.body.appendChild(iframe);
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    iframe.remove();
  }, 60_000);
}

export function sendPrescriptionViaWhatsApp(
  doc: jsPDF,
  patientName: string,
  patientPhone: string | null | undefined,
  clinicName: string,
) {
  downloadPrescriptionPdf(doc, patientName);
  const msg =
    `Olá, ${patientName}. Segue sua receita gerada na ${clinicName}. ` +
    `(O PDF foi baixado no dispositivo do(a) profissional — anexe nesta conversa para receber.)`;
  const url = buildWhatsAppUrl(patientPhone, msg);
  window.open(url, "_blank", "noopener,noreferrer");
}
