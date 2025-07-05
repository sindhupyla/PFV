'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useCurrency } from './CurrencyContext';

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
  currency?: string; // Optional to maintain compatibility with existing data
};

type TransactionContextType = {
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
    deleteTransaction: (id: string) => void;
    deleteTransactionsByCategory: (categoryId: string) => void;
    isLoading: boolean;
  };

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currency } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data from localStorage on client side
    const saved = localStorage.getItem('transactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Save to localStorage only on client side and after initial load is complete
    if (!isLoading) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: Number(transaction.amount) * (transaction.type === 'expense' ? -1 : 1),
      currency: transaction.currency
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(transaction => transaction.id !== id));
  };

  const deleteTransactionsByCategory = (categoryId: string) => {
    setTransactions(transactions.filter(transaction => transaction.categoryId !== categoryId));
  };

  return (
    <TransactionContext.Provider value={{ 
      transactions, 
      setTransactions,
      addTransaction, 
      deleteTransaction,
      deleteTransactionsByCategory,
      isLoading 
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};