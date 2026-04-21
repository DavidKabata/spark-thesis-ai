import jsPDF from "jspdf";

type Analysis = {
  title: string;
  canvas_type: "business_model" | "lean";
  executive_summary: string | null;
  value_create: string | null;
  value_deliver: string | null;
  value_capture: string | null;
  canvas_data: Record<string, string>;
  created_at?: string;
};

const BMC_BLOCKS: Array<[string, string]> = [
  ["key_partnerships", "Key Partnerships"],
  ["key_activities", "Key Activities"],
  ["key_resources", "Key Resources"],
  ["value_propositions", "Value Propositions"],
  ["customer_relationships", "Customer Relationships"],
  ["channels", "Channels"],
  ["customer_segments", "Customer Segments"],
  ["cost_structure", "Cost Structure"],
  ["revenue_streams", "Revenue Streams"],
];

const LEAN_BLOCKS: Array<[string, string]> = [
  ["problem", "Problem"],
  ["solution", "Solution"],
  ["unique_value_proposition", "Unique Value Proposition"],
  ["unfair_advantage", "Unfair Advantage"],
  ["customer_segments", "Customer Segments"],
  ["key_metrics", "Key Metrics"],
  ["channels", "Channels"],
  ["cost_structure", "Cost Structure"],
  ["revenue_streams", "Revenue Streams"],
];

export function downloadAnalysisPdf(a: Analysis) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Cover header
  doc.setFillColor(20, 24, 56);
  doc.rect(0, 0, pageW, 120, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SCHOLAR SPARK", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Research Commercialization Report", margin, 66);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString(), pageW - margin, 50, { align: "right" });

  y = 160;
  doc.setTextColor(20, 24, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const titleLines = doc.splitTextToSize(a.title, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 26 + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 130);
  const canvasLabel = a.canvas_type === "lean" ? "Lean Canvas" : "Business Model Canvas";
  doc.text(`${canvasLabel} · Value Create · Deliver · Capture`, margin, y);
  y += 28;

  // Executive summary
  if (a.executive_summary) {
    doc.setTextColor(20, 24, 56);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Executive Summary", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    const sumLines = doc.splitTextToSize(a.executive_summary, contentW);
    ensureSpace(sumLines.length * 14);
    doc.text(sumLines, margin, y);
    y += sumLines.length * 14 + 18;
  }

  // Value pillars
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 24, 56);
  ensureSpace(20);
  doc.text("Value Pillars", margin, y);
  y += 16;

  const pillars: Array<[string, string | null]> = [
    ["Value Created", a.value_create],
    ["Value Delivered", a.value_deliver],
    ["Value Captured", a.value_capture],
  ];
  pillars.forEach(([label, body]) => {
    if (!body) return;
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6);
    doc.text(label.toUpperCase(), margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(40, 40, 60);
    const lines = doc.splitTextToSize(body, contentW);
    ensureSpace(lines.length * 13);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 10;
  });

  // Canvas page
  doc.addPage();
  y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 24, 56);
  doc.text(canvasLabel, margin, y);
  y += 24;

  const blocks = a.canvas_type === "lean" ? LEAN_BLOCKS : BMC_BLOCKS;
  blocks.forEach(([key, label]) => {
    const body = a.canvas_data?.[key] || "—";
    ensureSpace(50);
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(220, 220, 230);
    const blockTopY = y;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 24, 56);
    doc.text(label.toUpperCase(), margin + 12, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 70);
    const lines = doc.splitTextToSize(body, contentW - 24);
    const blockH = 28 + lines.length * 12 + 12;
    if (y + blockH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(248, 248, 252);
    doc.roundedRect(margin, y, contentW, 28 + lines.length * 12 + 8, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(20, 24, 56);
    doc.text(label.toUpperCase(), margin + 12, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 70);
    doc.text(lines, margin + 12, y + 32);
    y += 28 + lines.length * 12 + 16;
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(`Generated by Scholar Spark · Page ${i} of ${pages}`, pageW / 2, pageH - 20, {
      align: "center",
    });
  }

  const safeName = a.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "analysis";
  doc.save(`scholar-spark-${safeName}.pdf`);
}
