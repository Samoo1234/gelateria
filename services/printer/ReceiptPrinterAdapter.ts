import { auditService } from '../auditService';

export interface ReceiptData {
  storeName?: string;
  storeAddress?: string;
  storeCnpj?: string;
  orderNumber: string;
  createdAt: string;
  operatorName?: string;
  terminalCode?: string;
  items: {
    name: string;
    saleType: 'UNIT' | 'WEIGHT' | 'SCOOP';
    quantity: number;
    unitPrice: number;
    subtotal: number;
    containerName?: string;
    grossWeight?: number;
    tareWeight?: number;
    netWeight?: number;
    flavors?: string[];
    toppings?: string[];
    notes?: string;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  payments: {
    method: string;
    amount: number;
    change?: number;
  }[];
  isReprint?: boolean;
}

export interface ReceiptPrinterAdapter {
  printReceipt(data: ReceiptData, widthMm?: 58 | 80): Promise<boolean>;
}

export class BrowserPrintAdapter implements ReceiptPrinterAdapter {
  async printReceipt(data: ReceiptData, widthMm: 58 | 80 = 80): Promise<boolean> {
    try {
      const receiptHtml = this.generateReceiptHtml(data, widthMm);

      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';

      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document;
      if (!frameDoc) return false;

      frameDoc.open();
      frameDoc.write(receiptHtml);
      frameDoc.close();

      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printIframe);
        }, 1000);
      }, 300);

      if (data.isReprint) {
        await auditService.recordAuditLog(
          'RECEIPT_REPRINT',
          'orders',
          data.orderNumber,
          { order_number: data.orderNumber, width: `${widthMm}mm` }
        );
      }

      return true;
    } catch (err) {
      console.error('Falha ao imprimir comprovante:', err);
      return false;
    }
  }

  generateReceiptHtml(data: ReceiptData, widthMm: 58 | 80): string {
    const pageWidth = widthMm === 58 ? '48mm' : '72mm';
    const fontScale = widthMm === 58 ? '10px' : '12px';

    const itemsHtml = data.items.map(item => {
      let detail = '';
      if (item.saleType === 'WEIGHT') {
        detail = `<div class="sub-line">Líq: ${(item.netWeight || 0).toFixed(3)}kg (Bruto: ${(item.grossWeight || 0).toFixed(3)}kg / Tara: ${(item.tareWeight || 0).toFixed(3)}kg) x R$ ${item.unitPrice.toFixed(2)}/kg</div>`;
      } else if (item.saleType === 'SCOOP' && item.flavors && item.flavors.length > 0) {
        detail = `<div class="sub-line">Sabores: ${item.flavors.join(', ')}</div>`;
      }

      return `
        <div class="item-row">
          <div class="item-name">${item.quantity}x ${item.name}</div>
          <div class="item-price">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</div>
        </div>
        ${detail}
      `;
    }).join('');

    const paymentsHtml = data.payments.map(p => `
      <div class="summary-row">
        <span>${p.method}:</span>
        <span>R$ ${p.amount.toFixed(2).replace('.', ',')}</span>
      </div>
      ${p.change && p.change > 0 ? `
        <div class="summary-row">
          <span>Troco:</span>
          <span>R$ ${p.change.toFixed(2).replace('.', ',')}</span>
        </div>
      ` : ''}
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprovante - ${data.orderNumber}</title>
        <style>
          @page {
            margin: 0;
            size: ${pageWidth} auto;
          }
          body {
            margin: 0;
            padding: 4mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: ${fontScale};
            line-height: 1.25;
            color: #000;
            background: #fff;
            width: ${pageWidth};
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 1.2em; margin-bottom: 2px; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .item-row { display: flex; justify-content: space-between; margin-top: 2px; }
          .item-name { flex: 1; word-break: break-all; }
          .item-price { text-align: right; min-width: 50px; font-weight: bold; }
          .sub-line { font-size: 0.85em; color: #333; margin-left: 8px; }
          .summary-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 1.25em; font-weight: bold; margin: 4px 0; }
          .reprint-badge { border: 2px solid #000; padding: 2px; text-align: center; font-weight: bold; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="center bold title">${data.storeName || 'GELATO MANAGER'}</div>
        <div class="center">${data.storeAddress || 'Balcão de Atendimento'}</div>
        <div class="center bold">*** COMPROVANTE NÃO FISCAL ***</div>
        
        ${data.isReprint ? '<div class="reprint-badge">*** REIMPRESSÃO DE COMPROVANTE ***</div>' : ''}
        
        <div class="divider"></div>
        <div><strong>Pedido:</strong> ${data.orderNumber}</div>
        <div><strong>Data:</strong> ${new Date(data.createdAt).toLocaleString('pt-BR')}</div>
        ${data.operatorName ? `<div><strong>Operador:</strong> ${data.operatorName}</div>` : ''}
        ${data.terminalCode ? `<div><strong>Terminal:</strong> ${data.terminalCode}</div>` : ''}
        
        <div class="divider"></div>
        <div class="bold center">ITENS DO PEDIDO</div>
        <div class="divider"></div>
        ${itemsHtml}
        
        <div class="divider"></div>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>R$ ${data.subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        ${data.discount > 0 ? `
          <div class="summary-row">
            <span>Desconto:</span>
            <span>- R$ ${data.discount.toFixed(2).replace('.', ',')}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>TOTAL:</span>
          <span>R$ ${data.total.toFixed(2).replace('.', ',')}</span>
        </div>
        
        <div class="divider"></div>
        <div class="bold center">PAGAMENTO</div>
        ${paymentsHtml}
        
        <div class="divider"></div>
        <div class="center" style="font-size: 0.85em; margin-top: 6px;">
          Obrigado pela preferência!<br>
          Volte sempre.
        </div>
      </body>
      </html>
    `;
  }
}

export const defaultReceiptPrinter = new BrowserPrintAdapter();
