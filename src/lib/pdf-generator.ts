import puppeteer from 'puppeteer';
import { INVOICE_HEADER_B64, INVOICE_LOGO_B64 } from './invoice-images';

interface InvoiceData {
  invoiceNumber: string;
  cycleNumber?: string;
  periodFrom: string;
  periodTo: string;
  previousReading: number;
  currentReading: number;
  consumptionKwh: number;
  unitPrice: number;
  baseValue: number;
  servicesAmount: number;
  arrearsAmount: number;
  paidDuringPeriod: number;
  grossAmount: number;
  netDue: number;
  netDueWords: string;
  currency: string;
  notes: string;
  issuedAt: Date | null;
}

interface SubscriberData {
  subscriberNumber: string;
  subscriberName: string;
  meterNumber: string;
  routeNumber: string;
  cabinName: string;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function generateInvoicePDF(
  invoice: InvoiceData,
  subscriber: SubscriberData,
  settings: Record<string, string>
): Promise<Buffer> {
  const title = settings['invoice_title'] || 'فاتورة استهلاك كهرباء';
  const footerNote = settings['footer_note'] || 'ملاحظة: المحطة غير مسؤولة عن تسليم أي مبلغ بدون سند رسمي';

  // Extract invoice display number (just the numeric part or sequential)
  const invoiceDisplayNum = invoice.invoiceNumber.replace(/^INV-\d{4}-\d{2}-/, '') || invoice.invoiceNumber;
  const cycleNum = invoice.cycleNumber || subscriber.routeNumber || '';

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: Letter;
    margin: 20mm 25mm 20mm 25mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Cambria", Arial, Tahoma, "Segoe UI", sans-serif;
    direction: rtl;
    font-size: 12pt;
    color: #000000;
    background: white;
    line-height: 1.0;
  }

