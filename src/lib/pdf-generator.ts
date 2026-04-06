import puppeteer from 'puppeteer';

interface InvoiceData {
  invoiceNumber: string;
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
  const orgName = settings['organization_name'] || '';

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    font-size: 14px;
    color: #1a1a1a;
    background: white;
    padding: 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 3px double #333;
  }
  .header h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #1a365d;
  }
  .header .org-name {
    font-size: 14px;
    color: #555;
  }
  .header .invoice-num {
    font-size: 12px;
    color: #777;
    margin-top: 5px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
  }
  .info-table td {
    padding: 8px 12px;
    border: 1px solid #ccc;
    font-size: 13px;
  }
  .info-table td.label {
    background: #f0f4f8;
    font-weight: bold;
    width: 15%;
    color: #2d3748;
  }
  .info-table td.value {
    width: 35%;
  }
  .data-table th {
    background: #2d3748;
    color: white;
    padding: 10px 8px;
    border: 1px solid #2d3748;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
  }
  .data-table td {
    padding: 10px 8px;
    border: 1px solid #ccc;
    text-align: center;
    font-size: 13px;
  }
  .words-row {
    background: #f7fafc;
    font-weight: bold;
    text-align: right !important;
    padding: 12px !important;
    font-size: 13px;
    color: #2d3748;
  }
  .footer-note {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #e2e8f0;
    background: #fffbeb;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
  }
  .footer-note .note { color: #c05621; font-weight: bold; }
  .footer-note .accounts { color: #2d3748; }
  .signature-area {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
  }
  .signature-box {
    text-align: center;
    width: 200px;
  }
  .signature-box .line {
    border-top: 1px solid #333;
    margin-top: 50px;
    padding-top: 5px;
    font-size: 12px;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    ${orgName ? `<div class="org-name">${orgName}</div>` : ''}
    <div class="invoice-num">رقم الفاتورة: ${invoice.invoiceNumber}</div>
  </div>

  <table class="info-table">
    <tr>
      <td class="label">رقم خط السير :</td>
      <td class="value">${subscriber.routeNumber}</td>
      <td class="label">رقم المشترك :</td>
      <td class="value">${subscriber.subscriberNumber}</td>
    </tr>
    <tr>
      <td class="label">اسم المشترك :</td>
      <td class="value">${subscriber.subscriberName}</td>
      <td class="label">رقم العداد :</td>
      <td class="value">${subscriber.meterNumber}</td>
    </tr>
    <tr>
      <td class="label">الفترة :</td>
      <td class="value">من ${invoice.periodFrom} حتى ${invoice.periodTo}</td>
      <td class="label">الكبينة :</td>
      <td class="value">${subscriber.cabinName}</td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th>القراءة السابقة</th>
        <th>القراءة الحالية</th>
        <th>الاستهلاك /k.w</th>
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
        <td>${fmt(invoice.servicesAmount)}</td>
        <td>${fmt(invoice.arrearsAmount)}</td>
        <td>${fmt(invoice.paidDuringPeriod)}</td>
        <td style="font-weight:bold; color:#c53030;">${fmt(invoice.netDue)}</td>
      </tr>
      <tr>
        <td colspan="8" class="words-row">المبلغ المستحق كتابةً هو :- ${invoice.netDueWords}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    <span class="note">${footerNote}</span>
    <span class="accounts">الحسابات</span>
  </div>

  <div class="signature-area">
    <div class="signature-box">
      <div class="line">توقيع المشترك</div>
    </div>
    <div class="signature-box">
      <div class="line">توقيع الموظف</div>
    </div>
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  });
  
  await browser.close();
  
  return Buffer.from(pdfBuffer);
}
