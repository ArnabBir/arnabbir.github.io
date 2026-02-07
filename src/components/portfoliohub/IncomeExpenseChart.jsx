import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatIndianCurrency } from "../../utils/currencyFormatter";

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
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Income vs expenses</CardTitle>
        <CardDescription>Annual cashflow comparison.</CardDescription>
      </CardHeader>
      <CardContent>
        {totalIncome > 0 || totalExpenses > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => formatIndianCurrency(value)} />
              <Tooltip formatter={(value) => formatIndianCurrency(value)} />
              <Legend />
              <Bar dataKey="Income" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            No income or expense data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;
