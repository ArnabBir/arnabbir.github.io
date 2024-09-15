import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIndianCurrency } from '../../utils/currencyFormatter';

const PortfolioSummary = ({ data = {} }) => {
  const { assets = {}, liabilities = {}, income = {}, expenses = {} } = data;
  
  const calculateTotal = (obj) => {
    return Object.values(obj).reduce((total, item) => {
      if (typeof item === 'number') {
        return total + item;
      } else if (typeof item === 'object') {
        return total + calculateTotal(item);
      }
      return total;
    }, 0);
  };

  const totalAssets = calculateTotal(assets);
  const totalLiabilities = calculateTotal(liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const totalIncome = calculateTotal(income);
  const totalExpenses = calculateTotal(expenses);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-indigo-800">Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Total Assets</p>
            <p className="text-2xl font-bold text-indigo-900">{formatIndianCurrency(totalAssets)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-600">Total Liabilities</p>
            <p className="text-2xl font-bold text-indigo-900">{formatIndianCurrency(totalLiabilities)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-600">Net Worth</p>
            <p className="text-2xl font-bold text-indigo-900">{formatIndianCurrency(netWorth)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-600">Savings Rate</p>
            <p className="text-2xl font-bold text-indigo-900">{savingsRate.toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
