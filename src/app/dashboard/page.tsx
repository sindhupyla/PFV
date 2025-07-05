'use client';

import { useCategories } from '@/context/CategoryContext';
import { useTransactions } from '@/context/TransactionContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateColors, generateBarColors } from '@/lib/colorUtils';
import { formatMoney } from '@/lib/formatUtils';
import { useState } from 'react';
import { ExpenseTable } from './components/ExpenseTable';
import { TrendTable } from './components/TrendTable';
import { useLanguage } from '@/context/LanguageContext';

// Add this interface near the top of the file
interface MonthlyData {
  income: number;
  expense: number;
}

export default function Dashboard() {
  const { getCategoryTotals } = useCategories();
  const { transactions, isLoading } = useTransactions();
  const { theme } = useTheme();
  const { currency, convertAmount } = useCurrency();
  const [showPieAsTable, setShowPieAsTable] = useState(false);
  const [showBarAsTable, setShowBarAsTable] = useState(false);
  const { t, language } = useLanguage();
  const [chartType, setChartType] = useState<'expense' | 'income'>('expense');

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const categoryTotals = getCategoryTotals(transactions);
  const totalIncome = categoryTotals.reduce((sum, cat) => sum + cat.totalIncome, 0);
  const totalExpense = categoryTotals.reduce((sum, cat) => sum + cat.totalExpense, 0);
  const balance = totalIncome - totalExpense;

  // Prepare data for pie charts
  const expensePieData = categoryTotals
    .filter(cat => cat.totalExpense > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.totalExpense
    }));

  const incomePieData = categoryTotals
    .filter(cat => cat.totalIncome > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.totalIncome
    }));

  // Prepare data for pie chart (expense distribution)
  const pieChartData = categoryTotals
    .filter(cat => cat.totalExpense > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.totalExpense
    }));

  // Generate colors dynamically based on the number of categories with expenses
  const pieColors = generateColors(pieChartData.length, theme);
  const barColors = generateBarColors(theme);

  // Prepare data for bar chart (monthly trends)
  const monthlyData = transactions.reduce<Record<string, MonthlyData>>((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthYear = `${date.toLocaleString(language.code, { month: 'short' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = { income: 0, expense: 0 };
    }
    
    const convertedAmount = convertAmount(Math.abs(transaction.amount), transaction.currency);
    if (transaction.type === 'income') {
      acc[monthYear].income += convertedAmount;
    } else {
      acc[monthYear].expense += Math.abs(convertedAmount);
    }
    
    return acc;
  }, {});

  const barChartData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    Income: Math.abs(data.income),
    Expenses: Math.abs(data.expense)
  }));

  // Convert barChartData array to Record format for TrendTable
  const trendTableData = barChartData.reduce((acc, item) => {
    acc[item.month] = {
      income: item.Income,
      expense: item.Expenses
    };
    return acc;
  }, {} as Record<string, MonthlyData>);

  // Custom tooltip formatter for the bar chart
  const barTooltipFormatter = (value: number) => {
    return `${currency.symbol}${formatMoney(Math.abs(value))}`;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
    payload,
    name
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Use the percent value directly from the props
    const actualPercent = percent * 100;
    
    let percentText;
    if (actualPercent < 0.1) {
      percentText = '< 0.1%';
    } else if (actualPercent > 99.9) {
      percentText = '> 99.9%';
    } else {
      percentText = `${actualPercent.toFixed(1)}%`;
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        style={{
          filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.5))'
        }}
      >
        {percentText}
      </text>
    );
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="fixed top-0 left-0 right-0 h-16 bg-background-10 backdrop-blur-xl border-b border-border z-10 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {t('common.appName')}
          </h1>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 mt-16 md:mt-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-4xl font-bold">{t('dashboard.title')}</h1>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border">
            <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{t('dashboard.totalBalance')}</h3>
            <p className="text-xl sm:text-3xl font-bold">{currency.symbol}{formatMoney(balance)}</p>
          </div>
          
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-border">
            <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{t('dashboard.totalIncome')}</h3>
            <p className="text-xl sm:text-3xl font-bold text-green-500">{currency.symbol}{formatMoney(totalIncome)}</p>
          </div>
          
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-border sm:col-span-2 xl:col-span-1">
            <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">{t('dashboard.totalExpenses')}</h3>
            <p className="text-xl sm:text-3xl font-bold text-red-500">{currency.symbol}{formatMoney(totalExpense)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl border border-border bg-background-10">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <div className="flex gap-4 mb-4 sm:mb-0">
                <button
                  onClick={() => setChartType('expense')}
                  className={`${chartType === 'expense' ? 'text-red-500 underline' : ''}`}
                >
                  {t('dashboard.expenses')}
                </button>
                <span>/</span>
                <button
                  onClick={() => setChartType('income')}
                  className={`${chartType === 'income' ? 'text-green-500 underline' : ''}`}
                >
                  {t('dashboard.income')}
                </button>
                <span>{t('dashboard.distribution')}</span>
              </div>
              <button
                onClick={() => setShowPieAsTable(!showPieAsTable)}
                className="text-sm"
              >
                {showPieAsTable ? t('dashboard.charts.toggleView.showChart') : t('dashboard.charts.toggleView.showTable')}
              </button>
            </div>
            
            <div className="h-[300px] sm:h-[400px]">
              {((chartType === 'expense' ? expensePieData : incomePieData).length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <span className="text-4xl">
                    {chartType === 'expense' ? '📊' : '💰'}
                  </span>
                  <div>
                    <p className="text-lg font-medium mb-1">
                      {chartType === 'expense' 
                        ? t('dashboard.charts.pieChart.noExpenses')
                        : t('dashboard.charts.pieChart.noIncome')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.noTransactions')}
                    </p>
                  </div>
                </div>
              ) : showPieAsTable ? (
                <ExpenseTable 
                  data={chartType === 'expense' ? expensePieData : incomePieData} 
                  currency={currency} 
                  formatMoney={formatMoney}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="w-full sm:w-full h-[250px] sm:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartType === 'expense' ? expensePieData : incomePieData}
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={window.innerWidth < 640 ? "60%" : "80%"}
                          minAngle={17}
                          dataKey="value"
                        >
                          {(chartType === 'expense' ? expensePieData : incomePieData).map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={pieColors[index]}
                              style={{ outline: 'none' }}
                            />
                          ))}
                        </Pie>
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          wrapperStyle={{
                            fontSize: window.innerWidth < 640 ? '10px' : '12px',
                            paddingLeft: window.innerWidth < 640 ? '10px' : '20px'
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number) => `${currency.symbol}${formatMoney(value)}`}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: '#000000',
                            fontSize: window.innerWidth < 640 ? '10px' : '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 rounded-2xl border border-border bg-background-10">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h2 className="text-xl font-semibold mb-4 sm:mb-0">
                {t('dashboard.monthlyTrends')}
              </h2>
              <button
                onClick={() => setShowBarAsTable(!showBarAsTable)}
                className="text-sm"
              >
                {showBarAsTable ? t('dashboard.charts.toggleView.showChart') : t('dashboard.charts.toggleView.showTable')}
              </button>
            </div>
            
            <div className="h-[300px] sm:h-[400px]">
              {Object.keys(monthlyData).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <span className="text-4xl">📈</span>
                  <div>
                    <p className="text-lg font-medium mb-1">{t('dashboard.charts.barChart.noData')}</p>
                    <p className="text-sm text-muted-foreground">{t('dashboard.noTransactions')}</p>
                  </div>
                </div>
              ) : showBarAsTable ? (
                <TrendTable 
                  data={trendTableData} 
                  currency={currency} 
                  formatMoney={formatMoney} 
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%" key={`bar-${theme}`}>
                  <BarChart 
                    data={barChartData} 
                    margin={{ top: 20, right: 30, left: 50, bottom: 5 }} 
                    key={`bar-chart-${theme}`}
                  >
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => {
                        if (value >= 1000000000) {
                          return `${currency.symbol}${(value / 1000000000).toFixed(1)}B`;
                        } else if (value >= 1000000) {
                          return `${currency.symbol}${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `${currency.symbol}${(value / 1000).toFixed(1)}K`;
                        }
                        return `${currency.symbol}${formatMoney(Math.abs(value))}`;
                      }}
                      width={70}
                    />
                    <Tooltip 
                      formatter={barTooltipFormatter}
                      labelStyle={{ color: 'var(--foreground)' }}
                    />
                    <Bar 
                      dataKey="Income" 
                      fill={barColors.income} 
                      minPointSize={20}
                      name={t('dashboard.income')}
                    />
                    <Bar 
                      dataKey="Expenses" 
                      fill={barColors.expense} 
                      minPointSize={20}
                      name={t('dashboard.expenses')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}