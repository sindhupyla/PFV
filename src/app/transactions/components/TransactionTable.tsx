import { useState } from 'react';
import { formatMoney } from '@/lib/formatUtils';
import { useLanguage } from '@/context/LanguageContext';

type SortField = 'date' | 'amount';
type SortDirection = 'asc' | 'desc' | 'none';

const SortIcon = ({ active, direction }) => {
  if (!active || direction === 'none') {
    return (
      <span className="ml-2 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6-6 6 6M6 15l6 6 6-6"/>
        </svg>
      </span>
    );
  }
  
  return (
    <span className="ml-2 text-blue-500">
      {direction === 'asc' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 15l6-6 6 6"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      )}
    </span>
  );
};

export function TransactionTable({ 
  transactions, 
  categories, 
  currency, 
  currencies,
  convertAmount, 
  onDelete 
}) {
  const { t } = useLanguage();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return 'none';
        return 'asc';
      });
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortDirection === 'none') return 0;
    
    if (sortField === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'amount') {
      const amountA = convertAmount(Math.abs(a.amount), a.currency);
      const amountB = convertAmount(Math.abs(b.amount), b.currency);
      return sortDirection === 'asc' ? amountA - amountB : amountB - amountA;
    }
    return 0;
  });

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr>
            <th className="p-4 text-left">{t('transactions.category')}</th>
            <th className="p-4 text-left">{t('transactions.description')}</th>
            <th 
              className="p-4 text-left cursor-pointer hover:bg-foreground/5" 
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center">
                {t('transactions.date')}
                <SortIcon 
                  active={sortField === 'date'} 
                  direction={sortDirection} 
                />
              </div>
            </th>
            <th className="p-4 text-left">{t('transactions.type')}</th>
            <th 
              className="p-4 text-right cursor-pointer hover:bg-foreground/5" 
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end">
                {t('transactions.amount')}
                <SortIcon 
                  active={sortField === 'amount'} 
                  direction={sortDirection} 
                />
              </div>
            </th>
            <th className="p-4 text-center">{t('transactions.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                {t('transactions.noTransactions')}
              </td>
            </tr>
          ) : (
            sortedTransactions.map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoryId);
              return (
                <tr key={transaction.id} className="border-b border-border hover:bg-foreground/5">
                  <td className="p-4">
                    <div className="flex items-center gap-2 relative group">
                      <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        {category?.icon}
                      </span>
                      <span className="truncate">{category?.name}</span>
                      {(category?.name?.length || 0) > 15 && (
                        <div className="absolute hidden group-hover:block left-0 -top-8 bg-black text-white text-sm rounded-lg px-2 py-1 whitespace-nowrap z-10">
                          {category?.name}
                          <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-black"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="relative group">
                      <span className="truncate block">{transaction.description}</span>
                      {transaction.description.length > 30 && (
                        <div className="absolute hidden group-hover:block left-0 -top-8 bg-black text-white text-sm rounded-lg px-2 py-1 whitespace-nowrap z-10">
                          {transaction.description}
                          <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-black"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                      {t(`transactions.${transaction.type}`)}
                    </span>
                  </td>
                  <td className={`p-4 text-right ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {currencies.find(c => c.code === transaction.currency)?.symbol || currency.symbol}
                    {formatMoney(Math.abs(transaction.amount))}
                    {transaction.currency !== currency.code && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({currency.symbol}
                        {formatMoney(convertAmount(Math.abs(transaction.amount), transaction.currency))})
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm(t('transactions.deleteConfirm'))) {
                          onDelete(transaction.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      aria-label={t('common.delete')}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}