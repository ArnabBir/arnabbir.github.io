import React, { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Download,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import CommandMenu from "@/components/CommandMenu";
import ScrollProgress from "@/components/ScrollProgress";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/layout/SectionHeading";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import AssetLiabilityChart from "../components/portfoliohub/AssetLiabilityChart";
import FinancialDataForm from "../components/portfoliohub/FinancialDataForm";
import FireCalculator from "../components/portfoliohub/FireCalculator";
import IncomeExpenseChart from "../components/portfoliohub/IncomeExpenseChart";
import NetWorthChart from "../components/portfoliohub/NetWorthChart";
import PortfolioDistribution from "../components/portfoliohub/PortfolioDistribution";
import PortfolioSummary from "../components/portfoliohub/PortfolioSummary";
import { exportToExcel, importFromExcel } from "../utils/excelUtils";
import { downloadReport } from "../utils/reportGenerator";
import { formatIndianCurrency } from "../utils/currencyFormatter";

const SAMPLE_DATA = {
  assets: {
    cashAndEquivalents: {
      savingsAccounts: 350000,
      cashInHand: 20000,
      cryptocurrencies: 50000,
    },
    deposits: {
      bankFDsAndRDs: 800000,
      postOfficeSchemes: 120000,
      ppf: 240000,
      epf: 300000,
      nps: 180000,
      governmentBonds: 90000,
      rbiBonds: 60000,
      sovereignGoldBonds: 110000,
    },
    marketLinkedInvestments: {
      indianStocks: 450000,
      foreignStocks: 300000,
      mutualFunds: 650000,
    },
    commodities: {
      gold: 200000,
      silver: 30000,
      otherCommodities: 0,
    },
    realEstate: 2500000,
    retirementAndPensionPlans: {
      pensionPlans: 300000,
      annuities: 0,
      lifeInsurancePolicies: 200000,
      endowmentPlans: 150000,
      ulips: 100000,
      wholeLifeInsurance: 0,
    },
    employeeBenefits: {
      esops: 400000,
      rsus: 250000,
    },
    miscellaneous: 50000,
  },
  liabilities: {
    homeLoan: 1200000,
    personalLoan: 150000,
    creditCardDebt: 30000,
    otherLoans: 0,
  },
  income: {
    salary: 1800000,
    businessIncome: 200000,
    rentalIncome: 120000,
    dividends: 50000,
    interest: 60000,
    otherIncome: 30000,
  },
  expenses: {
    housing: 450000,
    transportation: 120000,
    food: 180000,
    utilities: 90000,
    insurance: 60000,
    healthcare: 70000,
    personalSpending: 150000,
    entertainment: 60000,
    otherExpenses: 40000,
  },
};

const sumValues = (obj = {}) =>
  Object.values(obj).reduce((total, item) => {
    if (typeof item === "number") return total + item;
    if (typeof item === "object" && item !== null) return total + sumValues(item);
    return total;
  }, 0);

const Portfoliohub = () => {
  const [financialData, setFinancialData] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const fileInputRef = useRef(null);

  const totals = useMemo(() => {
    if (!financialData) return null;
    const totalAssets = sumValues(financialData.assets);
    const totalLiabilities = sumValues(financialData.liabilities);
    const netWorth = totalAssets - totalLiabilities;
    const totalIncome = sumValues(financialData.income);
    const totalExpenses = sumValues(financialData.expenses);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    return { totalAssets, totalLiabilities, netWorth, totalIncome, totalExpenses, savingsRate };
  }, [financialData]);

  const handleDataSubmit = (data) => {
    setFinancialData(data);
  };

  const handleExportToExcel = () => {
    if (financialData) {
      exportToExcel(financialData);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const importedData = await importFromExcel(file);
        setFinancialData(importedData);
      } catch (error) {
        console.error("Error importing Excel file:", error);
      }
    }
  };

  const handleDownloadReport = () => {
    if (financialData) {
      downloadReport(financialData);
    }
  };

  const handleUseSample = () => {
    setFinancialData(SAMPLE_DATA);
  };

  const handleClearData = () => {
    setFinancialData(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <ScrollProgress />
      <SiteHeader onOpenCommand={() => setCommandOpen(true)} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />
          </div>
          <Container className="relative py-12">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
              <div className="space-y-6">
                <Badge variant="secondary" className="w-fit">
                  Personal Finance Lab
                </Badge>
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                    PortfolioHub
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    Track everything from cash to equity, visualize the compounding curve, and
                    build a plan to reach financial independence with clarity and confidence.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleUseSample} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Use demo data
                  </Button>
                  <Button variant="outline" onClick={handleImportClick} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import Excel
                  </Button>
                  <Button variant="secondary" asChild className="gap-2">
                    <a href="#portfoliohub-data">
                      Enter my data
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  {financialData && (
                    <Button variant="ghost" onClick={handleClearData}>
                      Reset
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "Unified snapshot",
                      description: "Assets, liabilities, and net worth in one view.",
                      icon: LineChart,
                    },
                    {
                      title: "FIRE timeline",
                      description: "Estimate years to financial independence.",
                      icon: Target,
                    },
                    {
                      title: "Privacy-first",
                      description: "Your data stays in the browser.",
                      icon: ShieldCheck,
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-border bg-card/70 p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border border-border/70 bg-card/80 shadow-sm lg:sticky lg:top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Live snapshot</CardTitle>
                  <CardDescription>
                    Updated instantly when you calculate or import.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {totals ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-border/70 bg-background/70 p-4">
                          <p className="text-xs text-muted-foreground">Net worth</p>
                          <p className="text-lg font-semibold">
                            {formatIndianCurrency(totals.netWorth)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/70 p-4">
                          <p className="text-xs text-muted-foreground">Total assets</p>
                          <p className="text-lg font-semibold">
                            {formatIndianCurrency(totals.totalAssets)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/70 p-4">
                          <p className="text-xs text-muted-foreground">Total liabilities</p>
                          <p className="text-lg font-semibold">
                            {formatIndianCurrency(totals.totalLiabilities)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/70 p-4">
                          <p className="text-xs text-muted-foreground">Annual savings</p>
                          <p className="text-lg font-semibold">
                            {formatIndianCurrency(totals.totalIncome - totals.totalExpenses)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Savings rate</span>
                          <span className="font-medium text-foreground">
                            {totals.savingsRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={Math.min(100, Math.max(0, totals.savingsRate))} />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                        No data yet. Use demo data or enter your own snapshot to see
                        personalized insights.
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        Data stays locally in your browser.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>

        <section className="border-b bg-muted/30">
          <Container className="py-12">
            <SectionHeading
              eyebrow="How it works"
              title="A clear path from numbers to decisions"
              description="PortfolioHub turns a messy spreadsheet into an understandable financial
              narrative, so you can make decisions with confidence."
            />
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Collect",
                  description: "Capture assets, liabilities, income, and expenses in minutes.",
                },
                {
                  title: "Understand",
                  description: "See distribution, net worth trajectory, and savings rate.",
                },
                {
                  title: "Plan",
                  description: "Estimate your FIRE runway and export a shareable report.",
                },
              ].map((step, index) => (
                <Card key={step.title} className="border-border/70 bg-card/80">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      <span className="text-primary">{String(index + 1).padStart(2, "0")}.</span>{" "}
                      {step.title}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section id="portfoliohub-data" className="scroll-mt-24">
          <Container className="py-12 space-y-8">
            <SectionHeading
              eyebrow="Data entry"
              title="Add your financial snapshot"
              description="All values are in INR. Income and expense fields are annual totals."
            />
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
              <FinancialDataForm onSubmit={handleDataSubmit} initialData={financialData} />
              <div className="space-y-4">
                <Card className="border-border/70 bg-card/80">
                  <CardHeader>
                    <CardTitle className="text-lg">What you get</CardTitle>
                    <CardDescription>Built-in analysis, instantly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <LineChart className="h-4 w-4 text-primary mt-0.5" />
                      Asset vs liability composition with distribution breakdowns.
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-primary mt-0.5" />
                      FIRE timeline and savings rate diagnostics.
                    </div>
                    <div className="flex items-start gap-2">
                      <Download className="h-4 w-4 text-primary mt-0.5" />
                      Export-ready Excel and a PDF report for reviews.
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/70 bg-card/80">
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy and control</CardTitle>
                    <CardDescription>No servers, no sign-ups.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      PortfolioHub runs entirely in your browser. Your inputs never leave
                      this device unless you export them.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Local only</Badge>
                      <Badge variant="outline">No account required</Badge>
                      <Badge variant="outline">Offline friendly</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {financialData ? (
          <section className="border-t bg-muted/20">
            <Container className="py-12 space-y-8">
              <SectionHeading
                eyebrow="Insights dashboard"
                title="Your portfolio, visualized"
                description="Use these dashboards to spot risks, tune allocation, and track
                progress toward independence."
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <PortfolioSummary data={financialData} />
                <FireCalculator data={financialData} />
                <div id="asset-liability-chart">
                  <AssetLiabilityChart data={financialData} />
                </div>
                <div id="portfolio-distribution">
                  <PortfolioDistribution data={financialData} />
                </div>
                <div id="income-expense-chart">
                  <IncomeExpenseChart data={financialData} />
                </div>
              </div>
              <div id="net-worth-chart">
                <NetWorthChart data={financialData} />
              </div>
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">Export and share</CardTitle>
                  <CardDescription>Take your dashboard offline or into a meeting.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button onClick={handleExportToExcel} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </Button>
                  <Button onClick={handleDownloadReport} variant="secondary" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download report
                  </Button>
                  <Button onClick={handleImportClick} variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import another file
                  </Button>
                  <Button onClick={handleClearData} variant="ghost">
                    Reset dashboard
                  </Button>
                </CardContent>
              </Card>
            </Container>
          </section>
        ) : (
          <section className="border-t bg-muted/20">
            <Container className="py-12">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-lg">No data yet</CardTitle>
                  <CardDescription>
                    Load demo data or add your financial snapshot to unlock the
                    dashboards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button onClick={handleUseSample} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Use demo data
                  </Button>
                  <Button onClick={handleImportClick} variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import Excel
                  </Button>
                </CardContent>
              </Card>
            </Container>
          </section>
        )}
      </main>

      <SiteFooter />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
        ref={fileInputRef}
      />
    </div>
  );
};

export default Portfoliohub;
