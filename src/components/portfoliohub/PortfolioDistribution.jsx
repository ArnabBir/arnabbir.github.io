import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Distribution</CardTitle>
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
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
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
