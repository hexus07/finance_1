import { api } from '../../services/api';

/**
 * Get transactions for the current month
 */
export const getThisMonthTransactions = (transactions) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return transactions.filter(t => {
    const txnDate = new Date(t.created_at);
    return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
  });
};

/**
 * Calculate total income (from sell transactions)
 */
export const calculateIncome = (transactions) => {
  const thisMonth = getThisMonthTransactions(transactions);
  return thisMonth
    .filter(t => t.type === 'sell')
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate total expenses (from buy transactions)
 */
export const calculateExpenses = (transactions) => {
  const thisMonth = getThisMonthTransactions(transactions);
  return thisMonth
    .filter(t => t.type === 'buy')
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate portfolio value (sum of all assets)
 */
export const calculatePortfolioValue = (assets) => {
  return assets.reduce((sum, asset) => {
    return sum + (asset.quantity * asset.purchase_price);
  }, 0);
};

/**
 * Calculate savings progress percentage
 */
export const calculateSavingsProgress = (balance, savingsGoal) => {
  if (savingsGoal <= 0) return 0;
  return Math.round((balance / savingsGoal) * 100);
};

/**
 * Get all stats for dashboard
 */
export const calculateAllStats = (transactions, assets, user) => {
  const income = calculateIncome(transactions);
  const expenses = calculateExpenses(transactions);
  const portfolioValue = calculatePortfolioValue(assets);
  const savingsProgress = calculateSavingsProgress(user?.balance || 0, user?.savings_goal || 0);

  return {
    income,
    expenses,
    portfolioValue,
    savingsProgress,
    netChange: income - expenses,
  };
};