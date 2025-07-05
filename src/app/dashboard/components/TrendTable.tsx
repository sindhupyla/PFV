import { useLanguage } from '@/context/LanguageContext';

type MonthlyData = {
  income: number;
  expense: number;
};

export function TrendTable({ 
  data, 
  currency, 
  formatMoney 
}: { 
  data: Record<string, MonthlyData>;
  currency: { symbol: string };
  formatMoney: (value: number) => string;
}) {
  const { t } = useLanguage();
  
  const sortedMonths = Object.entries(data).sort((a, b) => {
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="overflow-auto max-h-[400px]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="p-4 text-left">{t('dashboard.month')}</th>
            <th className="p-4 text-right">{t('dashboard.income')}</th>
            <th className="p-4 text-right">{t('dashboard.expenses')}</th>
            <th className="p-4 text-right">{t('categories.balance')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedMonths.map(([month, values]) => (
            <tr key={month} className="border-b border-border">
              <td className="p-4">{month}</td>
              <td className="p-4 text-right text-green-500">
                {currency.symbol}{formatMoney(values.income)}
              </td>
              <td className="p-4 text-right text-red-500">
                {currency.symbol}{formatMoney(values.expense)}
              </td>
              <td className="p-4 text-right">
                {currency.symbol}{formatMoney(values.income - values.expense)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}