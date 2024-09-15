import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import PortfolioSummary from '../components/PortfolioSummary';
import AssetLiabilityChart from '../components/AssetLiabilityChart';
import PortfolioDistribution from '../components/PortfolioDistribution';
import FireCalculator from '../components/FireCalculator';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import NetWorthChart from '../components/NetWorthChart';
import FinancialDataForm from '../components/FinancialDataForm';
import ThemeToggle from '../components/ThemeToggle';
import { exportToExcel, importFromExcel } from '../utils/excelUtils';

const Index = () => {
  const [financialData, setFinancialData] = useState(null);
  const fileInputRef = useRef(null);

  const handleDataSubmit = (data) => {
    setFinancialData(data);
  };

  const handleExportToExcel = () => {
    if (financialData) {
      exportToExcel(financialData);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const importedData = await importFromExcel(file);
        setFinancialData(importedData);
      } catch (error) {
        console.error("Error importing Excel file:", error);
        // Handle error (e.g., show error message to user)
      }
    }
  };

  return (
    <div className="container mx-auto p-4 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-primary">PortfolioHub - Track, Grow, Retire Early</h1>
        <ThemeToggle />
      </div>
      
      <FinancialDataForm onSubmit={handleDataSubmit} initialData={financialData} />
      
      {financialData && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PortfolioSummary data={financialData} />
            <AssetLiabilityChart data={financialData} />
            <PortfolioDistribution data={financialData} />
            <FireCalculator data={financialData} />
            <IncomeExpenseChart data={financialData} />
          </div>
          <NetWorthChart data={financialData} />
          
          <div className="flex justify-between items-center mt-8">
            <Button onClick={handleExportToExcel} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Export to Excel
            </Button>
            <div>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Button onClick={handleImportClick} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Import from Excel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
