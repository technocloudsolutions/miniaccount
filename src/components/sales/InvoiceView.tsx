'use client';
import { Sale } from '@/types';
import { useState } from 'react';

interface InvoiceViewProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

export default function InvoiceView({ isOpen, onClose, sale }: InvoiceViewProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice #${sale.id}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .invoice-header { 
                margin-bottom: 20px; 
                border-bottom: 1px solid #000; 
                padding-bottom: 20px;
              }
              .company-name { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
              }
              .section { 
                margin: 10px 0; 
                padding: 10px 0; 
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0; 
              }
              th, td { 
                padding: 12px 8px; 
                text-align: left; 
                border-bottom: 1px solid #ddd; 
              }
              th {
                background-color: #f8f9fa;
                font-weight: bold;
              }
              .total { 
                margin-top: 20px; 
                border-top: 2px solid #000; 
                padding-top: 20px;
                text-align: right;
                font-weight: bold;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 14px;
                color: #666;
              }
              @media print {
                body { 
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="company-name">AccountEase</div>
              <div>Invoice #${sale.id}</div>
              <div>Date: ${new Date(sale.date).toLocaleDateString()}</div>
            </div>
            
            <div class="section">
              <div><strong>Customer:</strong> ${sale.customerName || 'N/A'}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${sale.description || 'N/A'}</td>
                  <td>${sale.quantity}</td>
                  <td>${formatCurrency(sale.unitPrice)}</td>
                  <td style="text-align: right;">${formatCurrency(sale.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total">
              Total Amount: ${formatCurrency(sale.amount)}
            </div>

            <div class="footer">
              Thank you for your business!<br>
              AccountEase - Professional Accounting Solutions
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Invoice Preview */}
          <div className="border rounded-lg p-4">
            <div className="mb-4 border-b pb-4">
              <div className="text-2xl font-bold">AccountEase</div>
              <div>Invoice #{sale.id}</div>
              <div>Date: {new Date(sale.date).toLocaleDateString()}</div>
            </div>

            <div className="mb-4">
              <div>Customer: {sale.customerName || 'N/A'}</div>
            </div>

            <table className="w-full mb-4">
              <thead>
                <tr>
                  <th className="text-left">Description</th>
                  <th className="text-left">Quantity</th>
                  <th className="text-left">Unit Price</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{sale.description || 'N/A'}</td>
                  <td>{sale.quantity}</td>
                  <td>{formatCurrency(sale.unitPrice)}</td>
                  <td className="text-right">{formatCurrency(sale.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="border-t pt-4">
              <div className="font-bold text-right">
                Total Amount: {formatCurrency(sale.amount)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {isPrinting ? 'Printing...' : 'Print Invoice'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Save as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 