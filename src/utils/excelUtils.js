import * as XLSX from 'xlsx';

export const exportToExcel = (data) => {
  const workbook = XLSX.utils.book_new();
  
  // Financial Data
  const financialData = [
    ['Category', 'Subcategory', 'Field', 'Value'],
    ...Object.entries(data).flatMap(([category, subcategories]) =>
      Object.entries(subcategories).flatMap(([subcategory, fields]) =>
        Object.entries(fields).map(([field, value]) => [category, subcategory, field, value])
      )
    )
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet(financialData);
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Financial Data');
  
  // Generate and download the Excel file
  XLSX.writeFile(workbook, 'Financial_Portfolio_Report.xlsx');
};

export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Skip header row and process data
        const importedData = jsonData.slice(1).reduce((acc, [category, subcategory, field, value]) => {
          if (!acc[category]) acc[category] = {};
          if (!acc[category][subcategory]) acc[category][subcategory] = {};
          acc[category][subcategory][field] = parseFloat(value) || 0;
          return acc;
        }, {});
        
        resolve(importedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
