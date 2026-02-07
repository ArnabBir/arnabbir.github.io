import React from "react";
import { ArrowDownRight, ArrowUpRight, Percent, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIndianCurrency } from "../../utils/currencyFormatter";

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

  const savingsLabel =
    savingsRate >= 30 ? "Strong" : savingsRate >= 15 ? "Healthy" : "Needs focus";

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Portfolio summary</CardTitle>
        <CardDescription>High-level balances and savings performance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total assets</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-xl font-semibold">{formatIndianCurrency(totalAssets)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total liabilities</span>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-xl font-semibold">{formatIndianCurrency(totalLiabilities)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Net worth</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-xl font-semibold">{formatIndianCurrency(netWorth)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Savings rate</span>
              <Percent className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-xl font-semibold">{savingsRate.toFixed(1)}%</p>
              <span className="text-xs text-muted-foreground">{savingsLabel}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;
