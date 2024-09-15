import * as XLSX from 'xlsx';

export const downloadReport = (data) => {
  const workbook = XLSX.utils.book_new();
  
  // Portfolio Summary
  const summaryData = [
    ['Total Assets', Object.values(data.assets).reduce((sum, value) => sum + value, 0)],
    ['Total Liabilities', Object.values(data.liabilities).reduce((sum, value) => sum + value, 0)],
    ['Net Worth', Object.values(data.assets).reduce((sum, value) => sum + value, 0) - Object.values(data.liabilities).reduce((sum, value) => sum + value, 0)],
    ['Savings Rate', ((Object.values(data.income).reduce((sum, value) => sum + value, 0) - Object.values(data.expenses).reduce((sum, value) => sum + value, 0)) / Object.values(data.income).reduce((sum, value) => sum + value, 0) * 100).toFixed(2) + '%'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Asset Distribution
  const assetData = [['Category', 'Value'], ...Object.entries(data.assets)];
  const assetSheet = XLSX.utils.aoa_to_sheet(assetData);
  XLSX.utils.book_append_sheet(workbook, assetSheet, 'Asset Distribution');
  
  // Liabilities
  const liabilityData = [['Category', 'Value'], ...Object.entries(data.liabilities)];
  const liabilitySheet = XLSX.utils.aoa_to_sheet(liabilityData);
  XLSX.utils.book_append_sheet(workbook, liabilitySheet, 'Liabilities');
  
  // Income
  const incomeData = [['Category', 'Value'], ...Object.entries(data.income)];
  const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
  XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income');
  
  // Expenses
  const expenseData = [['Category', 'Value'], ...Object.entries(data.expenses)];
  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');
  
  // Generate and download the Excel file
  XLSX.writeFile(workbook, 'Financial_Portfolio_Report.xlsx');
};
