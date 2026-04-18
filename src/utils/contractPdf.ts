import jsPDF from "jspdf";

interface ContractItem {
  procedure_name: string;
  tooth_number?: string | null;
  region?: string | null;
  value: number;
}

export interface ContractPdfData {
  clinic: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    responsible_name?: string | null;
    responsible_cro?: string | null;
    cancellation_fee?: number | null;
    logo_url?: string | null;
  };
  patient: {
    name: string;
    cpf?: string | null;
    rg?: string | null;
    phone?: string | null;
    email?: string | null;
    street?: string | null;
    number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
  };
  items: ContractItem[];
  totalValue: number;
  discount: number;
  finalValue: number;
  paymentMethod?: string | null;
  validUntil?: string | null;
  createdAt: string;
  acceptedSignature?: string | null;
  acceptedAt?: string | null;
}

const PETROL: [number, number, number] = [16, 52, 68];
const GOLD: [number, number, number] = [180, 142, 70];

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateContractPdf(data: ContractPdfData) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const M = 18;
  let y = 18;

  // ===== Header
  doc.setTextColor(...PETROL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.clinic.name, W / 2, y, { align: "center" });
  y += 6;

  if (data.clinic.responsible_name || data.clinic.responsible_cro) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(90);
    const line = [data.clinic.responsible_name, data.clinic.responsible_cro].filter(Boolean).join(" — ");
    doc.text(line, W / 2, y, { align: "center" });
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

  // Gold divider
  y += 3;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 9;

  // Title
  doc.setTextColor(...PETROL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS", W / 2, y, { align: "center" });
  y += 4;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 30, y, W / 2 + 30, y);
  y += 8;

  // ===== Parties
  const colW = (W - M * 2 - 4) / 2;
  const partyTop = y;
  const renderParty = (x: number, label: string, lines: string[]) => {
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, partyTop, colW, 32, 1.5, 1.5);
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + 3, partyTop + 5);
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    let yy = partyTop + 10;
    lines.forEach((l) => {
      if (!l) return;
      const wrapped = doc.splitTextToSize(l, colW - 6);
      doc.text(wrapped, x + 3, yy);
      yy += wrapped.length * 4;
    });
  };

  renderParty(M, "Contratada (Clínica)", [
    data.clinic.name,
    data.clinic.responsible_name && `Resp. Técnica: ${data.clinic.responsible_name}`,
    data.clinic.responsible_cro,
    data.clinic.address,
    [data.clinic.phone, data.clinic.email].filter(Boolean).join(" • "),
  ].filter(Boolean) as string[]);

  const addr = [data.patient.street, data.patient.number, data.patient.neighborhood, data.patient.city, data.patient.state, data.patient.postal_code].filter(Boolean).join(", ");
  renderParty(M + colW + 4, "Contratante (Paciente)", [
    data.patient.name,
    data.patient.cpf && `CPF: ${data.patient.cpf}`,
    data.patient.rg && `RG: ${data.patient.rg}`,
    [data.patient.phone, data.patient.email].filter(Boolean).join(" • "),
    addr,
  ].filter(Boolean) as string[]);

  y = partyTop + 36;

  // ===== Object
  doc.setTextColor(...PETROL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. OBJETO", M, y);
  y += 5;
  doc.setTextColor(60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const obj = doc.splitTextToSize(
    "O presente contrato tem por objeto a prestação de serviços odontológicos pela Contratada ao Contratante, conforme plano de tratamento abaixo discriminado:",
    W - M * 2,
  );
  doc.text(obj, M, y);
  y += obj.length * 4 + 4;

  // Items table
  doc.setFillColor(245, 240, 230);
  doc.rect(M, y - 4, W - M * 2, 7, "F");
  doc.setFont("helvetica", "bold");
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
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text(doc.splitTextToSize(it.procedure_name, 80)[0], M + 2, y);
    doc.text(it.tooth_number || "—", M + 95, y);
    doc.text(it.region || "—", M + 120, y);
    doc.text(fmt(Number(it.value)), W - M - 2, y, { align: "right" });
    y += 5.5;
    doc.setDrawColor(230);
    doc.setLineWidth(0.1);
    doc.line(M, y - 2.5, W - M, y - 2.5);
  });

  // ===== Values
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PETROL);
  doc.text("2. VALORES E CONDIÇÕES", M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(`Subtotal: ${fmt(data.totalValue)}`, W - M, y, { align: "right" }); y += 5;
  if (data.discount > 0) {
    doc.text(`Desconto: - ${fmt(data.discount)}`, W - M, y, { align: "right" }); y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PETROL);
  doc.text(`VALOR FINAL: ${fmt(data.finalValue)}`, W - M, y, { align: "right" });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  if (data.paymentMethod) { doc.text(`Forma de pagamento: ${data.paymentMethod}`, M, y); y += 5; }
  if (data.validUntil) { doc.text(`Validade da proposta: ${data.validUntil}`, M, y); y += 5; }

  // ===== Clauses
  if (y > 220) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PETROL);
  doc.text("3. CLÁUSULAS CONTRATUAIS", M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60);
  const fee = data.clinic.cancellation_fee || 100;
  const clauses = [
    "3.1. O Contratante declara estar ciente do plano de tratamento proposto e que o sucesso do resultado depende da resposta biológica individual e do cumprimento rigoroso das orientações fornecidas pela Contratada.",
    "3.2. O Contratante compromete-se a seguir todas as orientações pré e pós-operatórias, comparecer às sessões agendadas e colaborar ativamente para o êxito do tratamento.",
    `3.3. Faltas não justificadas com no mínimo 24 horas de antecedência poderão gerar taxa de reagendamento no valor de ${fmt(fee)}, em razão da reserva da hora clínica.`,
    "3.4. O presente orçamento tem validade de 15 (quinze) dias corridos a partir da data de emissão, podendo os valores serem reajustados após este prazo.",
    "3.5. Fica eleito o foro da comarca da Contratada para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.",
  ];
  clauses.forEach((c) => {
    if (y > 265) { doc.addPage(); y = 20; }
    const wrapped = doc.splitTextToSize(c, W - M * 2);
    doc.text(wrapped, M, y);
    y += wrapped.length * 4 + 2;
  });

  // ===== Signatures
  if (y > 230) { doc.addPage(); y = 30; } else { y += 8; }
  doc.setDrawColor(...PETROL);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + 70, y);
  doc.line(W - M - 70, y, W - M, y);
  doc.setFontSize(8);
  doc.setTextColor(60);
  doc.text("Assinatura do Contratante", M, y + 4);
  if (data.acceptedSignature) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...PETROL);
    doc.text(data.acceptedSignature, M, y - 1);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
  }
  doc.text("Carimbo / Responsável Técnica", W - M - 70, y + 4);
  if (data.clinic.responsible_name) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PETROL);
    doc.text(data.clinic.responsible_name, W - M - 70, y - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);
    if (data.clinic.responsible_cro) doc.text(data.clinic.responsible_cro, W - M - 70, y - 0.5);
  }

  y += 10;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Documento emitido em ${data.createdAt}${data.acceptedAt ? ` • Aceito em ${data.acceptedAt}` : ""}`, W / 2, 287, { align: "center" });

  return doc;
}
