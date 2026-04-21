import jsPDF from "jspdf";

type MvpPlan = {
  name?: string;
  one_liner?: string;
  target_user?: string;
  core_problem?: string;
  core_features?: string[];
  out_of_scope?: string[];
  tech_stack?: string;
  success_metrics?: string[];
  timeline_weeks?: number;
  first_experiment?: string;
};

type Analysis = {
  title: string;
  canvas_type: "business_model" | "lean";
  executive_summary: string | null;
  value_create: string | null;
  value_deliver: string | null;
  value_capture: string | null;
  canvas_data: Record<string, any>;
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

// Canvas grid layouts: [key, label, col, row, colSpan, rowSpan]
// Grid: 5 cols x 3 rows for the top section, 2 cols x 1 row for bottom (cost / revenue)
type Cell = { key: string; label: string; col: number; row: number; colSpan: number; rowSpan: number };

const BMC_LAYOUT: Cell[] = [
  // Top row (4 rows tall): Key Partners | Key Activities (top) / Key Resources (bottom) | Value Props | Customer Rels (top) / Channels (bottom) | Customer Segments
  { key: "key_partnerships", label: "Key Partnerships", col: 0, row: 0, colSpan: 1, rowSpan: 4 },
  { key: "key_activities", label: "Key Activities", col: 1, row: 0, colSpan: 1, rowSpan: 2 },
  { key: "key_resources", label: "Key Resources", col: 1, row: 2, colSpan: 1, rowSpan: 2 },
  { key: "value_propositions", label: "Value Propositions", col: 2, row: 0, colSpan: 1, rowSpan: 4 },
  { key: "customer_relationships", label: "Customer Relationships", col: 3, row: 0, colSpan: 1, rowSpan: 2 },
  { key: "channels", label: "Channels", col: 3, row: 2, colSpan: 1, rowSpan: 2 },
  { key: "customer_segments", label: "Customer Segments", col: 4, row: 0, colSpan: 1, rowSpan: 4 },
  // Bottom row
  { key: "cost_structure", label: "Cost Structure", col: 0, row: 4, colSpan: 2, rowSpan: 2 },
  { key: "revenue_streams", label: "Revenue Streams", col: 2, row: 4, colSpan: 3, rowSpan: 2 },
];

const LEAN_LAYOUT: Cell[] = [
  // Top: Problem | Solution(top)/Key Metrics(bottom) | UVP | Unfair Adv(top)/Channels(bottom) | Customer Segments
  { key: "problem", label: "Problem", col: 0, row: 0, colSpan: 1, rowSpan: 4 },
  { key: "solution", label: "Solution", col: 1, row: 0, colSpan: 1, rowSpan: 2 },
  { key: "key_metrics", label: "Key Metrics", col: 1, row: 2, colSpan: 1, rowSpan: 2 },
  { key: "unique_value_proposition", label: "Unique Value Proposition", col: 2, row: 0, colSpan: 1, rowSpan: 4 },
  { key: "unfair_advantage", label: "Unfair Advantage", col: 3, row: 0, colSpan: 1, rowSpan: 2 },
  { key: "channels", label: "Channels", col: 3, row: 2, colSpan: 1, rowSpan: 2 },
  { key: "customer_segments", label: "Customer Segments", col: 4, row: 0, colSpan: 1, rowSpan: 4 },
  // Bottom
  { key: "cost_structure", label: "Cost Structure", col: 0, row: 4, colSpan: 2, rowSpan: 2 },
  { key: "revenue_streams", label: "Revenue Streams", col: 2, row: 4, colSpan: 3, rowSpan: 2 },
];

function drawCanvasDiagram(
  doc: jsPDF,
  layout: Cell[],
  data: Record<string, string>,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const cols = 5;
  const rows = 6;
  const colW = width / cols;
  const rowH = height / rows;

  layout.forEach((cell) => {
    const cx = x + cell.col * colW;
    const cy = y + cell.row * rowH;
    const cw = cell.colSpan * colW;
    const ch = cell.rowSpan * rowH;

    // Cell background
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(180, 185, 200);
    doc.setLineWidth(0.6);
    doc.rect(cx, cy, cw, ch, "FD");

    // Header strip
    doc.setFillColor(20, 24, 56);
    doc.rect(cx, cy, cw, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(cell.label.toUpperCase(), cx + 4, cy + 9.5);

    // Body text
    const body = (data?.[cell.key] || "—").trim();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(45, 50, 70);
    const padding = 4;
    const textW = cw - padding * 2;
    const lines = doc.splitTextToSize(body, textW);
    const lineHeight = 8.6;
    const maxLines = Math.max(1, Math.floor((ch - 14 - padding * 2) / lineHeight));
    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines && shown.length > 0) {
      // Add ellipsis to last shown line
      const last = shown[shown.length - 1];
      shown[shown.length - 1] = last.length > 3 ? last.slice(0, last.length - 1) + "…" : last + "…";
    }
    doc.text(shown, cx + padding, cy + 14 + padding + 6);
  });
}

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
  doc.text("RESEARCH VENTURE AI", margin, 50);
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

  // ---- Canvas Diagram Page (landscape-style full-bleed grid) ----
  doc.addPage();
  const dpMargin = 36;
  const dpW = pageW - dpMargin * 2;
  let dpY = dpMargin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 24, 56);
  doc.text(`${canvasLabel} — Visual Diagram`, dpMargin, dpY + 4);
  dpY += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 130);
  doc.text(
    "Structured one-page view of the business model derived from the research.",
    dpMargin,
    dpY,
  );
  dpY += 18;

  const diagramH = pageH - dpY - dpMargin - 20;
  const layout = a.canvas_type === "lean" ? LEAN_LAYOUT : BMC_LAYOUT;
  drawCanvasDiagram(doc, layout, a.canvas_data || {}, dpMargin, dpY, dpW, diagramH);

  // ---- Detailed canvas blocks page (full text, no truncation) ----
  doc.addPage();
  y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 24, 56);
  doc.text(`${canvasLabel} — Detailed Breakdown`, margin, y);
  y += 24;

  const blocks = a.canvas_type === "lean" ? LEAN_BLOCKS : BMC_BLOCKS;
  blocks.forEach(([key, label]) => {
    const body = a.canvas_data?.[key] || "—";
    const lines = doc.splitTextToSize(body, contentW - 24);
    const blockH = 28 + lines.length * 12 + 12;
    if (y + blockH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(248, 248, 252);
    doc.setDrawColor(220, 220, 230);
    doc.roundedRect(margin, y, contentW, 28 + lines.length * 12 + 8, 6, 6, "FD");
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
    doc.text(`Generated by Research Venture Ai · Page ${i} of ${pages}`, pageW / 2, pageH - 20, {
      align: "center",
    });
  }

  const safeName = a.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "analysis";
  doc.save(`research-venture-ai-${safeName}.pdf`);
}
