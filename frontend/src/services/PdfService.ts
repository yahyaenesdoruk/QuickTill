import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Receipt } from '../models/Receipt';
import { Texts } from '../constants/Texts';

export class PdfService {
  static async generatePdf(receipt: Receipt): Promise<string> {
    const html = this.generateReceiptHtml(receipt);
    
    try {
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  static async sharePdf(receipt: Receipt): Promise<void> {
    try {
      const uri = await this.generatePdf(receipt);
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${Texts.appName} - ${receipt.receiptId}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        console.log('Sharing not available');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    }
  }

  static async downloadPdf(receipt: Receipt): Promise<string | null> {
    try {
      const uri = await this.generatePdf(receipt);
      const fileName = `${receipt.receiptId.replace('#', '')}.pdf`;
      const downloadPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath,
      });
      
      return downloadPath;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      return null;
    }
  }

  private static generateReceiptHtml(receipt: Receipt): string {
    const itemsHtml = receipt.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}${item.weight ? ` (${item.weight}g)` : ''}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice.toFixed(2)} ${Texts.common.tl}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.subtotal.toFixed(2)} ${Texts.common.tl}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: #2E7D32;
              color: white;
              padding: 20px;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .info {
              margin-bottom: 10px;
              font-size: 12px;
            }
            .divider {
              border-top: 2px dashed #333;
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #f5f5f5;
              padding: 10px 8px;
              text-align: left;
              font-size: 12px;
              border-bottom: 2px solid #333;
            }
            td {
              font-size: 11px;
            }
            .total-row {
              font-weight: bold;
              font-size: 14px;
              border-top: 2px solid #333;
            }
            .total-row td {
              padding: 15px 8px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 11px;
            }
            .eco-note {
              color: #2E7D32;
              font-style: italic;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">${Texts.appName}</div>
            <div class="info"><strong>${Texts.receipt.receiptId}:</strong> ${receipt.receiptId}</div>
            <div class="info"><strong>${Texts.receipt.date}:</strong> ${receipt.date} | <strong>${Texts.receipt.time}:</strong> ${receipt.time}</div>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th>${Texts.common.unit}</th>
                <th style="text-align: center;">${Texts.common.quantity}</th>
                <th style="text-align: right;">${Texts.common.price}</th>
                <th style="text-align: right;">${Texts.common.subtotal}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="3"><strong>${Texts.payment.total}</strong></td>
                <td style="text-align: right;"><strong>${receipt.total.toFixed(2)} ${Texts.common.tl}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="divider"></div>

          <div class="info" style="text-align: center;">
            <strong>${Texts.receipt.paymentMethod}:</strong> ${receipt.paymentMethod === 'NFC' ? Texts.receipt.nfcPayment : Texts.receipt.simulatedPayment}
          </div>

          <div class="footer">
            <div>${Texts.receipt.thanksMessage}</div>
            <div class="eco-note">${Texts.receipt.ecoNote}</div>
          </div>
        </body>
      </html>
    `;
  }
}
