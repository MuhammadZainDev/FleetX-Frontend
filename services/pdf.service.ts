import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Types
type EarningType = {
  id: string;
  amount: number;
  note?: string;
  type: 'Online' | 'Cash' | 'Pocket Slipt';
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  };
};

// Types for expenses
type ExpenseType = {
  id: string;
  amount: number;
  description?: string;
  note?: string;
  category?: string;
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  };
};

type AutoExpenseType = {
  id: string;
  amount: number;
  note?: string;
  category?: string;
  driverId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  };
};

/**
 * Generate PDF statement for earnings
 */
export const generateEarningsPDF = async (
  earnings: EarningType[],
  userData: any,
  fileName: string = 'earnings-statement.pdf'
): Promise<void> => {
  try {
    // Calculate total earnings
    const totalEarnings = earnings.reduce((total, earning) => {
      return total + parseFloat(earning.amount.toString());
    }, 0);

    // Sort earnings by date (newest first)
    const sortedEarnings = [...earnings].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Format earnings data for HTML
    const earningsRows = sortedEarnings.map((earning, index) => {
      const date = new Date(earning.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${formattedDate}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${earning.type}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${earning.note || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">AED ${parseFloat(earning.amount.toString()).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Format currency
    const totalFormatted = `AED ${totalEarnings.toFixed(2)}`;

    // Current date for the report
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .title {
              font-size: 20px;
              margin: 20px 0;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #000;
              color: white;
              text-align: left;
              padding: 10px 12px;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FleetX</div>
            <div>Earnings Statement</div>
          </div>
          
          <div class="info-section">
            <div><strong>Driver:</strong> ${userData?.name || 'Driver'}</div>
            <div><strong>Driver ID:</strong> ${userData?.id || 'N/A'}</div>
            <div><strong>Generated on:</strong> ${currentDate}</div>
          </div>
          
          <h2 class="title">Earnings Summary</h2>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payment Type</th>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${earningsRows}
              <tr class="total-row">
                <td colspan="3" style="padding: 12px; border-top: 2px solid #000; text-align: right;"><strong>Total</strong></td>
                <td style="padding: 12px; border-top: 2px solid #000; text-align: right;"><strong>${totalFormatted}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>This document was automatically generated by FleetX. © ${new Date().getFullYear()} FleetX.</p>
          </div>
        </body>
      </html>
    `;

    // Instead of using RNHTMLtoPDF directly, use Expo's FileSystem to save HTML to a temporary file
    // Then share that file instead
    
    // Create a temporary HTML file
    const htmlFileUri = FileSystem.documentDirectory + 'earnings-statement.html';
    await FileSystem.writeAsStringAsync(htmlFileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Share the HTML file
    await Sharing.shareAsync(htmlFileUri, {
      mimeType: 'text/html',
      dialogTitle: 'Download Earnings Statement'
    });
    
    console.log('Statement generated and shared successfully');
    
    // We're not using RNHTMLtoPDF.convert for now since it's causing issues
    // const options = {
    //   html: htmlContent,
    //   fileName: fileName,
    //   directory: 'Documents',
    //   base64: true
    // };
    // const file = await RNHTMLtoPDF.convert(options);
    // if (file.filePath) {
    //   await Sharing.shareAsync(file.filePath);
    // }
  } catch (error) {
    console.error('Error generating statement:', error);
    // Provide detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw new Error('Failed to generate earnings statement PDF');
  }
};

/**
 * Generate PDF statement for expenses
 */
export const generateExpensesPDF = async (
  expenses: ExpenseType[],
  userData: any,
  fileName: string = 'expenses-statement.pdf'
): Promise<void> => {
  try {
    // Calculate total expenses
    const totalExpenses = expenses.reduce((total, expense) => {
      return total + parseFloat(expense.amount.toString());
    }, 0);

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Format expenses data for HTML
    const expensesRows = sortedExpenses.map((expense, index) => {
      const date = new Date(expense.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${formattedDate}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${expense.category || 'Other'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${expense.note || expense.description || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">AED ${parseFloat(expense.amount.toString()).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Format currency
    const totalFormatted = `AED ${totalExpenses.toFixed(2)}`;

    // Current date for the report
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .title {
              font-size: 20px;
              margin: 20px 0;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #000;
              color: white;
              text-align: left;
              padding: 10px 12px;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FleetX</div>
            <div>Expenses Statement</div>
          </div>
          
          <div class="info-section">
            <div><strong>Driver:</strong> ${userData?.name || 'Driver'}</div>
            <div><strong>Driver ID:</strong> ${userData?.id || 'N/A'}</div>
            <div><strong>Generated on:</strong> ${currentDate}</div>
          </div>
          
          <h2 class="title">Expenses Summary</h2>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expensesRows}
              <tr class="total-row">
                <td colspan="3" style="padding: 12px; border-top: 2px solid #000; text-align: right;"><strong>Total</strong></td>
                <td style="padding: 12px; border-top: 2px solid #000; text-align: right;"><strong>${totalFormatted}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>This document was automatically generated by FleetX. © ${new Date().getFullYear()} FleetX.</p>
          </div>
        </body>
      </html>
    `;

    // Create a temporary HTML file
    const htmlFileUri = FileSystem.documentDirectory + 'expenses-statement.html';
    await FileSystem.writeAsStringAsync(htmlFileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Share the HTML file
    await Sharing.shareAsync(htmlFileUri, {
      mimeType: 'text/html',
      dialogTitle: 'Download Expenses Statement'
    });
    
    console.log('Expenses statement generated and shared successfully');
    
  } catch (error) {
    console.error('Error generating expenses statement:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw new Error('Failed to generate expenses statement PDF');
  }
};

/**
 * Generate PDF statement for auto expenses
 */
export const generateAutoExpensesPDF = async (
  autoExpenses: AutoExpenseType[],
  userData: any,
  fileName: string = 'auto-expenses-statement.pdf'
): Promise<void> => {
  try {
    // Calculate total auto expenses
    const totalAutoExpenses = autoExpenses.reduce((total, expense) => {
      return total + parseFloat(expense.amount.toString());
    }, 0);

    // Sort auto expenses by date (newest first)
    const sortedAutoExpenses = [...autoExpenses].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Format auto expenses data for HTML
    const autoExpensesRows = sortedAutoExpenses.map((expense, index) => {
      const date = new Date(expense.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${formattedDate}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${expense.category || 'Other'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${expense.note || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">AED ${parseFloat(expense.amount.toString()).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Format currency
    const totalFormatted = `AED ${totalAutoExpenses.toFixed(2)}`;

    // Current date for the report
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .title {
              font-size: 20px;
              margin: 20px 0;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #000;
              color: white;
              text-align: left;
              padding: 10px 12px;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FleetX</div>
            <div>Auto Expenses Statement</div>
          </div>
          
          <div class="info-section">
            <div><strong>Driver:</strong> ${userData?.name || 'Driver'}</div>
            <div><strong>Driver ID:</strong> ${userData?.id || 'N/A'}</div>
            <div><strong>Generated on:</strong> ${currentDate}</div>
          </div>
          
          <h2 class="title">Auto Expenses Summary</h2>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${autoExpensesRows}
              <tr class="total-row">
                <td colspan="3" style="padding: 12px; border-top: 2px solid #000; text-align: right;"><strong>Total</strong></td>
                <td style="padding: 12px; border-top: 2px solid #000; text-align: right;"><strong>${totalFormatted}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>This document was automatically generated by FleetX. © ${new Date().getFullYear()} FleetX.</p>
          </div>
        </body>
      </html>
    `;

    // Create a temporary HTML file
    const htmlFileUri = FileSystem.documentDirectory + 'auto-expenses-statement.html';
    await FileSystem.writeAsStringAsync(htmlFileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Share the HTML file
    await Sharing.shareAsync(htmlFileUri, {
      mimeType: 'text/html',
      dialogTitle: 'Download Auto Expenses Statement'
    });
    
    console.log('Auto expenses statement generated and shared successfully');
    
  } catch (error) {
    console.error('Error generating auto expenses statement:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    throw new Error('Failed to generate auto expenses statement PDF');
  }
}; 