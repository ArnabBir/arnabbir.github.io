import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatIndianCurrency } from '../../utils/currencyFormatter';

const PortfolioDistribution = ({ data = {} }) => {
  const { assets = {} } = data;

  const calculateTotal = (obj) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (typeof value === 'number') {
        acc.push({ name: key, value });
      } else if (typeof value === 'object') {
        const subTotal = calculateTotal(value);
        acc.push({ name: key, value: subTotal.reduce((sum, item) => sum + item.value, 0) });
      }
      return acc;
    }, []);
  };

  const chartData = calculateTotal(assets);
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-bold">{data.name}</p>
          <p>{formatIndianCurrency(data.value)} ({((data.value / totalValue) * 100).toFixed(2)}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-800">Portfolio Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
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
          <p>No asset data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioDistribution;
