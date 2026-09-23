import { jsPDF } from 'jspdf';

// Static legal identifiers are maintained here, independently of receipt API data.
export const RECEIPT_COMPANY = { gstin: '09AAWCA8443J1ZW', cin: 'U74300UP2022PTC162452' };

const NAVY = '#142a43';
const GOLD = '#baa269';
const MUTED = '#596778';
const PALE = '#edf1f4';
const BORDER = '#dfe5e9';
const PAGE_W = 794;
const PAGE_H = 1123;
const MARGIN = 36;
const WIDTH = PAGE_W - MARGIN * 2;
const SCALE = 2;
const SOCIAL_X = 607;
const FOOTER_LINKS = [
  { x: SOCIAL_X - 3, url: 'https://www.instagram.com/divyam_india/' },
  { x: SOCIAL_X + 20, url: 'https://www.facebook.com/letsdivyam' },
];
const textValue = (value, fallback = '-') => typeof value === 'string' || typeof value === 'number' ? String(value).trim() || fallback : fallback;
const amountValue = (value) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const money = (value) => value === null ? '-' : '\u20b9' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
const dateLabel = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '-';

export function amountInWords(amount) {
  if (!Number.isFinite(amount) || amount < 0 || amount > 99999999999) return '';
  const small = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const words = (number) => {
    if (number < 20) return small[number];
    if (number < 100) return tens[Math.floor(number / 10)] + (number % 10 ? ' ' + words(number % 10) : '');
    for (const [size, label] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand'], [100, 'Hundred']]) {
      if (number >= size) return words(Math.floor(number / size)) + ' ' + label + (number % size ? ' ' + words(number % size) : '');
    }
  };
  const paise = Math.round(amount * 100);
  return 'Rupees ' + words(Math.floor(paise / 100)) + (paise % 100 ? ' and ' + words(paise % 100) + ' Paise' : '') + ' Only';
}

export function receiptModel(receipt, booking = {}, generatedAt = new Date()) {
  console.log("receipt:", receipt);
  const snapshot = receipt.bookingPaymentSummary;
  const total = amountValue(snapshot?.contractValue ?? booking.paymentSummary?.totalAmount ?? booking.finance?.bookingValue);
  const received = amountValue(snapshot?.totalReceived ?? booking.paymentSummary?.receivedAmount ?? booking.finance?.amountReceived);
  const pending = amountValue(snapshot?.pendingAmount ?? booking.paymentSummary?.pendingAmount ?? booking.finance?.amountPending ?? (total !== null && received !== null ? total - received : null));
  const start = booking.eventStartDate || booking.eventDate;
  const end = booking.eventEndDate;
  const customer = booking.customer || {};
  const billingAddress = receipt.billingAddress ?? booking.billingAddress ?? customer.billingAddress;
  const address = typeof billingAddress === 'object' && billingAddress ? [billingAddress.addressLine1, billingAddress.addressLine2, billingAddress.city, billingAddress.state, billingAddress.pincode].filter(Boolean).join(', ') : billingAddress;
  return {
    number: textValue(receipt.receiptNumber, textValue(receipt._id, 'Receipt')),
    issued: dateLabel(receipt.issuedOn || receipt.receiptDate || receipt.paymentDate),
    client: textValue(receipt.receivedFrom || customer.name || booking.clientName),
    address: textValue(address, '-'),
    gst: textValue(booking.gstIn || receipt.gstIn || receipt.gstin || booking.gstin || customer.gstIn || customer.gstin),
    booking: booking._id ? `BK-${new Date(generatedAt).getFullYear()}-${String(booking._id).slice(-4).toUpperCase()}` : '-',
    event: textValue(booking.eventType || booking.eventName),
    dates: dateLabel(start) + (end && end.slice(0, 10) !== start?.slice(0, 10) ? ' - ' + dateLabel(end) : ''),
    venue: [textValue(booking.venue, ''), textValue(booking.city, '')].filter(Boolean).join(', ') || '-',
    amount: amountValue(receipt.amount),
    against: textValue(booking.eventType || booking.eventName),
    paymentDate: dateLabel(receipt.paymentDate || receipt.receiptDate),
    mode: textValue(receipt.paymentMode),
    reference: textValue(receipt.reference || receipt.transactionId),
    status: receipt.receiptStatus === 'Cancelled' ? 'Cancelled' : textValue(receipt.paymentStatus, 'Received'),
    total, received, pending,
    summaryDate: dateLabel(snapshot?.asOf || generatedAt),
  };
}

