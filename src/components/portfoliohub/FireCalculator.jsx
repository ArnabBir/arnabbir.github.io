import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatIndianCurrency } from "../../utils/currencyFormatter";

const FireCalculator = ({ data }) => {
  const [fireNumber, setFireNumber] = useState(10000000);
  const [yearsToFire, setYearsToFire] = useState({ years: 0, months: 0 });

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

  const calculateYearsToFire = () => {
    const totalAssets = calculateTotal(data.assets || {});
    const totalIncome = calculateTotal(data.income || {});
    const totalExpenses = calculateTotal(data.expenses || {});
    const annualSavings = totalIncome - totalExpenses;

    if (annualSavings <= 0) {
      setYearsToFire({ years: Infinity, months: 0 });
    } else {
      const totalYears = (fireNumber - totalAssets) / annualSavings;
      const years = Math.floor(totalYears);
      const months = Math.round((totalYears - years) * 12);
      setYearsToFire({ years, months });
    }
  };

  useEffect(() => {
    calculateYearsToFire();
  }, [data, fireNumber]);

  const totalAssets = calculateTotal(data.assets || {});
  const totalIncome = calculateTotal(data.income || {});
  const totalExpenses = calculateTotal(data.expenses || {});
  const annualSavings = totalIncome - totalExpenses;
  const progressValue =
    fireNumber > 0 ? Math.min(100, Math.max(0, (totalAssets / fireNumber) * 100)) : 0;

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">FIRE calculator</CardTitle>
        <CardDescription>Estimate your runway to financial independence.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fireNumber" className="text-sm font-semibold text-muted-foreground">
              Target FIRE number (₹)
            </Label>
            <Input
              id="fireNumber"
              type="number"
              value={fireNumber}
              onChange={(e) => setFireNumber(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div className="rounded-lg border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Time to FIRE</span>
              <span className="text-foreground font-semibold">
                {yearsToFire.years === Infinity
                  ? "N/A"
                  : `${yearsToFire.years}y ${yearsToFire.months}m`}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <Progress value={progressValue} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progressValue.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Annual savings</p>
              <p className="font-semibold">
                {formatIndianCurrency(annualSavings > 0 ? annualSavings : 0)}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 p-3">
              <p className="text-xs text-muted-foreground">Current assets</p>
              <p className="font-semibold">{formatIndianCurrency(totalAssets)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FireCalculator;
