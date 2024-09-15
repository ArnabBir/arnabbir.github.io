import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import PortfolioSummary from '../components/portfoliohub/PortfolioSummary';
import AssetLiabilityChart from '../components/portfoliohub/AssetLiabilityChart';
import PortfolioDistribution from '../components/portfoliohub/PortfolioDistribution';
import FireCalculator from '../components/portfoliohub/FireCalculator';
import IncomeExpenseChart from '../components/portfoliohub/IncomeExpenseChart';
import NetWorthChart from '../components/portfoliohub/NetWorthChart';
import FinancialDataForm from '../components/portfoliohub/FinancialDataForm';
import ThemeToggle from '../components/portfoliohub/ThemeToggle';
import { exportToExcel, importFromExcel } from '../utils/excelUtils';

import TypewriterEffect from '../components/TypewriterEffect';

const HappyBirthday = () => {
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500">
      <h1 className="text-6xl font-bold text-white">
        <TypewriterEffect text="Happy Birthday!" speed={100} loop={false} />
      </h1>
    </div>
  );
};

export default HappyBirthday;