import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-emerald-800">FIRE Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fireNumber" className="text-lg font-semibold text-emerald-700">FIRE Number (₹)</Label>
            <Input
              id="fireNumber"
              type="number"
              value={fireNumber}
              onChange={(e) => setFireNumber(Number(e.target.value))}
              className="mt-1 text-lg"
            />
          </div>
          <p className="text-xl font-semibold mt-4 text-emerald-900">
            Time to FIRE: {yearsToFire.years === Infinity ? 'N/A' : `${yearsToFire.years} years and ${yearsToFire.months} months`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FireCalculator;
