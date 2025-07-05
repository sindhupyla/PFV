"use client";

import { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useCategories } from "@/context/CategoryContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatMoney } from "@/lib/formatUtils";
import { CategoryTable } from "@/app/categories/components/CategoryTable";
import { useLanguage } from "@/context/LanguageContext";

const getBudgetWarning = (expense: number, budget: number) => {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const percentage = (expense / budget) * 100;
  console.log(expense, budget)
  if (percentage >= 100) {
    return t('categories.budgetWarnings.exceeded').replace('{amount}', 
      `${currency.symbol}${formatMoney(expense - budget)}`
    );
  }
  if (percentage >= 80) {
    return t('categories.budgetWarnings.approaching').replace('{percent}', 
      Math.round(percentage).toString()
    );
  }
  return null;
};

export default function Categories() {
  const {
    categories,
    addCategory,
    deleteCategory,
    getCategoryTotals,
    getCategoryTransactionCount,
    hasReachedLimit,
    updateCategory,
  } = useCategories();
  const { transactions, deleteTransactionsByCategory } = useTransactions();
  const { currency, convertAmount } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const { t } = useLanguage();

  const [showDeleteModal, setShowDeleteModal] = useState<{
    show: boolean;
    categoryId: string;
    hasTransactions: boolean;
  }>({ show: false, categoryId: "", hasTransactions: false });
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "📦",
    budget: null as number | null,
  });
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    icon: string;
    budget: number | null;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    budget: ''
  });
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const categoryTotals = getCategoryTotals(transactions).map(category => ({
    ...category,
    totalExpense: category.totalExpense,
    totalIncome: category.totalIncome,
    budget: category.budget ? category.budget : null,
    budgetWarning: category.budget 
      ? getBudgetWarning(
          category.totalExpense,
          convertAmount(category.budget)
        )
      : null
  }));

  const filteredCategories = categoryTotals.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = (name: string, budget: number | null) => {
    let nameError = '';
    let budgetError = '';

    if (!name) {
      nameError = t('categories.form.validation.nameRequired');
    } else if (name.length < 3) {
      nameError = t('categories.form.validation.nameMinLength');
    } else if (name.length > 64) {
      nameError = t('categories.form.validation.nameMaxLength');
    }

    if (budget && budget > 100000000000) {
      budgetError = t('categories.form.validation.budgetMax');
    }

    setErrors({ name: nameError, budget: budgetError });
    return !nameError && !budgetError;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(newCategory.name, newCategory.budget)) {
      return;
    }
    
    addCategory(newCategory.name, newCategory.icon, newCategory.budget);
    setNewCategory({ name: "", icon: "📦", budget: null });
    setShowAddModal(false);
  };

  const handleDeleteCategory = (categoryId: string, showModal: boolean, hasTransactions: boolean) => {
    if (showModal) {
      setShowDeleteModal({ show: true, categoryId, hasTransactions });
    } else {
      deleteCategory(categoryId);
    }
  };

  const handleConfirmDelete = () => {
    deleteCategory(showDeleteModal.categoryId, true, (categoryId) => {
      deleteTransactionsByCategory(categoryId);
    });
    setShowDeleteModal({ show: false, categoryId: "", hasTransactions: false });
  };

  const handleEditClick = (category) => {
    setEditingCategory({
      ...category,
      budget: category.budget ? convertAmount(category.budget) : null,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !validateForm(editingCategory.name, editingCategory.budget)) {
      return;
    }

    const budget = editingCategory.budget
      ? convertAmount(Number(editingCategory.budget), currency.code)
      : null;

    updateCategory(editingCategory.id, {
      ...editingCategory,
      budget,
    });
    setShowEditModal(false);
    setEditingCategory(null);
  };

  const formatInputValue = (value: number | null): string => {
    if (value === null) return "";
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const numberValue = value ? Number(value) : null;
    setEditingCategory((prev) =>
      prev ? { ...prev, budget: numberValue } : null
    );
  };

  return (
    <div className="space-y-6 mt-16 md:mt-0 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">{t('categories.title')}</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder={t('categories.searchCategories')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 rounded-lg border border-border bg-background"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-foreground/5 transition-colors"
            >
              {viewMode === "card" ? (
                <>
                  <span>📊</span>
                  {t('categories.viewMode.table')}
                </>
              ) : (
                <>
                  <span>📇</span>
                  {t('categories.viewMode.card')}
                </>
              )}
            </button>
            <div className="flex flex-col items-end gap-2">
              {hasReachedLimit && (
                <p className="text-sm text-yellow-500">
                  {t('categories.categoryLimit')}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  disabled={hasReachedLimit}
                >
                  {t('categories.addCategory')}
                </button>
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="flex-1 sm:flex-initial button-danger"
                >
                  {t('transactions.deleteAll')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-2xl border border-border overflow-x-auto">
          <div className="w-full min-w-[640px]">
            <CategoryTable
              transactions={transactions}
              categories={filteredCategories}
              currency={currency}
              convertAmount={convertAmount}
              onDelete={handleDeleteCategory}
              onEdit={handleEditClick}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="p-4 rounded-lg border border-border bg-background"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    {category.icon}
                  </span>
                  <div className="relative group">
                    <h3 className="font-medium truncate max-w-[150px]">
                      {category.name}
                    </h3>
                    {category.name.length > 20 && (
                      <div className="absolute hidden group-hover:block left-0 -top-8 bg-black text-white text-sm rounded-lg px-2 py-1 whitespace-nowrap z-10">
                        {category.name}
                        <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-black"></div>
                      </div>
                    )}
                  </div>
                  {category.budget && category.budgetWarning && (
                    <div className="relative group">
                      <span className="text-yellow-500 animate-pulse cursor-pointer">⚠️</span>
                      <div className="absolute hidden group-hover:block left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg whitespace-nowrap z-10">
                        {category.budgetWarning}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id, true, transactions.some(t => t.categoryId === category.id))}
                    className="text-red-500 hover:text-red-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-60">
                  {category.budget 
                    ? `${t('categories.budgetPrefix')}${currency.symbol}${formatMoney(convertAmount(category.budget))}` 
                    : t('categories.noBudget')}
                </p>
                <p className="text-sm text-green-500">
                  {t('categories.incomePrefix')}: {currency.symbol}
                  {formatMoney(category.totalIncome)}
                </p>
                <p className="text-sm text-red-500">
                  {t('categories.expensesPrefix')}: {currency.symbol}
                  {formatMoney(category.totalExpense)}
                </p>
                <p className="text-sm font-medium">
                  {t('categories.balancePrefix')}: {currency.symbol}
                  {formatMoney(
                      category.totalIncome - category.totalExpense                 
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteModal.show && (
        <div className="modal-container">
          <div className="modal-content w-full mx-4 md:w-[400px] md:mx-auto">
            <h2 className="text-2xl font-bold mb-4">{t('categories.deleteCategory')}</h2>
            <p className="mb-4">
              {showDeleteModal.hasTransactions 
                ? t('categories.deleteWarning')
                : t('categories.deleteConfirm')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setShowDeleteModal({ show: false, categoryId: "", hasTransactions: false })
                }
                className="px-4 py-2 border border-border rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-container">
          <div className="modal-content w-full mx-4 md:w-[600px] md:mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{t('categories.addCategory')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">{t('categories.name')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, name: e.target.value });
                      if (errors.name) {
                        setErrors({ name: '', budget: '' });
                      }
                    }}
                    className={`w-full p-2 pr-16 rounded-lg border ${
                      errors.name ? 'border-red-500' : 'border-border'
                    } bg-background`}
                    placeholder={t('categories.namePlaceholder')}
                    maxLength={64}
                  />
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm ${
                    newCategory.name.length >= 55 ? 'text-yellow-500' : 'text-gray-400'
                  }`}>
                    {newCategory.name.length}/64
                  </span>
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
                {newCategory.name.length >= 64 && (
                  <p className="text-yellow-500 text-sm mt-1">
                    ⚠️ {t('categories.maxLimitReached')}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2">{t('categories.icon')}</label>
                <select
                  value={newCategory.icon}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, icon: e.target.value })
                  }
                  className="select-field"
                >
                  <option value="📦">{t('categories.icons.box')}</option>
                  <option value="🛍️">{t('categories.icons.shopping')}</option>
                  <option value="🍽️">{t('categories.icons.food')}</option>
                  <option value="🚗">{t('categories.icons.transport')}</option>
                  <option value="🎮">{t('categories.icons.entertainment')}</option>
                  <option value="📃">{t('categories.icons.bills')}</option>
                  <option value="🏥">{t('categories.icons.healthcare')}</option>
                  <option value="📚">{t('categories.icons.education')}</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">{t('categories.budgetOptional')}</label>
                <input
                  type="number"
                  value={newCategory.budget || ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setNewCategory({
                      ...newCategory,
                      budget: value,
                    });
                    if (errors.budget) {
                      setErrors({ ...errors, budget: '' });
                    }
                  }}
                  className={`input-field ${errors.budget ? 'border-red-500' : ''}`}
                  placeholder={t('categories.budgetPlaceholder')}
                  min="0"
                  max="100000000000"
                />
                {errors.budget && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategory({ name: "", icon: "📦", budget: null });
                  }}
                  className="button-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="button-primary">
                  {t('categories.addCategory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-container">
          <div className="modal-content w-full mx-4 md:w-[600px] md:mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{t('categories.editCategory')}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">{t('categories.name')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingCategory?.name || ''}
                    onChange={(e) => {
                      setEditingCategory(prev => 
                        prev ? { ...prev, name: e.target.value } : null
                      );
                      if (errors.name) {
                        setErrors({ name: '', budget: '' });
                      }
                    }}
                    className={`w-full p-2 pr-16 rounded-lg border ${
                      errors.name ? 'border-red-500' : 'border-border'
                    } bg-background`}
                    placeholder={t('categories.namePlaceholder')}
                    maxLength={64}
                  />
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm ${
                    (editingCategory?.name.length || 0) >= 55 ? 'text-yellow-500' : 'text-gray-400'
                  }`}>
                    {editingCategory?.name.length || 0}/64
                  </span>
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
                {(editingCategory?.name.length || 0) >= 64 && (
                  <p className="text-yellow-500 text-sm mt-1">
                    ⚠️ {t('categories.maxLimitReached')}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2">{t('categories.icon')}</label>
                <select
                  value={editingCategory?.icon}
                  onChange={(e) =>
                    setEditingCategory((prev) =>
                      prev ? { ...prev, icon: e.target.value } : null
                    )
                  }
                  className="input-field"
                >
                  <option value="📦">{t('categories.icons.box')}</option>
                  <option value="🛍️">{t('categories.icons.shopping')}</option>
                  <option value="🍽️">{t('categories.icons.food')}</option>
                  <option value="🚗">{t('categories.icons.transport')}</option>
                  <option value="🎮">{t('categories.icons.entertainment')}</option>
                  <option value="📃">{t('categories.icons.bills')}</option>
                  <option value="🏥">{t('categories.icons.healthcare')}</option>
                  <option value="📚">{t('categories.icons.education')}</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">{t('categories.budgetOptional')}</label>
                <input
                  type="number"
                  value={editingCategory?.budget || ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setEditingCategory(prev =>
                      prev ? { ...prev, budget: value } : null
                    );
                    if (errors.budget) {
                      setErrors({ ...errors, budget: '' });
                    }
                  }}
                  className={`input-field ${errors.budget ? 'border-red-500' : ''}`}
                  placeholder={t('categories.budgetPlaceholder')}
                  min="0"
                  max="100000000000"
                />
                {errors.budget && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="button-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="button-primary">
                  {t('common.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="modal-container">
          <div className="modal-content w-full mx-4 md:w-[400px] md:mx-auto">
            <h2 className="text-2xl font-bold mb-4">{t('categories.deleteAllTitle')}</h2>
            <p className="mb-4">{t('categories.deleteAllConfirm')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="button-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  categories.forEach(category => {
                    deleteCategory(category.id, true, (categoryId) => {
                      deleteTransactionsByCategory(categoryId);
                    });
                  });
                  setShowDeleteAllModal(false);
                }}
                className="button-danger"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