// Canvas uses the browser's Unicode fonts so rupee symbols and client names remain intact.
// Each logical section stays together; unusually long data continues on another A4 page.
export function renderReceiptPages(model, createCanvas = () => document.createElement('canvas'), logo) {
  const pages = [];
  let canvas, ctx, y;
  const font = (size = 12, bold = false, serif = false) => { ctx.font = `${bold ? 'bold' : 'normal'} ${size}px ${serif ? '"Times New Roman"' : 'Arial'}, sans-serif`; };
  const rect = (x, top, width, height, fill, stroke) => { if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, top, width, height); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x, top, width, height); } };
  const line = (x, top, right, bottom, color = GOLD) => { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(right, bottom); ctx.stroke(); };
  const text = (value, x, top, size = 12, bold = false, color = NAVY, serif = false) => { font(size, bold, serif); ctx.fillStyle = color; for (const part of String(value).split(/(\u00ae)/)) {
    const registered = part === '\u00ae';
    font(registered ? size * 0.65 : size, bold, serif);
    ctx.fillText(part, x, top - (registered ? size * 0.3 : 0));
    x += ctx.measureText(part).width;
  } font(size, bold, serif); };
  const trackedText = (value, x, top, size = 12, spacing = 1.2) => {
    font(size, true); ctx.fillStyle = NAVY;
    for (const character of value) { ctx.fillText(character, x, top); x += ctx.measureText(character).width + spacing; }
    return x;
  };
  const wrap = (value, width, size = 12, bold = false) => {
    font(size, bold);
    const lines = [];
    for (const paragraph of String(value).split('\n')) {
      let current = '';
      for (const word of paragraph.split(/[ \t\r]+/)) {
        if (ctx.measureText(current + (current ? ' ' : '') + word).width <= width) { current += (current ? ' ' : '') + word; continue; }
        if (current) lines.push(current);
        current = '';
        for (const char of word) {
          if (ctx.measureText(current + char).width > width && current) { lines.push(current); current = ''; }
          current += char;
        }
      }
      lines.push(current);
    }
    return lines;
  };
  const paragraph = (value, x, top, width, size = 12, bold = false, color = NAVY) => { const lines = wrap(value, width, size, bold); lines.forEach((row, i) => text(row, x, top + i * (size + 5), size, bold, color)); return lines.length * (size + 5); };
  const footer = () => {
    const top = PAGE_H - 43, center = top + 22;
    rect(0, top, PAGE_W, 43, '#0c2038');
    // Vector icons remain sharp in the generated PDF at every scale.
    ctx.save(); ctx.translate(MARGIN + 3, center - 1);
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-2, 5, -6, 0, -6, -3);
    ctx.arc(0, -3, 6, Math.PI, 0); ctx.bezierCurveTo(6, 0, 2, 5, 0, 8); ctx.fill();
    ctx.fillStyle = '#0c2038'; ctx.beginPath(); ctx.arc(0, -3, 2.1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    let locationX = MARGIN + 17;
    const locations = ['Prayagraj', 'Bhadohi', 'Mirzapur', 'Rewa', 'Satna', 'Pratapgarh', 'Jaunpur'];
    locations.forEach((location, index) => {
      text(location, locationX, center - 4, 8.3, false, '#ffffff');
      locationX += ctx.measureText(location).width;
      if (index < locations.length - 1) { line(locationX + 10, center - 5, locationX + 10, center + 5, GOLD); locationX += 22; }
    });
    const socialX = SOCIAL_X;
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.roundRect(socialX, center - 6, 11, 11, 3); ctx.stroke();
    ctx.beginPath(); ctx.arc(socialX + 5.5, center - 0.5, 2.7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(socialX + 8.7, center - 3.7, 0.9, 0, Math.PI * 2); ctx.fill();
    text('f', socialX + 23, center - 8, 16, true, '#ffffff');
    ctx.restore();
    line(651, center - 9, 651, center + 9, GOLD);
    text('www.divyam.com', 668, center - 5, 10, false, '#ffffff');
  };
  const newPage = () => {
    canvas = createCanvas(); canvas.width = PAGE_W * SCALE; canvas.height = PAGE_H * SCALE; ctx = canvas.getContext('2d'); ctx.scale(SCALE, SCALE); ctx.textBaseline = 'top'; rect(0, 0, PAGE_W, PAGE_H, '#ffffff'); pages.push(canvas); footer(); y = 36;
    if (pages.length > 1) { text('DIVYAM  |  PAYMENT RECEIPT', MARGIN, y, 16, true); text(model.number + ' - continued', MARGIN, y + 24, 11, false, MUTED); y += 60; }
  };
  const ensure = (height) => { if (y + height > PAGE_H - 65) newPage(); };
  const section = (title, height) => { ensure(height + 18); rect(MARGIN, y, WIDTH, height, '#ffffff', BORDER); rect(MARGIN, y, WIDTH, 28, PALE); const [heading, suffix] = title.split(' ('); const headingEnd = trackedText(heading, MARGIN + 12, y + 8); if (suffix) text(' (' + suffix, headingEnd, y + 8, 11, false); const top = y + 28; y += height + 16; return top; };
  const pairHeight = (label, value, width) => Math.max(19, wrap(value, width, 12).length * 17 + 6);
  const pairs = (rows, x, top, valueOffset, width) => {
    let current = top;
    rows.forEach(([label, value]) => {
      text(label, x, current, 11, true);
      if (label === 'Payment Status') {
        const cancelled = value === 'Cancelled';
        font(12, true);
        const badgeWidth = Math.min(width + 8, ctx.measureText(value).width + 24);
        ctx.fillStyle = cancelled ? '#fce8e8' : '#dcfce7';
        ctx.beginPath(); ctx.roundRect(x + valueOffset - 7, current - 5, badgeWidth, 25, 4); ctx.fill();
        paragraph(value, x + valueOffset + 4, current, width - 8, 12, true, cancelled ? '#b91c1c' : '#15803d');
      } else paragraph(value, x + valueOffset, current, width, 12, label === 'Received From');
      current += pairHeight(label, value, width);
    });
    return current;
  };
  newPage();
  if (logo) {
    // Tint only the logo's existing alpha mask; the source file and transparent background stay intact.
    const logoCanvas = createCanvas(); logoCanvas.width = 144; logoCanvas.height = 144;
    const logoContext = logoCanvas.getContext('2d');
    logoContext.drawImage(logo, 0, 0, 144, 144);
    logoContext.globalCompositeOperation = 'source-in';
    logoContext.fillStyle = NAVY; logoContext.fillRect(0, 0, 144, 144);
    ctx.drawImage(logoCanvas, MARGIN - 4, 28, 78, 78);
  }
  // Both lines share the same visual width, as in the brand reference.
  const brandX = 114, brandWidth = 210;
  const brandLine = (value, top, size, serif, color, width = brandWidth, inset = 0) => {
    font(size, false, serif); ctx.fillStyle = color;
    const letters = Array.from(value);
    const glyphWidth = letters.reduce((sum, letter) => sum + ctx.measureText(letter).width, 0);
    const spacing = (width - glyphWidth) / (letters.length - 1);
    let x = brandX + inset;
    letters.forEach((letter) => { ctx.fillText(letter, x, top); x += ctx.measureText(letter).width + spacing; });
  };
  brandLine('DIVYAM', 30, 46, true, NAVY);
  const trademarkX = brandX + brandWidth + 9;
  ctx.strokeStyle = NAVY; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(trademarkX, 35, 6, 0, Math.PI * 2); ctx.stroke();
  text('R', trademarkX - 3, 31, 9);
  brandLine('THE PROMISE OF PURITY', 86, 9, false, MUTED, brandWidth - 5, 2.5);
  line(345, 26, 345, 116);
  text('Adgenic Communications Private Limited', 354, 29, 13, true);
  text('16/35, New Sohabatiya Bagh, Allahabad,', 354, 51, 10);
  text('Uttar Pradesh 211006, India', 354, 65, 10);
  text(`GSTIN: ${RECEIPT_COMPANY.gstin || '-'}   |   CIN: ${RECEIPT_COMPANY.cin || '-'}`, 354, 82, 10);
  text('+91 92778 02105   |   support@divyam.com   |   www.divyam.com', 354, 101, 10);
  line(682, 26, 682, 116, BORDER);
  ['PEOPLE', 'EVENTS', 'EXPERIENCES', 'THAT STAYS'].forEach((row, i) => text(row, 695, 31 + i * 22, 9.5, true, GOLD));
  line(MARGIN, 133, PAGE_W - MARGIN, 133);
  text('PAYMENT RECEIPT', MARGIN, 155, 40, true);
  text('T H A N K  Y O U  F O R  Y O U R  T R U S T', MARGIN, 202, 9, false, MUTED);
  rect(468, 153, 290, 67, '#f4f6f8');
  text('Receipt No.', 483, 166, 11); paragraph(model.number, 483, 187, 155, 12, true); line(645, 162, 645, 211, BORDER);
  text('Issue Date', 658, 166, 11); text(model.issued, 658, 187, 12, true);
  y = 240;
  const leftRows = [['Received From', model.client], ['Billing Address', model.address], ['GSTIN', model.gst], ['Booking ID', model.booking], ['Event', model.event]];
  const rightRows = [['Event Dates', model.dates], ['Venue', model.venue]];
  const clientHeight = Math.max(leftRows.reduce((sum, [label, value]) => sum + pairHeight(label, value, 227), 0), rightRows.reduce((sum, [label, value]) => sum + pairHeight(label, value, 180), 0)) + 52;
  let top = section('CLIENT & BOOKING DETAILS', clientHeight);
  pairs(leftRows, 52, top + 14, 118, 227); line(411, top + 12, 411, top + clientHeight - 40); pairs(rightRows, 434, top + 18, 100, 180);
  const paymentRows = [['Payment Against', model.against], ['Payment Date', model.paymentDate], ['Payment Mode', model.mode], ['Payment Reference', model.reference], ['Payment Status', model.status]];
  const words = model.amount === null ? '' : amountInWords(model.amount);
  const paymentHeight = Math.max(168, paymentRows.reduce((sum, [label, value]) => sum + pairHeight(label, value, 172), 0) + 28, 112 + wrap(words, 306, 14).length * 19);
  top = section('PAYMENT DETAILS', paymentHeight + 28);
  rect(MARGIN, top, 360, paymentHeight, NAVY);
  text('A M O U N T  R E C E I V E D', 58, top + 23, 9, false, '#ffffff');
  let amountFont = 55; font(amountFont, false, true); while (ctx.measureText(money(model.amount)).width > 315 && amountFont > 20) { amountFont -= 1; font(amountFont, false, true); }
  text(money(model.amount), 58, top + 46, amountFont, false, '#ffffff', true); line(58, top + 104, 185, top + 104);
  const wordLines = wrap(words, 310, 14);
  wordLines.forEach((row, index) => text(row, 58, top + 119 + index * 19, 15, false, '#ffffff', true));
  pairs(paymentRows, 424, top + 22, 137, 178);
  top = section(`BOOKING PAYMENT SUMMARY (AS OF ${model.summaryDate.toUpperCase()})`, 86);
  [['Contract Value', model.total], ['Received Till Date', model.received], ['Balance Pending', model.pending]].forEach(([label, value], index) => { const x = MARGIN + index * WIDTH / 3; text(label, x + 42, top + 10, 11, false, MUTED); text(money(value), x + 42, top + 29, 18, true); if (index) line(x, top + 9, x, top + 48); });
  top = section('TAX PARTICULARS (AS APPLICABLE)', 85);
  const columns = [184, 93, 78, 78, 78, 92, 119];
  let x = MARGIN;
  ['Description', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Total Amount'].forEach((label, index) => { rect(x, top, columns[index], 25, '#f6f8fa', BORDER); text(label, x + 8, top + 8, 9, true); rect(x, top + 25, columns[index], 31, null, BORDER); text(index === 0 ? 'Payment for Event Services' : index === 6 ? money(model.amount) : '-', x + 8, top + 36, 10); x += columns[index]; });
  text('Note: Tax will be charged as applicable; a detailed tax invoice will be issued separately.', MARGIN, y - 6, 9, false, MUTED);
  y += 17;
  const notes = ['This document acknowledges the payment recorded against the above booking.', 'Tax invoice will be issued separately as per applicable GST laws.', 'Further payments and services will be as per the agreed terms and conditions.', 'This is an electronically generated receipt from the recorded payment.', 'For any queries, please feel free to contact our team.'];
  const notice = 'This receipt has been generated electronically from the D\u00a0I\u00a0V\u00a0Y\u00a0A\u00a0M\u00ae Finance System and does not require a physical signature.';
  const queries = 'For booking and payment queries, please contact D\u00a0I\u00a0V\u00a0Y\u00a0A\u00a0M\u00ae.';
  const noticeWidth = 282;
  const noticeHeight = 37 + wrap(notice, noticeWidth, 11).length * 16 + 13 + wrap(queries, noticeWidth, 11).length * 16;
  const termsHeight = Math.max(noticeHeight, 40 + notes.reduce((sum, note) => sum + wrap(note, 390, 10).length * 15 + 5, 0));
  ensure(termsHeight); text('TERMS & NOTES', MARGIN, y, 12, true); let noteY = y + 28;
  notes.forEach((note, index) => { noteY += paragraph(`${index + 1}.  ${note}`, MARGIN, noteY, 390, 10, false, MUTED) + 5; });
  line(455, y, 455, y + termsHeight - 8);
  text('System Generated Payment Receipt', 475, y, 13, true);
  const noticeBottom = y + 27 + paragraph(notice, 475, y + 27, noticeWidth, 11);
  paragraph(queries, 475, noticeBottom + 13, noticeWidth, 11);
  return pages;
}

export function createReceiptPdf(receipt, booking, options = {}) {
  const model = receiptModel(receipt, booking, options.generatedAt);
  const pages = renderReceiptPages(model, options.createCanvas, options.logo);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  pdf.setProperties({ title: `Payment Receipt ${model.number}`, subject: 'Event booking payment receipt', author: 'Divyam' });
  pages.forEach((canvas, index) => {
    if (index) pdf.addPage();
    const width = pdf.internal.pageSize.getWidth(), height = pdf.internal.pageSize.getHeight();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height, undefined, 'FAST');
    FOOTER_LINKS.forEach(({ x, url }) => pdf.link(x * width / PAGE_W, (PAGE_H - 31) * height / PAGE_H, 18 * width / PAGE_W, 20 * height / PAGE_H, { url }));
  });
  return { pdf, previews: pages.map((canvas) => canvas.toDataURL('image/png')), filename: `PR for ${model.client === '-' ? 'Client' : model.client.replace(/[<>:"/\\|?*]/g, '').trim() || 'Client'}.pdf` };
}

export async function prepareReceiptPdf(receipt, booking) {
  const logo = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load the receipt logo. Please try again.'));
    image.src = new URL('img/logo.png', new URL(import.meta.env.BASE_URL, window.location.origin)).href;
  });
  return createReceiptPdf(receipt, booking, { logo });
}

export async function downloadReceiptPdf(receipt, booking) {
  const { pdf, filename } = await prepareReceiptPdf(receipt, booking);
  pdf.save(filename);
}
