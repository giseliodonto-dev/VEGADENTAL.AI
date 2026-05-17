import jsPDF from "jspdf";
import { SIGNATURE_LINES, cidadeData } from "../templates/signatureFooter";
import { DOC_TITLES, type DocType } from "../templates/documentTemplates";

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

export interface DocumentPdfInput {
  docType: DocType;
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  clinicEmail?: string | null;
  clinicLogoUrl?: string | null;
  body: string;
}

export async function generateDocumentPdf(input: DocumentPdfInput): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  // Logo
  if (input.clinicLogoUrl) {
    const dataUrl = await loadImageAsDataUrl(input.clinicLogoUrl);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", 15, y - 4, 24, 24);
      } catch {}
    }
  }

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PETROLEO);
  doc.text(input.clinicName, pageWidth - 15, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  if (input.clinicAddress) {
    doc.text(input.clinicAddress, pageWidth - 15, y, { align: "right" });
    y += 4;
  }
  const contact = [input.clinicPhone, input.clinicEmail].filter(Boolean).join(" · ");
  if (contact) {
    doc.text(contact, pageWidth - 15, y, { align: "right" });
    y += 4;
  }

  // Linha dourada
  y = Math.max(y, 30) + 4;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(15, y, pageWidth - 15, y);
  y += 14;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PETROLEO);
  doc.text(DOC_TITLES[input.docType].toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 12;

  // Corpo
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(30);
  const paragraphs = input.body.split("\n\n");
  for (const p of paragraphs) {
    const lines = doc.splitTextToSize(p, pageWidth - 30);
    doc.text(lines, 15, y, { align: "justify", maxWidth: pageWidth - 30 });
    y += lines.length * 6 + 4;
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }
  }

  // Data
  y += 8;
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(cidadeData(), pageWidth - 15, y, { align: "right" });
  y += 22;

  // Linha de assinatura
  doc.setDrawColor(80);
  doc.setLineWidth(0.3);
  const sigCenterX = pageWidth / 2;
  doc.line(sigCenterX - 50, y, sigCenterX + 50, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PETROLEO);
  doc.text(SIGNATURE_LINES.dentist, sigCenterX, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(SIGNATURE_LINES.role, sigCenterX, y, { align: "center" });

  // Rodapé institucional
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(SIGNATURE_LINES.units, pageWidth / 2, pageHeight - 10, { align: "center" });

  return doc;
}

export function downloadDocumentPdf(doc: jsPDF, docType: DocType, patientName: string) {
  const safe = patientName.replace(/[^\w\sÀ-ÿ-]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`${docType}-${safe || "paciente"}.pdf`);
}
