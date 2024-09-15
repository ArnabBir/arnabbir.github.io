import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FinancialDataForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (category, subcategory, field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [category]: {
        ...prevData[category],
        [subcategory]: {
          ...prevData[category][subcategory],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderInputField = (category, subcategory, field, label) => (
    <div key={`${category}-${subcategory}-${field}`} className="mb-2">
      <Label htmlFor={`${category}-${subcategory}-${field}`} className="capitalize text-sm font-medium text-gray-700">
        {label || field.replace(/([A-Z])/g, ' $1').trim()}
      </Label>
      <Input
        id={`${category}-${subcategory}-${field}`}
        type="text"
        value={formData[category][subcategory] ? formData[category][subcategory][field] : 0}
        onChange={(e) => {
          const value = e.target.value;
          if (value === '' || /^\d*\.?\d*$/.test(value)) {
            handleInputChange(category, subcategory, field, value);
          }
        }}
        className={`mt-1 ${!/^\d*\.?\d*$/.test(formData[category][subcategory] ? formData[category][subcategory][field] : '') ? 'border-red-500' : ''}`}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-indigo-800">Enter Your Financial Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assets">
              <AccordionTrigger className="text-xl font-semibold text-indigo-700">Assets</AccordionTrigger>
              <AccordionContent>
                {Object.entries(formData.assets).map(([subcategory, fields]) => (
                  <div key={subcategory} className="mb-4">
                    <h4 className="text-lg font-medium text-indigo-600 mb-2">{subcategory.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    {typeof fields === 'object' ? 
                      Object.entries(fields).map(([field, value]) => renderInputField('assets', subcategory, field))
                      : renderInputField('assets', 'assets', subcategory)
                    }
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="liabilities">
              <AccordionTrigger className="text-xl font-semibold text-indigo-700">Liabilities</AccordionTrigger>
              <AccordionContent>
                {Object.entries(formData.liabilities).map(([field, value]) => renderInputField('liabilities', 'liabilities', field))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="income">
              <AccordionTrigger className="text-xl font-semibold text-indigo-700">Income</AccordionTrigger>
              <AccordionContent>
                {Object.entries(formData.income).map(([field, value]) => renderInputField('income', 'income', field))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="expenses">
              <AccordionTrigger className="text-xl font-semibold text-indigo-700">Expenses</AccordionTrigger>
              <AccordionContent>
                {Object.entries(formData.expenses).map(([field, value]) => renderInputField('expenses', 'expenses', field))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
        Calculate
      </Button>
    </form>
  );
};

export default FinancialDataForm;