  /* ===== HEADER SECTION ===== */
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    direction: rtl;
  }
  .header-banner {
    flex: 1;
  }
  .header-banner img {
    width: 100%;
    height: auto;
    display: block;
  }
  .header-logo {
    width: 60px;
    height: 60px;
    margin-right: 0;
    margin-left: 0;
    flex-shrink: 0;
  }
  .header-logo img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 50%;
  }

  /* ===== TITLE ===== */
  .title {
    text-align: center;
    margin-bottom: 8px;
    padding-top: 0;
    padding-bottom: 0;
  }
  .title h1 {
    font-size: 16pt;
    font-weight: 700;
    color: #0000FF;
    text-decoration: underline;
    text-decoration-skip-ink: none;
    margin: 0;
    padding: 0;
    font-family: "Calibri", Arial, sans-serif;
    line-height: 1.0;
  }

  /* ===== TABLES COMMON ===== */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }

  /* ===== INFO TABLE (Table 1) ===== */
  .info-table {
    margin-bottom: 0;
  }
  .info-table td {
    border: 1pt solid #000000;
    padding: 1.8pt 5.4pt;
    font-size: 12pt;
    font-weight: 700;
    color: #000000;
    vertical-align: middle;
    line-height: 1.0;
  }
  .info-table .label-cell {
    font-family: "Arial", sans-serif;
    white-space: nowrap;
    width: 14%;
  }
  .info-table .value-cell {
    font-family: "Cambria", serif;
    width: 36%;
  }
  .info-table .value-cell-period {
    font-family: "Arial", sans-serif;
    font-weight: 700;
    width: 36%;
  }

  /* ===== SEPARATOR LINE ===== */
  .separator {
    margin: 0;
    padding: 0;
    text-align: center;
  }
  .separator img {
    width: 100%;
    height: 2px;
  }
  .separator-line {
    width: 100%;
    height: 2px;
    background: linear-gradient(to left, #fbd5b5, #e8a85c, #fbd5b5);
    margin: 0;
  }

  /* ===== DATA TABLE (Table 2) ===== */
  .data-table {
    margin-bottom: 0;
  }
  .data-table th {
    background-color: #fbd5b5;
    color: #000000;
    padding: 1.8pt 5.4pt;
    border: 1pt solid #000000;
    font-size: 12pt;
    font-weight: 700;
    text-align: center;
    vertical-align: bottom;
    font-family: "Arial", sans-serif;
    line-height: 1.0;
  }
  .data-table td {
    padding: 1.8pt 5.4pt;
    border: 1pt solid #000000;
    text-align: center;
    font-size: 12pt;
    font-weight: 700;
    color: #000000;
    vertical-align: middle;
    font-family: "Cambria", serif;
    line-height: 1.0;
  }
  .data-table .net-due-value {
    color: #0000FF;
    font-weight: 700;
    font-family: "Cambria", serif;
  }
  .data-table .words-row td {
    text-align: right;
    padding: 9pt 5.4pt 0pt 5.4pt;
    font-size: 11pt;
    font-weight: 700;
    color: #000000;
    font-family: "Cambria", serif;
    border-right: 0;
    border-left: 0;
    border-bottom: 0;
    border-top: 1pt solid #000000;
  }

  /* ===== BOTTOM SEPARATOR ===== */
  .bottom-separator {
    margin: 0;
    padding: 0;
  }

  /* ===== FOOTER TABLE (Table 3) ===== */
  .footer-table {
    margin-top: 0;
    border-collapse: collapse;
  }
  .footer-table td {
    border: 0;
    padding: 0pt 5.4pt;
    font-size: 12pt;
    font-weight: 700;
    vertical-align: top;
    line-height: 1.0;
  }
  .footer-table .note-cell {
    color: #0000FF;
    text-align: right;
    font-family: "Arial", sans-serif;
    width: 83%;
  }
  .footer-table .accounts-cell {
    color: #000000;
    text-align: right;
    font-family: "Arial", sans-serif;
    width: 17%;
  }
</style>
</head>
<body>

  <!-- HEADER: Company banner + Logo -->
  <div class="header-section">
    <div class="header-banner">
      <img src="${INVOICE_HEADER_B64}" alt="شركة العباسي للتوليد الطاقة الكهربائية" />
    </div>
    <div class="header-logo">
      <img src="${INVOICE_LOGO_B64}" alt="شعار الشركة" />
    </div>
  </div>

  <!-- TITLE -->
  <div class="title">
    <h1>${title}</h1>
  </div>

  <!-- TABLE 1: SUBSCRIBER INFO -->
  <table class="info-table">
    <tr>
      <td class="label-cell">رقم الفاتورة :</td>
      <td class="value-cell">${invoiceDisplayNum}</td>
      <td class="label-cell">رقم الدورة :</td>
      <td class="value-cell">${cycleNum}</td>
    </tr>
    <tr>
      <td class="label-cell">اسم المشترك:</td>
      <td class="value-cell">${subscriber.subscriberName}</td>
      <td class="label-cell">رقم العداد :</td>
      <td class="value-cell">${subscriber.meterNumber}</td>
    </tr>
    <tr>
      <td class="label-cell">الفترة        :</td>
      <td class="value-cell-period">من  ${invoice.periodFrom} حتى ${invoice.periodTo}</td>
      <td class="label-cell">الكبينة     :</td>
      <td class="value-cell">${subscriber.cabinName}</td>
    </tr>
  </table>

  <!-- SEPARATOR between info table and data table -->
  <div class="separator">
    <div class="separator-line"></div>
  </div>

  <!-- TABLE 2: READINGS & AMOUNTS -->
  <table class="data-table">
    <thead>
      <tr>
        <th>القراءة السابقة</th>
        <th>القراءة الحالية</th>
        <th>الاستهلاك</th>
        <th>القيمة</th>
        <th>خدمات</th>
        <th>المتأخرات</th>
        <th>مدفوع خلال الفترة</th>
        <th>المبلغ المستحق</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${fmt(invoice.previousReading)}</td>
        <td>${fmt(invoice.currentReading)}</td>
        <td>${fmt(invoice.consumptionKwh)}</td>
        <td>${fmt(invoice.baseValue)}</td>
        <td>${invoice.servicesAmount === 0 ? '0' : fmt(invoice.servicesAmount)}</td>
        <td>${invoice.arrearsAmount === 0 ? '0' : fmt(invoice.arrearsAmount)}</td>
        <td>${invoice.paidDuringPeriod === 0 ? '' : fmt(invoice.paidDuringPeriod)}</td>
        <td class="net-due-value">${fmt(invoice.netDue)}</td>
      </tr>
      <tr class="words-row">
        <td colspan="8">المبلغ المستحق كتابةً هو :- ${invoice.netDueWords}</td>
      </tr>
    </tbody>
  </table>

  <!-- SEPARATOR -->
  <div class="bottom-separator">
    <div class="separator-line"></div>
  </div>

  <!-- TABLE 3: FOOTER NOTE (NO BORDERS) -->
  <table class="footer-table">
    <tr>
      <td class="note-cell">${footerNote}</td>
      <td class="accounts-cell">الحسابات</td>
    </tr>
  </table>

</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '20mm', right: '25mm', bottom: '20mm', left: '25mm' },
  });
  
  await browser.close();
  
  return Buffer.from(pdfBuffer);
}
