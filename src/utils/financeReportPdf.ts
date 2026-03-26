import jsPDF from "jspdf";

interface ReportEntry {
  category: string;
  description: string;
  date: string;
  value: number;
  payment_method: string;
  status: string;
}

interface CommissionEntry {
  name: string;
  role: string;
  production: number;
  rate: number;
  commission: number;
  paid: number;
  pending: number;
}

interface FinanceReportData {
  clinicName: string;
  periodLabel: string;
  entries: ReportEntry[];
  exits: ReportEntry[];
  commissions: CommissionEntry[];
}

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function generateFinanceReportPdf(data: FinanceReportData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  const checkPage = (needed = 20) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.clinicName, pw / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório Financeiro Mensal", pw / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.text(data.periodLabel, pw / 2, y, { align: "center" });
  y += 3;
  doc.setDrawColor(200);
  doc.line(15, y, pw - 15, y);
  y += 10;

  // Totals summary
  const totalEntries = data.entries.reduce((s, e) => s + e.value, 0);
  const totalExits = data.exits.reduce((s, e) => s + e.value, 0);
  const totalCommPaid = data.commissions.reduce((s, c) => s + c.paid, 0);
  const balance = totalEntries - totalExits;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo", 15, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const summaryItems = [
    ["Total de Receitas", fmt(totalEntries)],
    ["Total de Despesas", fmt(totalExits)],
    ["Comissões Pagas (incluso em despesas)", fmt(totalCommPaid)],
    ["Saldo do Período", fmt(balance)],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 18, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, pw - 18, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6;
  });

  y += 5;
  doc.line(15, y, pw - 15, y);
  y += 10;

  // --- RECEITAS ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Receitas", 15, y);
  y += 7;

  if (data.entries.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma receita no período.", 18, y);
    y += 8;
  } else {
    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 4, pw - 30, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Categoria", 18, y);
    doc.text("Descrição", 55, y);
    doc.text("Data", 120, y);
    doc.text("Método", 145, y);
    doc.text("Valor", pw - 18, y, { align: "right" });
    y += 7;
    doc.setFont("helvetica", "normal");

    // Group by category
    const grouped = new Map<string, { total: number; items: ReportEntry[] }>();
    data.entries.forEach(e => {
      const cat = e.category || "outros";
      if (!grouped.has(cat)) grouped.set(cat, { total: 0, items: [] });
      const g = grouped.get(cat)!;
      g.total += e.value;
      g.items.push(e);
    });

    grouped.forEach((group, cat) => {
      group.items.forEach(e => {
        checkPage(8);
        doc.setFontSize(8);
        doc.text(cat, 18, y);
        const desc = (e.description || "—").substring(0, 30);
        doc.text(desc, 55, y);
        doc.text(e.date, 120, y);
        doc.text((e.payment_method || "").replace("_", " "), 145, y);
        doc.text(fmt(e.value), pw - 18, y, { align: "right" });
        y += 5;
      });
    });

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Total Receitas:", 120, y);
    doc.text(fmt(totalEntries), pw - 18, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 8;
  }

  checkPage(15);
  doc.line(15, y, pw - 15, y);
  y += 10;

  // --- DESPESAS ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Despesas", 15, y);
  y += 7;

  if (data.exits.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma despesa no período.", 18, y);
    y += 8;
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 4, pw - 30, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Categoria", 18, y);
    doc.text("Descrição", 55, y);
    doc.text("Data", 120, y);
    doc.text("Método", 145, y);
    doc.text("Valor", pw - 18, y, { align: "right" });
    y += 7;
    doc.setFont("helvetica", "normal");

    data.exits.forEach(e => {
      checkPage(8);
      doc.setFontSize(8);
      doc.text(e.category || "outros", 18, y);
      doc.text((e.description || "—").substring(0, 30), 55, y);
      doc.text(e.date, 120, y);
      doc.text((e.payment_method || "").replace("_", " "), 145, y);
      doc.text(fmt(e.value), pw - 18, y, { align: "right" });
      y += 5;
    });

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Total Despesas:", 120, y);
    doc.text(fmt(totalExits), pw - 18, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 8;
  }

  checkPage(15);
  doc.line(15, y, pw - 15, y);
  y += 10;

  // --- COMISSÕES ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Comissões", 15, y);
  y += 7;

  if (data.commissions.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma comissão no período.", 18, y);
    y += 8;
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 4, pw - 30, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Profissional", 18, y);
    doc.text("Cargo", 65, y);
    doc.text("Produção", 95, y);
    doc.text("Taxa", 125, y);
    doc.text("Comissão", 143, y);
    doc.text("Pago", 168, y);
    doc.text("Pendente", pw - 18, y, { align: "right" });
    y += 7;
    doc.setFont("helvetica", "normal");

    data.commissions.forEach(c => {
      checkPage(8);
      doc.setFontSize(8);
      doc.text(c.name.substring(0, 22), 18, y);
      doc.text(c.role, 65, y);
      doc.text(fmt(c.production), 95, y);
      doc.text(`${c.rate}%`, 125, y);
      doc.text(fmt(c.commission), 143, y);
      doc.text(fmt(c.paid), 168, y);
      doc.text(fmt(c.pending), pw - 18, y, { align: "right" });
      y += 5;
    });

    y += 3;
    const totalComm = data.commissions.reduce((s, c) => s + c.commission, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Total Comissões:", 120, y);
    doc.text(fmt(totalComm), pw - 18, y, { align: "right" });
    y += 8;
  }

  // Footer
  checkPage(20);
  y += 5;
  doc.line(15, y, pw - 15, y);
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pw / 2, y, { align: "center" });
  doc.setTextColor(0);

  return doc;
}
