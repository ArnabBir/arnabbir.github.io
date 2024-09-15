import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { formatIndianCurrency } from './currencyFormatter';

const generateChartImage = async (chartId) => {
  const element = document.getElementById(chartId);
  if (!element) return null;
  return await toPng(element);
};

export const downloadReport = async (data) => {
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(18);
  pdf.text('Financial Portfolio Report', 14, 15);
  
  // Portfolio Summary
  pdf.setFontSize(14);
  pdf.text('Portfolio Summary', 14, 25);
  const summaryData = [
    ['Total Assets', formatIndianCurrency(Object.values(data.assets).reduce((sum, value) => sum + (typeof value === 'number' ? value : Object.values(value).reduce((s, v) => s + v, 0)), 0))],
    ['Total Liabilities', formatIndianCurrency(Object.values(data.liabilities).reduce((sum, value) => sum + value, 0))],
    ['Net Worth', formatIndianCurrency(Object.values(data.assets).reduce((sum, value) => sum + (typeof value === 'number' ? value : Object.values(value).reduce((s, v) => s + v, 0)), 0) - Object.values(data.liabilities).reduce((sum, value) => sum + value, 0))],
    ['Savings Rate', `${((Object.values(data.income).reduce((sum, value) => sum + value, 0) - Object.values(data.expenses).reduce((sum, value) => sum + value, 0)) / Object.values(data.income).reduce((sum, value) => sum + value, 0) * 100).toFixed(2)}%`],
  ];
  pdf.autoTable({
    startY: 30,
    head: [['Metric', 'Value']],
    body: summaryData,
  });
  
  // Asset Distribution
  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text('Asset Distribution', 14, 15);
  const assetData = Object.entries(data.assets).map(([category, value]) => {
    if (typeof value === 'object') {
      return [category, formatIndianCurrency(Object.values(value).reduce((sum, v) => sum + v, 0))];
    }
    return [category, formatIndianCurrency(value)];
  });
  pdf.autoTable({
    startY: 20,
    head: [['Category', 'Value']],
    body: assetData,
  });
  
  // Charts
  const charts = ['portfolio-distribution', 'asset-liability-chart', 'income-expense-chart', 'net-worth-chart'];
  for (const chartId of charts) {
    const chartImage = await generateChartImage(chartId);
    if (chartImage) {
      pdf.addPage();
      pdf.text(chartId.replace(/-/g, ' ').toUpperCase(), 14, 15);
      pdf.addImage(chartImage, 'PNG', 10, 20, 190, 100);
    }
  }
  
  // Generate and download the PDF file
  pdf.save('Financial_Portfolio_Report.pdf');
};
