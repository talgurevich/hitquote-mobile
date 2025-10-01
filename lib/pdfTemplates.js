// PDF Template System
// Supports multiple professional PDF templates with different styles

export const TEMPLATES = {
  template1: {
    id: 'template1',
    name: 'קלאסי',
    description: 'עיצוב קלאסי עם מסגרת וכותרת במרכז',
    preview: 'classic-border-template'
  },
  template2: {
    id: 'template2',
    name: 'מודרני',
    description: 'עיצוב מודרני ונקי עם פסי צבע',
    preview: 'modern-clean-template'
  },
  template3: {
    id: 'template3',
    name: 'עסקי',
    description: 'עיצוב עסקי מקצועי עם כותרת צידית',
    preview: 'corporate-professional-template'
  }
};

export function generatePDFTemplate(templateId, quoteData, businessData, logoUrl, userColor) {
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  switch (templateId) {
    case 'template1':
      return generateTemplate1(quoteData, businessData, logoUrl, userColor);
    case 'template2':
      return generateTemplate2(quoteData, businessData, logoUrl, userColor);
    case 'template3':
      return generateTemplate3(quoteData, businessData, logoUrl, userColor);
    default:
      return generateTemplate1(quoteData, businessData, logoUrl, userColor);
  }
}

// Template 1: Current Classic Template (unchanged)
function generateTemplate1(quote, business, logoUrl, userColor) {
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₪0.00';
    return Number(amount || 0).toLocaleString('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // Get items from either quote.proposal_item or quote.items
  const items = quote.proposal_item || quote.items || [];

  return `
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          direction: rtl;
          text-align: right;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 3px solid ${userColor || '#FDDC33'};
          border-radius: 15px;
          overflow: hidden;
        }
        .header {
          background: ${userColor || '#FDDC33'};
          padding: 20px;
          text-align: center;
          position: relative;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 10px 0;
        }
        .business-info {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }
        .quote-header {
          padding: 20px;
          background: #f8f9fa;
          border-bottom: 2px solid #e9ecef;
        }
        .quote-number {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        .quote-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          font-size: 14px;
        }
        .customer-info, .quote-info {
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .section-title {
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #e9ecef;
        }
        .items-table th {
          background: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        .items-table tbody tr:hover {
          background: #f8f9fa;
        }
        .totals {
          background: #f8f9fa;
          padding: 20px;
          border-top: 2px solid #e9ecef;
          text-align: left;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 16px;
        }
        .final-total {
          font-weight: bold;
          font-size: 20px;
          color: #333;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .notes {
          padding: 20px;
          background: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="לוגו" class="logo">` : ''}
          <h1 class="title">הצעת מחיר</h1>
          <div class="business-info">
            <div>${business?.business_name || 'שם העסק'}</div>
            ${business?.business_email ? `<div>${business.business_email}</div>` : ''}
            ${business?.business_phone ? `<div>${business.business_phone}</div>` : ''}
            ${business?.business_address ? `<div>${business.business_address}</div>` : ''}
          </div>
        </div>

        <div class="quote-header">
          <div class="quote-number">הצעת מחיר מספר: ${quote.id}</div>
          <div class="quote-details">
            <div class="customer-info">
              <div class="section-title">פרטי לקוח</div>
              <div><strong>שם:</strong> ${quote.customer?.name || 'לא צוין'}</div>
              ${quote.customer?.email ? `<div><strong>אימייל:</strong> ${quote.customer.email}</div>` : ''}
              ${quote.customer?.phone ? `<div><strong>טלפון:</strong> ${quote.customer.phone}</div>` : ''}
              ${quote.customer?.address ? `<div><strong>כתובת:</strong> ${quote.customer.address}</div>` : ''}
            </div>
            <div class="quote-info">
              <div class="section-title">פרטי הצעה</div>
              <div><strong>תאריך הצעה:</strong> ${formatDate(quote.quote_date)}</div>
              <div><strong>תוקף עד:</strong> ${formatDate(quote.valid_until)}</div>
              <div><strong>סטטוס:</strong> ${quote.status === 'pending' ? 'ממתין' : quote.status === 'approved' ? 'אושר' : 'נדחה'}</div>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>פריט</th>
              <th>כמות</th>
              <th>מחיר יחידה</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.custom_name || item.product_name || item.product?.name || 'פריט'}</td>
                <td>${item.qty || 1}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency((item.unit_price || 0) * (item.qty || 1))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>סה"כ לפני מע"ם:</span>
            <span>${formatCurrency((quote.total || 0) / 1.17)}</span>
          </div>
          <div class="total-row">
            <span>מע"ם (17%):</span>
            <span>${formatCurrency((quote.total || 0) - ((quote.total || 0) / 1.17))}</span>
          </div>
          <div class="total-row final-total">
            <span>סה"כ לתשלום:</span>
            <span>${formatCurrency(quote.total)}</span>
          </div>
        </div>

        ${quote.notes ? `
          <div class="notes">
            <div class="section-title">הערות</div>
            <p>${quote.notes}</p>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

// Template 2: Modern Clean Template
function generateTemplate2(quote, business, logoUrl, userColor) {
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₪0.00';
    return Number(amount || 0).toLocaleString('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // Calculate validity date (30 days from quote date)
  const quoteDate = quote.created_at ? new Date(quote.created_at) : new Date();
  const validityDate = new Date(quoteDate);
  validityDate.setDate(validityDate.getDate() + 30);

  // Get items from either quote.proposal_item or quote.items
  const items = quote.proposal_item || quote.items || [];

  // Calculate financial totals
  const subtotal = items.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.qty || 1)), 0);
  const discountAmount = quote.discount_amount || 0;
  const discountPercentage = quote.discount_percentage || 0;
  const afterDiscount = subtotal - discountAmount - (subtotal * discountPercentage / 100);
  const vatAmount = afterDiscount * 0.17;
  const finalTotal = afterDiscount + vatAmount;

  return `
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: #f8f9fa;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 20px auto;
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${userColor || '#FDDC33'}, ${userColor ? userColor + '88' : '#FDDC3388'});
          padding: 30px;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 5px;
          background: ${userColor || '#FDDC33'};
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .logo {
          max-height: 70px;
          border-radius: 8px;
        }
        .quote-title {
          font-size: 32px;
          font-weight: 300;
          color: #2c3e50;
          margin: 0;
        }
        .business-details {
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .business-name {
          font-size: 20px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .business-info {
          font-size: 14px;
          color: #5a6c7d;
          line-height: 1.4;
        }
        .content {
          padding: 30px;
        }
        .quote-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .meta-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-right: 4px solid ${userColor || '#FDDC33'};
        }
        .meta-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e9ecef;
        }
        .meta-item {
          margin: 8px 0;
          font-size: 14px;
        }
        .meta-label {
          font-weight: bold;
          color: #495057;
          display: inline-block;
          min-width: 80px;
        }
        .meta-value {
          color: #6c757d;
        }
        .items-section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid ${userColor || '#FDDC33'};
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .items-table th {
          background: ${userColor || '#FDDC33'};
          color: #2c3e50;
          padding: 15px 12px;
          text-align: right;
          font-weight: bold;
          font-size: 14px;
        }
        .items-table td {
          padding: 15px 12px;
          text-align: right;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }
        .items-table tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        .items-table tbody tr:hover {
          background: #e3f2fd;
        }
        .totals-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
          border: 1px solid #e9ecef;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
          padding: 8px 0;
          font-size: 16px;
        }
        .total-label {
          font-weight: 500;
          color: #495057;
        }
        .total-value {
          font-weight: bold;
          color: #2c3e50;
        }
        .final-total {
          border-top: 3px solid ${userColor || '#FDDC33'};
          padding-top: 15px;
          margin-top: 15px;
          font-size: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
        }
        .final-total .total-value {
          color: ${userColor || '#FDDC33'};
          font-size: 24px;
        }
        .validity-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .validity-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 8px;
        }
        .validity-text {
          color: #856404;
          font-size: 14px;
        }
        .notes-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-right: 4px solid ${userColor || '#FDDC33'};
        }
        .footer {
          background: #2c3e50;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 12px;
        }
        .app-credit {
          margin-top: 10px;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            ${logoUrl ? `<img src="${logoUrl}" alt="לוגו" class="logo">` : ''}
            <h1 class="quote-title">הצעת מחיר</h1>
          </div>
          <div class="business-details">
            <div class="business-name">${business?.business_name || 'שם העסק'}</div>
            <div class="business-info">
              ${business?.business_email ? `📧 ${business.business_email}<br>` : ''}
              ${business?.business_phone ? `📱 ${business.business_phone}<br>` : ''}
              ${business?.business_address ? `📍 ${business.business_address}<br>` : ''}
              ${business?.business_license ? `🆔 רישוי: ${business.business_license}` : ''}
            </div>
          </div>
        </div>

        <div class="content">
          <div class="quote-meta">
            <div class="meta-section">
              <div class="meta-title">פרטי הצעת המחיר</div>
              <div class="meta-item">
                <span class="meta-label">מספר:</span>
                <span class="meta-value">${quote.proposal_number || quote.id}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">תאריך:</span>
                <span class="meta-value">${formatDate(quote.created_at)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">תוקף עד:</span>
                <span class="meta-value">${formatDate(validityDate)}</span>
              </div>
              ${quote.title ? `
                <div class="meta-item">
                  <span class="meta-label">נושא:</span>
                  <span class="meta-value">${quote.title}</span>
                </div>
              ` : ''}
            </div>
            <div class="meta-section">
              <div class="meta-title">פרטי הלקוח</div>
              <div class="meta-item">
                <span class="meta-label">שם:</span>
                <span class="meta-value">${quote.customer?.name || quote.customer_name || 'לא צוין'}</span>
              </div>
              ${(quote.customer?.email || quote.customer_email) ? `
                <div class="meta-item">
                  <span class="meta-label">אימייל:</span>
                  <span class="meta-value">${quote.customer?.email || quote.customer_email}</span>
                </div>
              ` : ''}
              ${(quote.customer?.phone || quote.customer_phone) ? `
                <div class="meta-item">
                  <span class="meta-label">טלפון:</span>
                  <span class="meta-value">${quote.customer?.phone || quote.customer_phone}</span>
                </div>
              ` : ''}
              ${(quote.customer?.address || quote.customer_address) ? `
                <div class="meta-item">
                  <span class="meta-label">כתובת:</span>
                  <span class="meta-value">${quote.customer?.address || quote.customer_address}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="validity-notice">
            <div class="validity-title">⏰ הודעת תוקף</div>
            <div class="validity-text">
              הצעת מחיר זו בתוקף למשך 30 יום מיום הנפקתה<br>
              תוקף עד: ${formatDate(validityDate)}
            </div>
          </div>

          <div class="items-section">
            <div class="section-title">פירוט פריטים</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>תיאור הפריט</th>
                  <th>כמות</th>
                  <th>מחיר יחידה</th>
                  <th>סה"כ</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.custom_name || item.product_name || item.product?.name || 'פריט'}</td>
                    <td>${item.qty || 1}</td>
                    <td>${formatCurrency(item.unit_price || 0)}</td>
                    <td>${formatCurrency((item.unit_price || 0) * (item.qty || 1))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">סכום ביניים:</span>
              <span class="total-value">${formatCurrency(subtotal)}</span>
            </div>
            ${discountAmount > 0 ? `
              <div class="total-row">
                <span class="total-label">הנחה:</span>
                <span class="total-value">-${formatCurrency(discountAmount)}</span>
              </div>
            ` : ''}
            ${discountPercentage > 0 ? `
              <div class="total-row">
                <span class="total-label">הנחה (${discountPercentage}%):</span>
                <span class="total-value">-${formatCurrency(subtotal * discountPercentage / 100)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span class="total-label">לפני מע"ם:</span>
              <span class="total-value">${formatCurrency(afterDiscount)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">מע"ם (17%):</span>
              <span class="total-value">${formatCurrency(vatAmount)}</span>
            </div>
            <div class="total-row final-total">
              <span class="total-label">סה"כ לתשלום:</span>
              <span class="total-value">${formatCurrency(finalTotal)}</span>
            </div>
          </div>

          ${quote.notes ? `
            <div class="notes-section">
              <div class="section-title">הערות נוספות</div>
              <p>${quote.notes}</p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div>תודה על בחירתכם בשירותינו</div>
          <div class="app-credit">מופק באמצעות אפליקציית HitQuote</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template 3: Corporate Professional Template
function generateTemplate3(quote, business, logoUrl, userColor) {
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₪0.00';
    return Number(amount || 0).toLocaleString('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // Calculate validity date (30 days from quote date)
  const quoteDate = quote.created_at ? new Date(quote.created_at) : new Date();
  const validityDate = new Date(quoteDate);
  validityDate.setDate(validityDate.getDate() + 30);

  // Get items from either quote.proposal_item or quote.items
  const items = quote.proposal_item || quote.items || [];

  // Calculate financial totals
  const subtotal = items.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.qty || 1)), 0);
  const discountAmount = quote.discount_amount || 0;
  const discountPercentage = quote.discount_percentage || 0;
  const afterDiscount = subtotal - discountAmount - (subtotal * discountPercentage / 100);
  const vatAmount = afterDiscount * 0.17;
  const finalTotal = afterDiscount + vatAmount;

  return `
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          direction: rtl;
          text-align: right;
          line-height: 1.5;
          color: #2c3e50;
        }
        .page-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          display: flex;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .sidebar {
          width: 200px;
          background: ${userColor || '#FDDC33'};
          color: #2c3e50;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .sidebar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%);
          pointer-events: none;
        }
        .logo-container {
          background: white;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
        }
        .logo {
          max-width: 60px;
          max-height: 60px;
          border-radius: 50%;
        }
        .sidebar-title {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
        }
        .business-sidebar {
          text-align: center;
          font-size: 12px;
          line-height: 1.4;
          position: relative;
          z-index: 1;
        }
        .business-name-sidebar {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 15px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }
        .business-contact {
          margin: 8px 0;
          padding: 4px 0;
        }
        .main-content {
          flex: 1;
          padding: 40px;
          background: white;
        }
        .quote-header {
          border-bottom: 3px solid ${userColor || '#FDDC33'};
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .quote-title-main {
          font-size: 28px;
          font-weight: 300;
          color: #2c3e50;
          margin: 0 0 10px 0;
        }
        .quote-subtitle {
          font-size: 16px;
          color: #7f8c8d;
          margin: 0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin: 30px 0;
        }
        .info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          position: relative;
        }
        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: ${userColor || '#FDDC33'};
          border-radius: 0 8px 8px 0;
        }
        .card-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        .info-label {
          font-weight: 600;
          color: #495057;
          min-width: 80px;
        }
        .info-value {
          color: #6c757d;
          flex: 1;
          text-align: left;
        }
        .validity-banner {
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          border: 1px solid ${userColor || '#FDDC33'};
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
          position: relative;
        }
        .validity-banner::before {
          content: '⏰';
          position: absolute;
          top: -10px;
          right: 20px;
          background: ${userColor || '#FDDC33'};
          color: #2c3e50;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .validity-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 5px;
          font-size: 16px;
        }
        .validity-date {
          color: #856404;
          font-size: 14px;
        }
        .items-section {
          margin: 30px 0;
        }
        .section-header {
          background: ${userColor || '#FDDC33'};
          color: #2c3e50;
          padding: 15px 20px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 8px 8px 0 0;
          margin: 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 0 0 8px 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .items-table th {
          background: #34495e;
          color: white;
          padding: 15px 12px;
          text-align: right;
          font-weight: 600;
          font-size: 14px;
        }
        .items-table td {
          padding: 15px 12px;
          text-align: right;
          border-bottom: 1px solid #ecf0f1;
          font-size: 14px;
        }
        .items-table tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        .items-table tbody tr:hover {
          background: #e8f4fd;
        }
        .totals-container {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
          position: relative;
        }
        .totals-container::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 4px;
          background: ${userColor || '#FDDC33'};
          border-radius: 8px 8px 0 0;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 12px 0;
          padding: 8px 0;
          font-size: 16px;
        }
        .total-label {
          font-weight: 500;
          color: #495057;
        }
        .total-amount {
          font-weight: bold;
          color: #2c3e50;
        }
        .grand-total {
          border-top: 2px solid ${userColor || '#FDDC33'};
          padding-top: 15px;
          margin-top: 15px;
          font-size: 20px;
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .grand-total .total-amount {
          color: ${userColor || '#FDDC33'};
          font-size: 24px;
          font-weight: bold;
        }
        .notes-area {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          position: relative;
        }
        .notes-area::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          background: ${userColor || '#FDDC33'};
          border-radius: 0 8px 8px 0;
        }
        .notes-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
        }
        .notes-content {
          font-size: 14px;
          line-height: 1.6;
          color: #495057;
        }
        .footer-section {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #6c757d;
          font-size: 12px;
        }
        .footer-thanks {
          font-size: 14px;
          color: #495057;
          margin-bottom: 10px;
        }
        .app-branding {
          color: #adb5bd;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        <div class="sidebar">
          <div class="logo-container">
            ${logoUrl ? `<img src="${logoUrl}" alt="לוגו" class="logo">` : '<div style="font-size: 24px;">🏢</div>'}
          </div>
          <div class="sidebar-title">הצעת מחיר</div>
          <div class="business-sidebar">
            <div class="business-name-sidebar">${business?.business_name || 'שם העסק'}</div>
            ${business?.business_email ? `<div class="business-contact">📧 ${business.business_email}</div>` : ''}
            ${business?.business_phone ? `<div class="business-contact">📱 ${business.business_phone}</div>` : ''}
            ${business?.business_address ? `<div class="business-contact">📍 ${business.business_address}</div>` : ''}
            ${business?.business_license ? `<div class="business-contact">🆔 ${business.business_license}</div>` : ''}
          </div>
        </div>

        <div class="main-content">
          <div class="quote-header">
            <h1 class="quote-title-main">הצעת מחיר מספר ${quote.proposal_number || quote.id}</h1>
            <p class="quote-subtitle">תאריך הנפקה: ${formatDate(quote.created_at)}</p>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="card-title">פרטי הלקוח</div>
              <div class="info-row">
                <span class="info-label">שם:</span>
                <span class="info-value">${quote.customer?.name || quote.customer_name || 'לא צוין'}</span>
              </div>
              ${(quote.customer?.email || quote.customer_email) ? `
                <div class="info-row">
                  <span class="info-label">אימייל:</span>
                  <span class="info-value">${quote.customer?.email || quote.customer_email}</span>
                </div>
              ` : ''}
              ${(quote.customer?.phone || quote.customer_phone) ? `
                <div class="info-row">
                  <span class="info-label">טלפון:</span>
                  <span class="info-value">${quote.customer?.phone || quote.customer_phone}</span>
                </div>
              ` : ''}
              ${(quote.customer?.address || quote.customer_address) ? `
                <div class="info-row">
                  <span class="info-label">כתובת:</span>
                  <span class="info-value">${quote.customer?.address || quote.customer_address}</span>
                </div>
              ` : ''}
            </div>

            <div class="info-card">
              <div class="card-title">פרטי ההצעה</div>
              <div class="info-row">
                <span class="info-label">מספר:</span>
                <span class="info-value">${quote.proposal_number || quote.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">תאריך:</span>
                <span class="info-value">${formatDate(quote.created_at)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">תוקף עד:</span>
                <span class="info-value">${formatDate(validityDate)}</span>
              </div>
              ${quote.title ? `
                <div class="info-row">
                  <span class="info-label">נושא:</span>
                  <span class="info-value">${quote.title}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="validity-banner">
            <div class="validity-title">הודעת תוקף</div>
            <div class="validity-date">הצעה זו בתוקף עד: ${formatDate(validityDate)} (30 יום מיום ההנפקה)</div>
          </div>

          <div class="items-section">
            <div class="section-header">פירוט מוצרים ושירותים</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>תיאור</th>
                  <th>כמות</th>
                  <th>מחיר ליחידה</th>
                  <th>סה"כ</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.custom_name || item.product_name || item.product?.name || 'פריט'}</td>
                    <td>${item.qty || 1}</td>
                    <td>${formatCurrency(item.unit_price || 0)}</td>
                    <td>${formatCurrency((item.unit_price || 0) * (item.qty || 1))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals-container">
            <div class="total-line">
              <span class="total-label">סכום ביניים:</span>
              <span class="total-amount">${formatCurrency(subtotal)}</span>
            </div>
            ${discountAmount > 0 ? `
              <div class="total-line">
                <span class="total-label">הנחה:</span>
                <span class="total-amount">-${formatCurrency(discountAmount)}</span>
              </div>
            ` : ''}
            ${discountPercentage > 0 ? `
              <div class="total-line">
                <span class="total-label">הנחה (${discountPercentage}%):</span>
                <span class="total-amount">-${formatCurrency(subtotal * discountPercentage / 100)}</span>
              </div>
            ` : ''}
            <div class="total-line">
              <span class="total-label">לפני מע"ם:</span>
              <span class="total-amount">${formatCurrency(afterDiscount)}</span>
            </div>
            <div class="total-line">
              <span class="total-label">מע"ם (17%):</span>
              <span class="total-amount">${formatCurrency(vatAmount)}</span>
            </div>
            <div class="total-line grand-total">
              <span class="total-label">סה"כ לתשלום:</span>
              <span class="total-amount">${formatCurrency(finalTotal)}</span>
            </div>
          </div>

          ${quote.notes ? `
            <div class="notes-area">
              <div class="notes-title">הערות והסברים נוספים</div>
              <div class="notes-content">${quote.notes}</div>
            </div>
          ` : ''}

          <div class="footer-section">
            <div class="footer-thanks">תודה על האמון והזדמנות לשרת אתכם</div>
            <div class="app-branding">מופק באמצעות אפליקציית HitQuote</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}