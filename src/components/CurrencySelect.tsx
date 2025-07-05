import { useCurrency } from '@/context/CurrencyContext';

export function CurrencySelect() {
  const { currency, setCurrency, currencies } = useCurrency();
  
  return (
    <select
      value={currency.code}
      onChange={(e) => {
        const newCurrency = currencies.find(c => c.code === e.target.value);
        if (newCurrency) setCurrency(newCurrency);
      }}
      className="w-full px-4 py-2 rounded-lg bg-background border border-border select-field"
    >
      {currencies.map((curr) => (
        <option key={curr.code} value={curr.code}>
          {curr.code}
        </option>
      ))}
    </select>
  );
} 