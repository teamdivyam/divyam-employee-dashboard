import { jsPDF } from "jspdf";
import { assertAllocationReportComplete } from "./allocationReportData.js";

const NAVY = "#101636", MUTED = "#596b88", BORDER = "#dce3e8", GOLD = "#c58a32";
const LEFT = 8, WIDTH = 194, BOTTOM = 284, CONTENT_TOP = 24;
const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "—";
const colors = category => {
  const palettes = [["#fff3e9", "#a44016"], ["#e5f7f2", "#087965"], ["#fff8e3", "#916018"], ["#e9f3ff", "#2466a1"], ["#f7edf8", "#82408e"]];
  return palettes[Array.from(category || "").reduce((sum, c) => sum + c.charCodeAt(0), 0) % palettes.length];
};

// Presentation only: quantities and source membership are supplied by the saved allocation adapter.
export function createAllocationPdf(report, images = new Map()) {
  if (!report?.groups?.length) throw new Error("No verified allocation sources available for the report.");
  if (report.rows) assertAllocationReportComplete(report);
  const renderedGroups = [];
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  doc.setProperties({ title: `DIVYAM Event Allocation ${report.reference}`, creator: "DIVYAM Inventory System" });
  const text = (value, x, y, size = 8, bold = false, color = NAVY, align = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(color);
    doc.text(String(value ?? "—"), x, y, { align });
  };
  const wrap = (value, width, size = 8, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    return doc.splitTextToSize(String(value || "—"), width);
  };
  const rect = (x, y, w, h, fill) => {
    doc.setLineWidth(0.18); doc.setDrawColor(BORDER);
    if (fill) doc.setFillColor(fill);
    doc.rect(x, y, w, h, fill ? "FD" : "S");
  };
  const rule = (x, y, w) => { doc.setDrawColor("#a7b4c8"); doc.setLineWidth(0.18); doc.line(x, y, x + w, y); };
  const linesAt = (lines, x, y, size = 8, bold = false, color = NAVY) => lines.forEach((part, i) => text(part, x, y + i * 3.3, size, bold, color));
  const branding = () => {
    text("D I V Y A M", LEFT + 1, 15, 19);
    doc.setFont("helvetica", "italic"); doc.setFontSize(7.4); doc.setTextColor(NAVY);
    doc.text("The Standard Of Luxury.", LEFT + 1, 20);
    const pageCenter = doc.internal.pageSize.getWidth() / 2;
    text("INVENTORY DISPATCH SHEET", pageCenter, 13.5, 12, true, NAVY, "center");
    text("E V E N T   A L L O C A T I O N", pageCenter, 19.5, 6.5, false, NAVY, "center");
    const tagline = "PEOPLE  |  PLANNING  |  PERFECTION";
    text(tagline, LEFT + WIDTH, 15, 6, false, GOLD, "right");
    doc.setDrawColor(GOLD); doc.setLineWidth(0.18);
    doc.line(LEFT + WIDTH - doc.getTextWidth(tagline), 18, LEFT + WIDTH, 18);
  };
  let y = CONTENT_TOP;
  const period = report.requiredFrom && report.releaseBy ? `${date(report.requiredFrom)} - ${date(report.releaseBy)}` : "—";
  const fields = [["EVENT NAME", report.eventName, 48.5], ["EVENT DATE", date(report.eventDate), 48.5], ["VENUE", report.venue, 48.5], ["ALLOCATION PERIOD", period, 48.5]];
  const cells = fields.map(([label, value, width]) => ({ label, width, lines: wrap(value, width - 5, 8, true) }));
  const metaHeight = Math.max(15, ...cells.map(cell => 7 + cell.lines.length * 3.3));
  if (metaHeight > 100) throw new Error("Event details are too long to print safely.");
  const eventPanel = () => {
    let x = LEFT;
    for (const cell of cells) { rect(x, y, cell.width, metaHeight, "#f8fafc"); text(cell.label, x + 2.5, y + 4, 6.3); linesAt(cell.lines, x + 2.5, y + 8, 8, true); x += cell.width; }
    y += metaHeight + 1.5;
  };
  const categories = new Map();
  for (const group of report.groups) for (const row of group.rows) {
    const category = String(row.category || "").trim() || "Uncategorized";
    if (!categories.has(category)) categories.set(category, new Map());
    const sources = categories.get(category);
    if (!sources.has(group.key)) sources.set(group.key, { ...group, rows: [] });
    sources.get(group.key).rows.push(row);
  }
  const categoryEndPages = new Set();
  let categoryIndex = 0;
  for (const [category, sources] of categories) {
    if (categoryIndex++) doc.addPage();
    branding(); y = CONTENT_TOP; eventPanel();
    const categoryHeading = continued => {
      const parts = wrap(`CATEGORY: ${category}${continued ? " (Continued)" : ""}`, WIDTH - 6, 9, true);
      const height = parts.length * 3.3 + 3;
      rect(LEFT, y, WIDTH, height, "#f8eedf");
      linesAt(parts, LEFT + 3, y + 4, 9, true); y += height + 1;
    };
    categoryHeading(false);
    const continuationTop = CONTENT_TOP + wrap(`CATEGORY: ${category} (Continued)`, WIDTH - 6, 9, true).length * 3.3 + 4;
    const newPage = () => { doc.addPage(); branding(); y = CONTENT_TOP; categoryHeading(true); };
    const nameOrder = new Intl.Collator("en", { sensitivity: "accent" });
    const idOrder = new Intl.Collator("en", { sensitivity: "variant" });
    const categoryGroups = [...sources.values()].map(group => ({
      ...group,
      rows: [...group.rows].sort((a, b) =>
        nameOrder.compare(String(a.name || ""), String(b.name || "")) ||
        idOrder.compare(String(a.lineId || a.itemId || ""), String(b.lineId || b.itemId || "")) ||
        idOrder.compare(String(a.itemId || ""), String(b.itemId || "")) ||
        idOrder.compare(String(a.allocationId || ""), String(b.allocationId || ""))),
    }));
  const quantityLabel = "Dispatch Qty";
  const totals = new Map();
  const addTotal = (target, row) => target.set(row.unit || "Unspecified unit", (target.get(row.unit || "Unspecified unit") || 0) + row.quantity);
  const totalText = values => [...values].map(([unit, quantity]) => `${quantity} ${unit}`).join("  |  ");
  for (const group of categoryGroups) for (const row of group.rows) addTotal(totals, row);
  const notes = ["Verify item condition, quantity and accessories before dispatch.", "Pack carefully to prevent transportation damage.", ...(categoryGroups.some(group => group.type === "event") ? ["Release event-transfer items according to the verified schedule."] : []), "Update dispatch status in the system after loading.", "Report shortage or damage to the inventory head."];
  const noteLines = notes.flatMap((note, i) => wrap(`${i + 1}. ${note}`, 94, 7));
  const totalsLines = wrap(totalText(totals), 82, 10, true);
  const totalHeading = wrap(`TOTAL DISPATCH — ${category}`, 82, 8, true);
  const totalValueY = 8 + totalHeading.length * 3.3;
  const topHeight = Math.max(24, 8 + noteLines.length * 3.3, totalValueY + totalsLines.length * 4);
  const footerHeight = topHeight + 30;
  for (const group of categoryGroups) {
    if (!group.rows.length) continue;
    const rendered = { ...group, rows: [] };
    renderedGroups.push(rendered);
    const transfer = group.type === "event";
    const widths = transfer ? [8, 46, 17, 23, 17, 12, 22, 19, 15, 15] : [8, 50, 17, 26, 17, 12, 30, 17, 17];
    const headers = ["#", "Item", "Item ID", "Category", quantityLabel, "Unit", ...(transfer ? ["Release Date / Time"] : []), "Remarks", "Dispatched", "Return"];
    const headerHeight = Math.max(...headers.map((label, i) => wrap(label, widths[i] - 2, 6.8, true).length)) * 3 + 3;
    const sectionHeader = continued => {
      const title = `DISPATCH FROM: ${group.name}${transfer ? " (Event Transfer)" : ""}${continued ? " (Continued)" : ""}`;
      const titleLines = wrap(title, 115, 9, true);
      const destinationLines = wrap(`Destination: ${report.eventName || "—"}${report.venue ? ` | ${report.venue}` : ""}`, 70, 7);
      const height = Math.max(7, Math.max(titleLines.length, destinationLines.length) * 3.3 + 3);
      rect(LEFT, y, WIDTH, height, transfer ? "#f3dfbc" : "#1a3545");
      linesAt(titleLines, LEFT + 3, y + 4, 9, true, transfer ? NAVY : "#ffffff");
      linesAt(destinationLines, LEFT + 121, y + 4, 7, false, transfer ? NAVY : "#ffffff");
      y += height; let xx = LEFT;
      headers.forEach((label, i) => { rect(xx, y, widths[i], headerHeight, "#f0f3f5"); const parts = wrap(label, widths[i] - 2, 6.8, true); parts.forEach((part, j) => text(part, xx + widths[i] / 2, y + 4 + j * 3, 6.8, true, NAVY, "center")); xx += widths[i]; });
      y += headerHeight;
    };
    const titleHeight = continued => Math.max(7, Math.max(wrap(`DISPATCH FROM: ${group.name}${transfer ? " (Event Transfer)" : ""}${continued ? " (Continued)" : ""}`, 115, 9, true).length, wrap(`Destination: ${report.eventName || "—"}${report.venue ? ` | ${report.venue}` : ""}`, 70, 7).length) * 3.3 + 3);
    const rows = group.rows.map(row => {
      if (!Number.isFinite(row.quantity) || row.quantity < 0) throw new Error("Source quantity is unavailable. No report was downloaded.");
      const release = row.releaseAt ? String(row.releaseAt) : "—";
      const values = ["", row.name, row.itemId, row.category, String(row.quantity), row.unit, ...(transfer ? [release] : []), row.remarks || "", "", ""];
      const wrapped = values.map((value, i) => value ? wrap(value, widths[i] - (i === 1 ? 24 : 4), 7.5, i === 1) : []);
      return { ...row, wrapped, height: Math.max(21, ...wrapped.map(parts => parts.length * 3.3 + 4)) };
    });
    const subtotal = new Map();
    const expectedTotal = rows.reduce((acc, entry) => { addTotal(acc, entry); return acc; }, new Map());
    const totalHeight = Math.max(7, wrap(`Total (${group.name}): ${totalText(expectedTotal)}`, WIDTH - 6, 8, true).length * 3.3 + 3);
    const firstRowEnd = rows.length === 1 ? totalHeight + (group === categoryGroups.at(-1) ? footerHeight + 1.5 : 0) : 0;
    if (y + titleHeight(false) + headerHeight + rows[0].height + firstRowEnd > BOTTOM) newPage();
    sectionHeader(false);
    rows.forEach((row, index) => {
      const endTotal = index === rows.length - 1 ? totalHeight + (group === categoryGroups.at(-1) ? footerHeight + 1.5 : 0) : 0;
      if (row.height + titleHeight(true) + headerHeight + endTotal > BOTTOM - continuationTop) throw new Error("An allocation row is too long to print safely without splitting.");
      if (y + row.height + endTotal > BOTTOM) { newPage(); sectionHeader(true); }
      let xx = LEFT;
      widths.forEach((width, i) => {
        rect(xx, y, width, row.height);
        if (i === 0) text(index + 1, xx + width / 2, y + row.height / 2 + 1, 8, true, NAVY, "center");
        else if (i === 1) {
          const photo = images.get(row.image), px = xx + 1, area = 20;
          if (row.image && !photo) throw new Error("An allocation item image is missing. No incomplete PDF was downloaded.");
          if (photo) { const w = Math.min(area, area * photo.ratio), h = w / photo.ratio; doc.addImage(photo.data, "JPEG", px + (area - w) / 2, y + (row.height - h) / 2, w, h, row.image, "FAST"); }
          else { rect(px + 1, y + (row.height - 14) / 2, 18, 14, "#f8fafc"); text("No image", px + 10, y + row.height / 2 + 1, 6, false, MUTED, "center"); }
          linesAt(row.wrapped[i], xx + 22, y + (row.height - row.wrapped[i].length * 3.3) / 2 + 2.7, 7.5, true);
        } else if (i >= widths.length - 2) {
          doc.setDrawColor(MUTED); doc.setLineWidth(0.35); doc.roundedRect(xx + (width - 4) / 2, y + (row.height - 4) / 2, 4, 4, 0.3, 0.3);
        } else {
          const parts = row.wrapped[i], start = y + (row.height - parts.length * 3.3) / 2 + 2.7;
          if (i === 3) { const [bg, fg] = colors(row.category); rect(xx + 1.5, start - 3, width - 3, parts.length * 3.3 + 2, bg); linesAt(parts, xx + 2, start, 7.5, false, fg); }
          else if ([2, 4, 5].includes(i)) parts.forEach((part, j) => text(part, xx + width / 2, start + j * 3.3, 7.5, i === 4, i === 4 ? NAVY : MUTED, "center"));
          else linesAt(parts, xx + 2, start, 7.5, false, MUTED);
        }
        xx += width;
      });
      rendered.rows.push(row);
      addTotal(subtotal, row); y += row.height;
    });
    const summary = wrap(`Total (${group.name}): ${totalText(subtotal)}`, WIDTH - 6, 8, true);
    const height = Math.max(7, summary.length * 3.3 + 3);
    rect(LEFT, y, WIDTH, height, "#f8eedf"); linesAt(summary, LEFT + 3, y + 4, 8, true); y += height + 1.5;
  }
  if (y + footerHeight > BOTTOM) newPage();
  rect(LEFT, y, 89, topHeight, "#fcf7ef"); linesAt(totalHeading, LEFT + 3, y + 5, 8, true);
  totalsLines.forEach((part, i) => text(part, LEFT + 3, y + totalValueY + i * 4, 10, true));
  rect(LEFT + 92, y, 102, topHeight, "#f8fafc"); text("Important Notes:", LEFT + 95, y + 4, 8, true); linesAt(noteLines, LEFT + 95, y + 8, 7, false, MUTED);
  y += topHeight + 2;
  ["Prepared By", "Checked By", "Loaded By", "Vehicle / Driver Details"].forEach((title, i) => {
    const xx = LEFT + i * WIDTH / 4, width = WIDTH / 4;
    rect(xx, y, width, 28); text(title, xx + 3, y + 4, 7.5, true);
    if (i < 3) { text(["(Inventory)", "(Warehouse)", "(Dispatch Team)"][i], xx + 3, y + 8, 7, false, MUTED); rule(xx + 3, y + 17, width - 6); text("Name & Signature", xx + 3, y + 21, 6.5, false, MUTED); text("Date:", xx + 3, y + 26, 7, false, MUTED); rule(xx + 11, y + 26, width - 15); }
    else ["Driver Name:", "Vehicle No.:", "Departure Time:", "Signature:"].forEach((label, j) => { text(label, xx + 3, y + 10 + j * 5, 6.5, false, MUTED); rule(xx + 23, y + 10 + j * 5, width - 26); });
  });
  categoryEndPages.add(doc.getNumberOfPages());
  }
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page); text(`Page ${page} of ${doc.getNumberOfPages()}`, 202, 290, 7, false, MUTED, "right");
    if (!categoryEndPages.has(page)) text("Continued on next page", LEFT, 290, 7, false, MUTED);
  }
  if (report.rows) assertAllocationReportComplete({ ...report, groups: renderedGroups });
  return doc;
}
