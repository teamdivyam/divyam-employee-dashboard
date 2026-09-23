import { jsPDF } from 'jspdf';
import { amountInWords, RECEIPT_COMPANY } from './eventReceiptPdf';
import { bookingCode, eventDateLabel } from './eventBookingDashboard.utils';
import celebrationUrl from './assets/quotation-celebration.png';

const W = 794, H = 1123, M = 28, CW = W - M * 2, BOTTOM = 1038;
const NAVY = '#0b2032', GOLD = '#96702c', PALE = '#eef2f4', BORDER = '#dfe4e8';
const money = (value) => '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value) || 0);
const date = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
const names = (ids, options) => (ids || []).map((id) => options.find((option) => option.id === id)?.label || 'Unavailable').join(', ') || '—';

// A single canvas renderer supplies both the on-screen preview and the downloaded A4 PDF.
export function renderQuotationPages({ form, record, booking = {}, functions = [], services = [], price }, { logo, celebration, createCanvas = () => document.createElement('canvas') }) {
  const pages = [];
  let ctx, y;
  const font = (size = 10, bold = false, serif = false) => { ctx.font = `${bold ? 'bold' : 'normal'} ${size}px ${serif ? 'Georgia' : 'Arial'}`; };
  const text = (value, x, top, size = 10, bold = false, color = NAVY, serif = false) => { font(size, bold, serif); ctx.fillStyle = color; ctx.fillText(String(value ?? '—'), x, top); };
  const rect = (x, top, width, height, fill = '#ffffff', stroke = BORDER) => { ctx.fillStyle = fill; ctx.fillRect(x, top, width, height); if (stroke) { ctx.strokeStyle = stroke; ctx.strokeRect(x, top, width, height); } };
  const line = (x, top, width, color = GOLD) => { ctx.fillStyle = color; ctx.fillRect(x, top, width, 1); };
  const wrap = (value, width, size = 10, bold = false) => {
    font(size, bold);
    return String(value || '—').split('\n').flatMap((part) => {
      const lines = []; let current = '';
      for (const word of part.split(/\s+/)) {
        if (ctx.measureText(current + (current ? ' ' : '') + word).width <= width) { current += (current ? ' ' : '') + word; continue; }
        if (current) lines.push(current);
        current = '';
        for (const char of word) { if (current && ctx.measureText(current + char).width > width) { lines.push(current); current = ''; } current += char; }
      }
      return [...lines, current];
    });
  };
  const para = (value, x, top, width, size = 10, bold = false) => { const rows = wrap(value, width, size, bold); rows.forEach((row, i) => text(row, x, top + i * (size + 4), size, bold)); return rows.length * (size + 4); };
  const newPage = () => {
    const canvas = createCanvas(); canvas.width = W * 2; canvas.height = H * 2; ctx = canvas.getContext('2d'); ctx.scale(2, 2); ctx.textBaseline = 'top'; rect(0, 0, W, H, '#ffffff', null); pages.push(canvas);
    rect(0, 1056, W, 67, NAVY, null);
    text('Prayagraj   |   Bhadohi   |   Mirzapur   |   Rewa   |   Satna   |   Pratapgarh   |   Jaunpur', M, 1071, 8, false, '#ffffff');
    text('www.divyam.com', 650, 1071, 9, false, '#ffffff');
    text('This quotation is generated electronically from the D I V Y A M® booking system and does not require a physical signature.', M, 1095, 7.5, false, '#ffffff');
    text(String(pages.length), 753, 1095, 8, false, '#ffffff');
    y = 28;
    if (pages.length > 1) { text('DIVYAM  |  QUOTATION', M, y, 18, true, NAVY, true); text(`${record?.quotationNo || 'Draft quotation'} · continued`, M, y + 26, 10); y += 52; }
  };
  const ensure = (height) => { if (y + height > BOTTOM) newPage(); };
  const heading = (title, x = M, width = CW, top = y) => { rect(x, top, width, 28, PALE); rect(x + 5, top + 3, 23, 22, '#f8f0e1', null); text('◇', x + 10, top + 6, 15, true, GOLD); text(title, x + 39, top + 8, 12, true, NAVY, true); };
  // Long paragraphs are divided between pages instead of clipping or shrinking the document.
  const sectionText = (title, value) => {
    const rows = wrap(value, CW - 26);
    let index = 0;
    while (index < rows.length) {
      ensure(70); heading(index ? `${title} (CONTINUED)` : title); y += 36;
      const count = Math.max(1, Math.min(rows.length - index, Math.floor((BOTTOM - y - 14) / 14)));
      rows.slice(index, index + count).forEach((row) => { text(row, M + 12, y); y += 14; });
      index += count; y += 14; if (index < rows.length) newPage();
    }
  };
  newPage();
  const tinted = createCanvas(); tinted.width = logo.naturalWidth || logo.width; tinted.height = logo.naturalHeight || logo.height;
  const tint = tinted.getContext('2d'); tint.drawImage(logo, 0, 0); tint.globalCompositeOperation = 'source-in'; tint.fillStyle = GOLD; tint.fillRect(0, 0, tinted.width, tinted.height);
  ctx.drawImage(tinted, M, 24, 65, 65);
  const brandX = 99, brandWidth = 188;
  const brandLine = (value, top, size, width, color) => {
    font(size, false, true); ctx.fillStyle = color;
    const letters = Array.from(value);
    const glyphWidth = letters.reduce((total, letter) => total + ctx.measureText(letter).width, 0);
    const tracking = (width - glyphWidth) / Math.max(1, letters.length - 1);
    let x = brandX + (brandWidth - width) / 2;
    letters.forEach((letter) => { ctx.fillText(letter, x, top); x += ctx.measureText(letter).width + tracking; });
  };
  brandLine('DIVYAM', 27, 35, brandWidth, NAVY);
  text('®', brandX + brandWidth + 2, 23, 10);
  brandLine('THE PROMISE OF PURITY', 67, 8, brandWidth - 6, NAVY);
  brandLine('THE STANDARD OF LUXURY.', 82, 7, brandWidth - 24, GOLD);
  rect(307, 23, 1, 75, BORDER, null);
  text('Adgenic Communications Private Limited', 320, 25, 10, true);
  text('16/35, New Sohabatiya Bagh, Allahabad,', 320, 42, 9);
  text('Uttar Pradesh 211006, India', 320, 55, 9);
  text(`GSTIN: ${RECEIPT_COMPANY.gstin}  |  CIN: ${RECEIPT_COMPANY.cin}`, 320, 70, 7.5);
  text('+91 92778 02105  |  support@divyam.com  |  www.divyam.com', 320, 87, 8);
  rect(663, 23, 1, 75, BORDER, null);
  ['PEOPLE', 'EVENTS', 'EXPERIENCES', 'THAT STAYS'].forEach((row, i) => text(row, 680, 26 + i * 18, 10, false, GOLD, true));
  line(M, 111, CW);
  text('QUOTATION', M, 126, 44, true, NAVY, true); line(M, 177, 40);
  const titleHeight = para(form.quotationTitle || 'Draft quotation', M, 188, 333, 15);
  const meta = [['Quotation No.', record?.quotationNo || 'Assigned on save'], ['Quotation Type', form.quotationType], ['Version', record?.version ? `v${record.version}` : 'Assigned on save'], ['Issue Date', date(form.issueDate)], ['Valid Until', date(form.validUntil)]];
  const metaHeight = meta.reduce((height, [, value]) => height + Math.max(18, wrap(value, 120, 9).length * 13 + 4), 0);
  rect(379, 124, 240, metaHeight + 20, '#f8f6f2', null);
  rect(477, 134, 1, metaHeight - 4, BORDER, null);
  rect(627, 124, 1, metaHeight + 20, GOLD, null);
  let my = 134;
  meta.forEach(([label, value]) => { text(label, 391, my, 9, true); const height = para(value, 487, my, 120, 9); my += Math.max(18, height + 4); });
  text('MEMORABLE', 643, 153, 14, false, NAVY, true); text('CELEBRATIONS', 643, 173, 14, false, NAVY, true); text('BEAUTIFULLY PLANNED', 643, 196, 9); line(643, 216, 36);
  y = Math.max(242, my + 22, 188 + titleHeight + 15);
  const left = [['Client Name', booking.customer?.name || booking.clientName || '—'], ['Booking ID', bookingCode(booking)], ['Event', booking.eventType || booking.eventName || '—']];
  const right = [['Event Dates', eventDateLabel(booking)], ['Venue', [booking.venue, booking.city].filter(Boolean).join(', ') || '—']];
  const heightOf = (rows) => rows.reduce((sum, [, value]) => sum + Math.max(20, wrap(value, 238).length * 14 + 6), 0);
  const clientHeight = Math.max(heightOf(left), heightOf(right)) + 45;
  ensure(clientHeight); heading('CLIENT & EVENT DETAILS');
  [left, right].forEach((rows, side) => { let top = y + 40; const x = M + 12 + side * 374; rows.forEach(([label, value]) => { text(label, x, top, 9, true); top += Math.max(20, para(value, x + 88, top, 238, 10, label === 'Client Name') + 6); }); });
  y += clientHeight + 10;
  const chipRows = (ids, options, width) => {
    const rows = [[]]; let used = 0;
    (ids || []).forEach((id) => {
      const label = options.find((option) => option.id === id)?.label || 'Unavailable';
      wrap(label, width - 16, 9).forEach((part) => {
        font(9); const size = ctx.measureText(part).width + 16;
        if (used && used + size > width) { rows.push([]); used = 0; }
        rows.at(-1).push({ label: part, x: used, width: size }); used += size + 5;
      });
    });
    return rows;
  };
  const functionChips = chipRows(form.functions, functions, 342), serviceChips = chipRows(form.services, services, 342);
  const chipHeight = Math.max(functionChips.length, serviceChips.length) * 25;
  const scopeLines = wrap(form.scope, CW - 24);
  const fsHeight = 84 + chipHeight + scopeLines.length * 14;
  if (fsHeight < BOTTOM - 90) {
    ensure(fsHeight); heading('FUNCTIONS & SERVICES');
    [[functionChips, 'Functions', '#f8f0e5'], [serviceChips, 'Services', '#eaf1ff']].forEach(([rows, label, color], side) => {
      const x = M + 12 + side * 370; text(label, x, y + 36, 9, true);
      rows.forEach((row, i) => row.forEach((chip) => { rect(x + chip.x, y + 51 + i * 25, chip.width, 21, color, null); text(chip.label, x + chip.x + 8, y + 57 + i * 25, 9); }));
    });
    text('Scope / Description', M + 12, y + 58 + chipHeight, 9, true);
    para(form.scope, M + 12, y + 74 + chipHeight, CW - 24);
    y += fsHeight;
  } else sectionText('FUNCTIONS & SERVICES', 'Functions: ' + names(form.functions, functions) + '\nServices: ' + names(form.services, services) + '\n\nScope / Description\n' + (form.scope || '?'));

  const showRates = form.pdfOptions.showItemWiseRates;
  const columns = showRates ? [30, 189, 110, 53, 60, 130, 166] : [30, 330, 212, 166];
  const labels = showRates ? ['#', 'Service / Item', 'Applies To', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'] : ['#', 'Service / Item', 'Applies To', 'Amount (₹)'];
  const tableHeader = () => { ensure(80); heading('COMMERCIALS'); y += 33; let x = M; labels.forEach((label, i) => { rect(x, y, columns[i], 26, '#f5f7f9'); text(label, x + 6, y + 8, 9, true); x += columns[i]; }); y += 26; };
  tableHeader();
  form.lineItems.forEach((row, index) => {
    const common = [String(index + 1), row.item || '—', names(row.appliesTo, functions)];
    const values = showRates ? [...common, row.quantity, row.unit, money(row.rate), money(Math.round(Number(row.quantity) * Number(row.rate) * 100) / 100)] : [...common, money(Math.round(Number(row.quantity) * Number(row.rate) * 100) / 100)];
    const lines = values.map((value, i) => wrap(value, columns[i] - 12, 9));
    let offset = 0; const total = Math.max(...lines.map((rows) => rows.length));
    while (offset < total) {
      if (y + 28 > BOTTOM) { newPage(); tableHeader(); }
      const count = Math.min(total - offset, Math.max(1, Math.floor((BOTTOM - y - 12) / 13)));
      const height = count * 13 + 12; let x = M;
      lines.forEach((rows, i) => { rect(x, y, columns[i], height); rows.slice(offset, offset + count).forEach((value, j) => text(value, x + 6, y + 6 + j * 13, 9)); x += columns[i]; }); y += height; offset += count;
    }
  });
  y += 10;
  const words = amountInWords(Number(price.finalQuotationValue));
  const summaryHeight = Math.max(174, 159 + wrap(words, 278, 9).length * 13);
  ensure(summaryHeight + 12);
  ctx.save(); ctx.beginPath(); ctx.rect(M, y, 424, summaryHeight); ctx.clip();
  const ratio = Math.max(424 / celebration.width, summaryHeight / celebration.height);
  ctx.drawImage(celebration, M + 424 - celebration.width * ratio, y + (summaryHeight - celebration.height * ratio) / 2, celebration.width * ratio, celebration.height * ratio);
  const gradient = ctx.createLinearGradient(M, 0, M + 300, 0); gradient.addColorStop(0, 'rgba(5,20,28,.85)'); gradient.addColorStop(1, 'rgba(5,20,28,0)'); ctx.fillStyle = gradient; ctx.fillRect(M, y, 424, summaryHeight); ctx.restore();
  line(M + 20, y + 68, 40); ['CRAFTING', 'EXTRAORDINARY', 'EXPERIENCES'].forEach((row, i) => text(row, M + 20, y + 82 + i * 18, 12, false, '#ffffff', true));
  const sx = 461, sw = 305;
  [['Subtotal', price.subtotal], [`Discount${form.discount.type === 'Percentage' ? ` (${form.discount.value}%)` : ''}`, -price.discountAmount], ['Taxable Value', price.taxableValue], [`GST (${form.gstRate}%)`, price.gstAmount]].forEach(([label, value], i) => { rect(sx, y + i * 23, sw, 23); text(label, sx + 10, y + i * 23 + 6); font(11, true); text(money(value), sx + sw - 10 - ctx.measureText(money(value)).width, y + i * 23 + 6, 11, true); });
  rect(sx, y + 92, sw, 37, NAVY, null); text('Final Quotation Value', sx + 10, y + 104, 11, true, '#ffffff');
  let amountSize = 19; font(amountSize, true); while (ctx.measureText(money(price.finalQuotationValue)).width > 155 && amountSize > 9) { font(--amountSize, true); }
  text(money(price.finalQuotationValue), sx + sw - 10 - ctx.measureText(money(price.finalQuotationValue)).width, y + 102, amountSize, true, '#ffffff');
  rect(sx, y + 129, sw, summaryHeight - 129, '#f8f0e5', null); text('Amount in Words', sx + 10, y + 136, 8, true); para(words, sx + 10, y + 151, sw - 20, 9);
  y += summaryHeight + 12;
  if (form.pdfOptions.showTermsAndConditions) {
    const terms = [['Payment Terms', form.paymentTerms], ['Inclusions', form.inclusions], ['Exclusions', form.exclusions], ['Special Terms', form.specialTerms]].filter(([, value]) => value);
    const th = 36 + terms.reduce((sum, [, value]) => sum + 16 + wrap(value, 389, 9).length * 13, 0);
    if (Math.max(th, 205) <= BOTTOM - y) {
      heading('TERMS & CONDITIONS', M, 420); let top = y + 35;
      terms.forEach(([label, value]) => { text(label, M + 14, top, 9, true); top += 15 + para(value, M + 14, top + 13, 389, 9) + 1; });
      heading('QUOTATION VALIDITY', 461, 305); para(`This quotation is valid until ${date(form.validUntil)}.\nAfter this date, pricing and terms may be subject to revision.`, 475, y + 40, 275, 9);
      heading('THANK YOU', 461, 305, y + 85); para('We appreciate the opportunity to be a part of your special celebration. For any queries or further discussions, please feel free to contact our team.\n\nTeam D I V Y A M®', 475, y + 123, 275, 9);
      y += Math.max(th, 205);
    } else {
      terms.forEach(([label, value]) => sectionText(`TERMS & CONDITIONS · ${label.toUpperCase()}`, value));
      sectionText('QUOTATION VALIDITY & THANK YOU', `This quotation is valid until ${date(form.validUntil)}. After this date, pricing and terms may be subject to revision.\n\nThank you for the opportunity to be part of your celebration. For any queries, please contact our team.\nTeam D I V Y A M®`);
    }
  } else sectionText('QUOTATION VALIDITY & THANK YOU', `Valid until ${date(form.validUntil)}. After this date, pricing and terms may be subject to revision.\nThank you for the opportunity to be part of your celebration. Team D I V Y A M®`);
  return pages;
}

export async function prepareQuotationPdf(input) {
  const load = (url) => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Unable to load quotation artwork. Please retry.')); image.src = url; });
  const [logo, celebration] = await Promise.all([load(new URL('img/logo.png', new URL(import.meta.env.BASE_URL, window.location.origin)).href), load(celebrationUrl)]);
  const pages = renderQuotationPages(input, { logo, celebration });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  pdf.setProperties({ title: `Quotation ${input.record?.quotationNo || 'Draft'}`, author: 'Divyam', subject: input.form.quotationTitle });
  const previews = pages.map((canvas) => canvas.toDataURL('image/png'));
  previews.forEach((data, index) => { if (index) pdf.addPage(); pdf.addImage(data, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), undefined, 'FAST'); });
  const name = [input.booking?.customer?.name, input.booking?.clientName, input.booking?.eventName, input.booking?.eventType]
    .filter((value) => typeof value === 'string')
    .map((value) => value.replace(/[<>:"/\\|?*]/g, '').trim())
    .find(Boolean) || 'Client';
  return { pdf, previews, filename: `QT for ${name}.pdf` };
}
