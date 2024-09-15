import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AssetLiabilityChart = ({ data = {} }) => {
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

  const totalAssets = calculateTotal(data.assets || {});
  const totalLiabilities = calculateTotal(data.liabilities || {});

  const chartData = [
    { name: 'Assets', value: totalAssets },
    { name: 'Liabilities', value: totalLiabilities },
  ];

  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets vs Liabilities</CardTitle>
      </CardHeader>
      <CardContent>
        {totalAssets > 0 || totalLiabilities > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p>No asset or liability data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetLiabilityChart;
