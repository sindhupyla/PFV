function getThemeColors(theme: 'light' | 'dark'): string[] {
  const colors = {
    light: [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#6366f1', // indigo
      '#14b8a6', // teal
      '#d946ef', // fuchsia
      '#0ea5e9', // sky
      '#eab308', // yellow
    ],
    dark: [
      '#1d4ed8', // darker blue
      '#047857', // darker emerald
      '#b45309', // darker amber
      '#b91c1c', // darker red
      '#6d28d9', // darker violet
      '#be185d', // darker pink
      '#0e7490', // darker cyan
      '#4d7c0f', // darker lime
      '#c2410c', // darker orange
      '#4338ca', // darker indigo
      '#0f766e', // darker teal
      '#a21caf', // darker fuchsia
      '#0369a1', // darker sky
      '#a16207', // darker yellow
    ]
  };

  return colors[theme];
}

export function generateColors(count: number, theme: 'light' | 'dark'): string[] {
  const baseColors = getThemeColors(theme);
  
  // If we need fewer colors than available, return a subset
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // If we need more colors, repeat the palette
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(baseColors[i % baseColors.length]);
  }
  return result;
}

export function generateBarColors(theme: 'light' | 'dark') {
  return {
    income: theme === 'light' ? '#10b981' : '#047857', // emerald
    expense: theme === 'light' ? '#ef4444' : '#b91c1c'  // red
  };
}