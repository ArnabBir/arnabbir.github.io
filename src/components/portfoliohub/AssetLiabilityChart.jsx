import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatIndianCurrency } from "../../utils/currencyFormatter";

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

  const COLORS = ["#22c55e", "#f97316"];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-border bg-background/95 p-2 text-sm shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-muted-foreground">{formatIndianCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Assets vs liabilities</CardTitle>
        <CardDescription>How your balance sheet is weighted.</CardDescription>
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
          <p className="text-sm text-muted-foreground">
            No asset or liability data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetLiabilityChart;
