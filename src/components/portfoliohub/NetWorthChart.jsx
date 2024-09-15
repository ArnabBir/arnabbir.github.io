import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatIndianCurrency } from '../../utils/currencyFormatter';

const NetWorthChart = ({ data = {} }) => {
  const { assets = {}, liabilities = {} } = data;
  const calculateTotal = (obj) => Object.values(obj).reduce((sum, value) => sum + (typeof value === 'number' ? value : calculateTotal(value)), 0);
  const totalAssets = calculateTotal(assets);
  const totalLiabilities = calculateTotal(liabilities);
  const currentNetWorth = totalAssets - totalLiabilities;

  const projectionData = Array.from({ length: 51 }, (_, index) => {
    const year = new Date().getFullYear() + index;
    const projectedNetWorth = currentNetWorth * Math.pow(1.07, index);
    return { year, netWorth: projectedNetWorth };
  });

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-emerald-800">Net Worth Projection (50 Years)</CardTitle>
      </CardHeader>
      <CardContent>
        {currentNetWorth > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#666" />
              <XAxis dataKey="year" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={(value) => formatIndianCurrency(value)} />
              <Tooltip formatter={(value) => formatIndianCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="netWorth" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground">Please enter your financial data to view the net worth projection.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NetWorthChart;
