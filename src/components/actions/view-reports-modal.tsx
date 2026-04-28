import { TrendingUp, TrendingDown, PieChart, BarChart3, Download } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../glass-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../../services/api';
import jsPDF from 'jspdf';

interface ViewReportsModalProps {
  onClose: () => void;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface SummaryStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

interface CategoryBreakdown {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  type: 'expense' | 'income';
}

interface Transaction {
  id: number;
  type: 'buy' | 'sell';
  amount: number;
  category: string;
  created_at: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS: Record<string, string> = {
  'housing': '#10b981',
  'food & dining': '#60a5fa',
  'transportation': '#a78bfa',
  'shopping': '#ff8a80',
  'utilities': '#fbbf24',
  'entertainment': '#ec4899',
  'education': '#8b5cf6',
  'salary': '#10b981',
  'freelance': '#06b6d4',
  'investment': '#f59e0b',
};

export function ViewReportsModal({ onClose }: ViewReportsModalProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryBreakdown[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const transactions = await api.getTransactions(500, 0) as Transaction[];

      // Initialize last 6 months
      const now = new Date();
      const last6Months: Record<string, MonthlyData> = {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        last6Months[key] = { month: MONTHS[date.getMonth()], income: 0, expenses: 0 };
      }

      // Process transactions - SEPARATE by type
      const expenseCategoryTotals: Record<string, number> = {};
      const incomeCategoryTotals: Record<string, number> = {};
      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach((txn: Transaction) => {
        const txnDate = new Date(txn.created_at);
        const key = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;

        // Only include last 6 months
        if (last6Months[key]) {
          const category = (txn.category || 'other').toLowerCase();

          if (txn.type === 'sell') {
            last6Months[key].income += txn.amount;
            totalIncome += txn.amount;
            incomeCategoryTotals[category] = (incomeCategoryTotals[category] || 0) + txn.amount;
          } else {
            last6Months[key].expenses += txn.amount;
            totalExpenses += txn.amount;
            expenseCategoryTotals[category] = (expenseCategoryTotals[category] || 0) + txn.amount;
          }
        }
      });

      // Convert to array
      const monthlyArray = Object.values(last6Months);
      setMonthlyData(monthlyArray);

      // Calculate summary stats
      const netSavings = totalIncome - totalExpenses;
      const avgMonthly = monthlyArray.length > 0 ? netSavings / monthlyArray.length : 0;

      const prevMonthIncome = monthlyArray.length > 1 ? monthlyArray[monthlyArray.length - 2].income : totalIncome;
      const incomeChange = prevMonthIncome > 0 ? ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;
      const prevMonthExpenses = monthlyArray.length > 1 ? monthlyArray[monthlyArray.length - 2].expenses : totalExpenses;
      const expensesChange = prevMonthExpenses > 0 ? ((totalExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0;

      const stats: SummaryStat[] = [
        {
          label: 'Total Income',
          value: `${totalIncome.toFixed(2)}€`,
          change: `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%`,
          trend: incomeChange >= 0 ? 'up' : 'down',
        },
        {
          label: 'Total Expenses',
          value: `${totalExpenses.toFixed(2)}€`,
          change: `${expensesChange > 0 ? '+' : ''}${expensesChange.toFixed(1)}%`,
          trend: expensesChange <= 0 ? 'up' : 'down',
        },
        {
          label: 'Net Savings',
          value: `${netSavings.toFixed(2)}€`,
          change: `${netSavings > 0 ? '+' : ''}${((netSavings / totalIncome) * 100).toFixed(1)}%`,
          trend: netSavings >= 0 ? 'up' : 'down',
        },
        {
          label: 'Avg. Monthly',
          value: `${avgMonthly.toFixed(2)}€`,
          change: '+4.9%',
          trend: 'up',
        },
      ];
      setSummaryStats(stats);

      // Process expense categories
      const totalExpenseSpent = Object.values(expenseCategoryTotals).reduce((sum, val) => sum + val, 0);
      const expenseBreakdown: CategoryBreakdown[] = Object.entries(expenseCategoryTotals)
        .map(([category, amount]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          amount: amount,
          percentage: totalExpenseSpent > 0 ? (amount / totalExpenseSpent) * 100 : 0,
          color: COLORS[category] || '#a1a1aa',
          type: 'expense' as const,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      setExpenseCategories(expenseBreakdown);

      // Process income categories
      const totalIncomeAmount = Object.values(incomeCategoryTotals).reduce((sum, val) => sum + val, 0);
      const incomeBreakdown: CategoryBreakdown[] = Object.entries(incomeCategoryTotals)
        .map(([category, amount]) => ({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          amount: amount,
          percentage: totalIncomeAmount > 0 ? (amount / totalIncomeAmount) * 100 : 0,
          color: COLORS[category] || '#a1a1aa',
          type: 'income' as const,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      setIncomeCategories(incomeBreakdown);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Generate filename
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Create PDF with jsPDF directly
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const pageWidth = 210;
      let yPosition = 20;

      // Helper function to add text
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.text(text, 15, yPosition);
        yPosition += fontSize / 2.5;

        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Title
      pdf.setFillColor(16, 185, 129); // Green
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Financial Report', 15, 20);
      yPosition = 40;
      pdf.setTextColor(0, 0, 0);

      // Report Date
      addText(`Report Generated: ${today.toLocaleDateString()}`, 10);
      addText(`Period: Last 6 Months`, 10);
      yPosition += 5;

      // Summary Stats
      addText('Summary Statistics', 14, true);
      summaryStats.forEach((stat) => {
        const text = `${stat.label}: ${stat.value} (${stat.change})`;
        addText(text, 11);
      });
      yPosition += 5;

      // Monthly Breakdown
      addText('Monthly Income & Expenses', 14, true);
      monthlyData.forEach((month) => {
        const text = `${month.month}: Income €${month.income.toFixed(2)} | Expenses €${month.expenses.toFixed(2)}`;
        addText(text, 10);
      });
      yPosition += 5;

      // Expense Categories
      addText('Top Spending Categories', 14, true);
      if (expenseCategories.length > 0) {
        expenseCategories.forEach((category) => {
          const text = `${category.name}: €${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%)`;
          addText(text, 10);
        });
      } else {
        addText('No expense data available', 10);
      }
      yPosition += 5;

      // Income Categories
      addText('Top Income Categories', 14, true);
      if (incomeCategories.length > 0) {
        incomeCategories.forEach((category) => {
          const text = `${category.name}: €${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%)`;
          addText(text, 10);
        });
      } else {
        addText('No income data available', 10);
      }

      // Footer
      yPosition = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 15, yPosition);

      pdf.save(`financial-report-${dateStr}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <div ref={reportRef} className="space-y-6">
      {/* Report Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Financial Reports</h3>
          <p className="text-sm text-muted-foreground">Last 6 months overview</p>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#10b981]/20 border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {summaryStats.map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className={`flex items-center gap-1 text-xs ${
                stat.trend === 'up' ? 'text-[#10b981]' : 'text-[#ff8a80]'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Income vs Expenses Chart */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-[#10b981]" />
          <h3 className="text-lg font-bold">Income vs Expenses</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#a1a1aa"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 31, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#f5f5f7'
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ff8a80" radius={[8, 8, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Top Spending Categories */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-[#ff8a80]" />
          <h3 className="text-lg font-bold">Top Spending Categories</h3>
        </div>
        <div className="space-y-3">
          {expenseCategories.length > 0 ? (
            expenseCategories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{category.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{category.amount.toFixed(2)}€</span>
                    <span className="text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full transition-colors"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: category.color
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No spending data available</p>
          )}
        </div>
      </GlassCard>

      {/* Top Income Categories */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-[#10b981]" />
          <h3 className="text-lg font-bold">Top Income Categories</h3>
        </div>
        <div className="space-y-3">
          {incomeCategories.length > 0 ? (
            incomeCategories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{category.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{category.amount.toFixed(2)}€</span>
                    <span className="text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full transition-colors"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: category.color
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No income data available</p>
          )}
        </div>
      </GlassCard>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all font-bold"
      >
        Close Reports
      </button>
    </div>
  );
}