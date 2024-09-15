import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatIndianCurrency } from '../../utils/currencyFormatter';

const IncomeExpenseChart = ({ data }) => {
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

  const totalIncome = calculateTotal(data.income || {});
  const totalExpenses = calculateTotal(data.expenses || {});

  const chartData = [
    {
      category: 'Income vs Expenses',
      Income: totalIncome,
      Expenses: totalExpenses,
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-indigo-800">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {totalIncome > 0 || totalExpenses > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => formatIndianCurrency(value)} />
              <Tooltip formatter={(value) => formatIndianCurrency(value)} />
              <Legend />
              <Bar dataKey="Income" fill="#8884d8" />
              <Bar dataKey="Expenses" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>No income or expense data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;
