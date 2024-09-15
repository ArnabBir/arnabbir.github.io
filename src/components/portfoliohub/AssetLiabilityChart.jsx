import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency } from '../../utils/currencyFormatter';

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

  const COLORS = ['#4CAF50', '#FF5722'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-bold">{data.name}</p>
          <p>{formatIndianCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-amber-800">Assets vs Liabilities</CardTitle>
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
              <Tooltip content={<CustomTooltip />} />
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
