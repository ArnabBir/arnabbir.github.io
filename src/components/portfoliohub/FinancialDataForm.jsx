import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const buildEmptyFormData = () => ({
    assets: {
      cashAndEquivalents: {
        savingsAccounts: 0,
        cashInHand: 0,
        cryptocurrencies: 0,
      },
      deposits: {
        bankFDsAndRDs: 0,
        postOfficeSchemes: 0,
        ppf: 0,
        epf: 0,
        nps: 0,
        governmentBonds: 0,
        rbiBonds: 0,
        sovereignGoldBonds: 0,
      },
      marketLinkedInvestments: {
        indianStocks: 0,
        foreignStocks: 0,
        mutualFunds: 0,
      },
      commodities: {
        gold: 0,
        silver: 0,
        otherCommodities: 0,
      },
      realEstate: 0,
      retirementAndPensionPlans: {
        pensionPlans: 0,
        annuities: 0,
        lifeInsurancePolicies: 0,
        endowmentPlans: 0,
        ulips: 0,
        wholeLifeInsurance: 0,
      },
      employeeBenefits: {
        esops: 0,
        rsus: 0,
      },
      miscellaneous: 0,
    },
    liabilities: {
      homeLoan: 0,
      personalLoan: 0,
      creditCardDebt: 0,
      otherLoans: 0,
    },
    income: {
      salary: 0,
      businessIncome: 0,
      rentalIncome: 0,
      dividends: 0,
      interest: 0,
      otherIncome: 0,
    },
    expenses: {
      housing: 0,
      transportation: 0,
      food: 0,
      utilities: 0,
      insurance: 0,
      healthcare: 0,
      personalSpending: 0,
      entertainment: 0,
      otherExpenses: 0,
    },
  });

const FinancialDataForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData || buildEmptyFormData());

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(buildEmptyFormData());
    }
  }, [initialData]);

  const handleInputChange = (category, subcategory, field, value) => {
    setFormData((prevData) => {
      if (!subcategory) {
        return {
          ...prevData,
          [category]: {
            ...prevData[category],
            [field]: parseFloat(value) || 0,
          },
        };
      }

      return {
        ...prevData,
        [category]: {
          ...prevData[category],
          [subcategory]: {
            ...(prevData[category]?.[subcategory] || {}),
            [field]: parseFloat(value) || 0,
          },
        },
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderInputField = (category, subcategory, field, label) => {
    const inputId = `${category}-${subcategory || "root"}-${field}`;
    const currentValue = subcategory
      ? formData?.[category]?.[subcategory]?.[field]
      : formData?.[category]?.[field];

    return (
      <div key={inputId} className="space-y-1">
        <Label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">
          {label || field.replace(/([A-Z])/g, " $1").trim()}
        </Label>
        <Input
          id={inputId}
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={currentValue ?? 0}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
              handleInputChange(category, subcategory, field, value);
            }
          }}
          className={`h-9 ${
            !/^\d*\.?\d*$/.test(String(currentValue ?? ""))
              ? "border-destructive"
              : ""
          }`}
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Financial inputs</CardTitle>
          <CardDescription>
            Enter totals in INR. Use annual values for income and expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem value="assets">
              <AccordionTrigger className="text-sm font-semibold">Assets</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {Object.entries(formData.assets).map(([subcategory, fields]) => {
                  const title = subcategory.replace(/([A-Z])/g, " $1").trim();
                  const isGroup = typeof fields === "object" && fields !== null;

                  return (
                    <div key={subcategory} className="rounded-lg border border-border/70 bg-background/60 p-4">
                      <div className="text-sm font-semibold text-foreground">{title}</div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {isGroup
                          ? Object.entries(fields).map(([field]) =>
                              renderInputField("assets", subcategory, field)
                            )
                          : renderInputField("assets", null, subcategory)}
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="liabilities">
              <AccordionTrigger className="text-sm font-semibold">Liabilities</AccordionTrigger>
              <AccordionContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(formData.liabilities).map(([field]) =>
                  renderInputField("liabilities", null, field)
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="income">
              <AccordionTrigger className="text-sm font-semibold">Income</AccordionTrigger>
              <AccordionContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(formData.income).map(([field]) =>
                  renderInputField("income", null, field)
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="expenses">
              <AccordionTrigger className="text-sm font-semibold">Expenses</AccordionTrigger>
              <AccordionContent className="grid gap-3 sm:grid-cols-2">
                {Object.entries(formData.expenses).map(([field]) =>
                  renderInputField("expenses", null, field)
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      <Button type="submit" className="w-full">
        Calculate and update dashboard
      </Button>
    </form>
  );
};

export default FinancialDataForm;
