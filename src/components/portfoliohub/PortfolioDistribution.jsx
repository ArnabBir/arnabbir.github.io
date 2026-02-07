import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatIndianCurrency } from "../../utils/currencyFormatter";

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

  const COLORS = [
    "#6366f1",
    "#22c55e",
    "#f97316",
    "#0ea5e9",
    "#a855f7",
    "#facc15",
    "#14b8a6",
    "#f43f5e",
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-md border border-border bg-background/95 p-2 text-sm shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-muted-foreground">
            {formatIndianCurrency(data.value)} ({((data.value / totalValue) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Portfolio distribution</CardTitle>
        <CardDescription>Asset allocation across major buckets.</CardDescription>
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
          <p className="text-sm text-muted-foreground">No asset data available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioDistribution;
