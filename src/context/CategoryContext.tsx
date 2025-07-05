'use client';

import { createContext, useContext, useEffect, useState } from 'react'; 
import { Transaction } from '@/context/TransactionContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';

type Category = {
  id: string;
  name: string;
  icon: string;
  budget: number | null;
};

type CategoryWithTotals = Category & {
  totalIncome: number;
  totalExpense: number;
  budgetWarning: string | null;
};

const MAX_CATEGORIES = 20;

type CategoryContextType = {
    categories: Category[];
    addCategory: (name: string, icon: string, budget: number | null) => void;
    deleteCategory: (id: string, force?: boolean, onDelete?: (id: string) => void) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    getCategoryTotals: (transactions: Transaction[]) => CategoryWithTotals[];
    getCategoryTransactionCount: (transactions: Transaction[], categoryId: string) => number;
    hasReachedLimit: boolean;
    isLoading: boolean;
  };

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }) {
  const savedCategories = localStorage.getItem('categories');
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>(() => {
    

    if (savedCategories) {
      return JSON.parse(savedCategories);
    }
    
    // Only add default categories if there are no saved categories
    const defaultCategories = [
      { id: '1', name: t('defaultCategories.groceries'), icon: '🛒', budget: 500 },
      { id: '2', name: t('defaultCategories.rent'), icon: '🏠', budget: 700 },
      { id: '3', name: t('defaultCategories.utilities'), icon: '💡', budget: null },
      { id: '4', name: t('defaultCategories.transportation'), icon: '🚗', budget: 400 },
      { id: '5', name: t('defaultCategories.entertainment'), icon: '🎮', budget: 150 },
      { id: '6', name: t('defaultCategories.healthcare'), icon: '🏥', budget: null },
      { id: '7', name: t('defaultCategories.education'), icon: '📚', budget: null },
      { id: '8', name: t('defaultCategories.shopping'), icon: '🛍️', budget: 1000 },
      { id: '9', name: t('defaultCategories.salary'), icon: '💰', budget: null },
      { id: '10', name: t('defaultCategories.investment'), icon: '📈', budget: 800 },
    ];
    
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
    return defaultCategories;
  });

  const [isLoading, setIsLoading] = useState(true);
  const { currency, convertAmount, formatAmount } = useCurrency();

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const hasReachedLimit = categories.length >= MAX_CATEGORIES;

  const addCategory = (name: string, icon: string, budget: number | null) => {
    if (hasReachedLimit) {
      return;
    }
    setCategories([...categories, { 
      id: Date.now().toString(), 
      name, 
      icon, 
      budget 
    }]);
  };

  const getCategoryTotals = (transactions: Transaction[]) => {
    const { t } = useLanguage();
    const { formatAmount } = useCurrency();

    return categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.categoryId === category.id);
      
      const totalIncome = categoryTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = convertAmount(Math.abs(t.amount), t.currency);
          return sum + convertedAmount;
        }, 0);
      
      const totalExpense = categoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = convertAmount(Math.abs(t.amount), t.currency);
          return sum + convertedAmount;
        }, 0);

      let budgetWarning = null;
      if (category.budget) {
        const usagePercent = Math.round((totalExpense / category.budget) * 100);
        
        if (totalExpense > category.budget) {
          const exceededAmount = formatAmount(totalExpense - category.budget);
          budgetWarning = t('categories.budgetWarnings.exceeded').replace('{amount}', exceededAmount) as unknown as null;
        } else if (usagePercent >= 80) {
          budgetWarning = t('categories.budgetWarnings.approaching').replace('{percent}', usagePercent.toString()) as unknown as null;
        }
      }

      return {
        ...category,
        totalIncome,
        totalExpense,
        budgetWarning
      };
    });
  };

  const getCategoryTransactionCount = (transactions: Transaction[], categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId).length;
  };

  const deleteCategory = (id: string, deleteTransactions = false, onDeleteTransactions?: (categoryId: string) => void) => {
    if (deleteTransactions && onDeleteTransactions) {
      onDeleteTransactions(id);
    }
    setCategories(categories.filter(category => category.id !== id));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...updates } : category
    ));
  };

  return (
    <CategoryContext.Provider value={{ 
      categories, 
      addCategory, 
      deleteCategory,
      updateCategory,
      isLoading,
      getCategoryTotals,
      getCategoryTransactionCount,
      hasReachedLimit
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};