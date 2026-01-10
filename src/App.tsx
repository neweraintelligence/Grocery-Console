import React, { useState, useEffect } from 'react';
import { WeeksListBox } from './components/WeeksListBox';

// Smart quantity formatting utility
const formatQuantity = (quantity: number): string => {
  if (quantity === 0) return '0';
  if (quantity >= 1) {
    // For whole numbers or numbers >= 1, show decimal if needed
    return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2).replace(/\.?0+$/, '');
  }
  
  // For fractional quantities, try to convert to common fractions
  const fractionMap: { [key: number]: string } = {
    0.125: '⅛',
    0.16666666666666666: '⅙', // 1/6
    0.1667: '⅙',
    0.17: '⅙',
    0.2: '⅕',
    0.25: '¼',
    0.3333: '⅓',
    0.33333333333333333: '⅓', // 1/3
    0.33: '⅓',
    0.375: '⅜',
    0.4: '⅖',
    0.5: '½',
    0.6: '⅗',
    0.625: '⅝',
    0.66666666666666666: '⅔', // 2/3
    0.6667: '⅔',
    0.67: '⅔',
    0.75: '¾',
    0.8: '⅘',
    0.875: '⅞',
  };
  
  // Check for exact matches first
  if (fractionMap[quantity]) {
    return fractionMap[quantity];
  }
  
  // Check for close matches (within 0.01 tolerance)
  for (const [decimal, fraction] of Object.entries(fractionMap)) {
    if (Math.abs(quantity - parseFloat(decimal)) < 0.01) {
      return fraction;
    }
  }
  
  // If no fraction match, show decimal with appropriate precision
  if (quantity < 0.01) {
    return quantity.toFixed(3).replace(/\.?0+$/, '');
  } else {
    return quantity.toFixed(2).replace(/\.?0+$/, '');
  }
};

// Enhanced display for stock ratios with special styling for fractions
const formatStockDisplay = (current: number, min: number, unit: string = ''): string => {
  const currentFormatted = formatQuantity(current);
  const minFormatted = formatQuantity(min);
  const unitStr = unit ? ` ${unit}` : '';
  
  return `${currentFormatted}/${minFormatted}${unitStr}`;
};

// Component for displaying quantities with special fraction styling
const QuantityDisplay = ({ quantity, className = '', style = {} }: { 
  quantity: number; 
  className?: string; 
  style?: React.CSSProperties;
}) => {
  const formatted = formatQuantity(quantity);
  const isFraction = formatted.match(/[⅛⅙⅕¼⅓⅜⅖½⅗⅝⅔¾⅘⅞]/);
  
  return (
    <span 
      className={className}
      style={{
        ...style,
        fontSize: isFraction ? '1.25rem' : style.fontSize,
        fontWeight: '800',
        color: isFraction ? '#fbbf24' : style.color || 'white',
        textShadow: isFraction ? '0 0 12px rgba(251, 191, 36, 0.3)' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {formatted}
    </span>
  );
};

// TypeScript interfaces for proper typing
interface PantryItem {
  id: string;
  name: string;
  category: string;
  currentCount: number;
  minCount: number;
  unit: string;
  lastUpdated: string;
  notes?: string;
  expiryDate?: string;
}

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  addedDate: string;
  completed: boolean;
}

interface ShoppingListItem {
  id: string;
  name: string;
  source: 'pantry' | 'grocery' | 'new';
  currentCount?: number;
  minCount?: number;
  needed?: number;
  quantity: number;
  category?: string;
  unit: string; // Now contains UOM from Notes column
  priority?: 'High' | 'Medium' | 'Low';
  notes?: string;
  expiryDate?: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  cuisine: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'dessert';
  availableIngredients: string[];
  missingIngredients: string[];
}

// (removed unused RecipeTemplate interface)

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url("/kitchen scene 1.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative' as const,
    overflow: 'auto',
    scrollBehavior: 'smooth' as const,
  },
  backgroundOrbs: {
    position: 'absolute' as const,
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  orb1: {
    position: 'absolute' as const,
    top: '-10rem',
    right: '-10rem',
    width: '35rem',
    height: '35rem',
    background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
    borderRadius: '50%',
    filter: 'blur(5rem)',
    animation: 'pulse 6s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute' as const,
    bottom: '-10rem',
    left: '-10rem',
    width: '35rem',
    height: '35rem',
    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
    borderRadius: '50%',
    filter: 'blur(5rem)',
    animation: 'pulse 6s ease-in-out infinite 2s',
  },
  header: {
    position: 'sticky' as const,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    top: 0,
    zIndex: 50,
  },
  headerContent: {
    maxWidth: '85rem',
    margin: '0 auto',
    padding: '1.25rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  logoIcon: {
    width: '4.5rem',
    height: '4.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.75rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    background: 'linear-gradient(to right, #ffffff, #fef3c7, #fee2e2)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    fontFamily: "'Fredoka', system-ui, sans-serif",
    margin: '0',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0',
    marginTop: '0.25rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
  },
  quickAddBtn: {
    padding: '0.625rem 1.25rem',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
    transition: 'all 0.3s ease',
  },
  spreadsheetBtn: {
    padding: '0.625rem 1.25rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
  },
  weeksListBtn: {
    padding: '0.625rem 1.25rem',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.125rem',
  },
  btnIcon: {
    fontSize: '0.875rem',
  },
  btnText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.025em',
  },
  main: {
    position: 'relative' as const,
    maxWidth: '85rem',
    margin: '0 auto',
    padding: '2rem',
    zIndex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2.5rem',
  },
  gridLarge: {
    '@media (min-width: 1280px)': {
      gridTemplateColumns: '1fr 380px',
    },
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(24px)',
    borderRadius: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2.5rem',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  cardIcon: {
    width: '4.5rem',
    height: '4.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  cardIconHover: {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  cardTitleText: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: 'white',
    fontFamily: "'Fredoka', system-ui, sans-serif",
    margin: 0,
    letterSpacing: '-0.01em',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.9375rem',
    margin: 0,
    marginTop: '0.25rem',
    fontWeight: '500',
  },
  addBtn: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    borderRadius: '0.875rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pantryBtn: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    borderRadius: '0.875rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  inventoryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '0.25rem',
  },
  inventoryItem: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    borderRadius: '1.25rem',
    padding: '1.25rem 1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderLeft: '4px solid rgba(16, 185, 129, 0.5)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative' as const,
    overflow: 'visible',
  },
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    flex: 1,
    minWidth: 0,
  },
  itemIcon: {
    width: '3.25rem',
    height: '3.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.375rem',
    minWidth: 0,
  },
  itemName: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontSize: '1.0625rem',
    margin: 0,
    lineHeight: '1.25',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemCategory: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.8125rem',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontWeight: '500',
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexShrink: 0,
  },
  itemRightMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '0.75rem',
  },
  mobileButton: {
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.125rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  stockInfo: {
    textAlign: 'center' as const,
  },
  stockLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
    marginBottom: '0.25rem',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  stockValue: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
    fontSize: '1.25rem',
    letterSpacing: '0.02em',
  },
  stockUnit: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginLeft: '0.25rem',
  },
  statusBadge: {
    padding: '0.5rem 0.875rem',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    fontWeight: '700',
    minWidth: '70px',
    textAlign: 'center' as const,
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statusLow: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  statusOut: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  statusGood: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  sidebarCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.75rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '1.75rem',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.75rem',
  },
  sidebarIcon: {
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sidebarTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: '1.25rem',
    fontFamily: "'Fredoka', system-ui, sans-serif",
    margin: 0,
  },
  sidebarSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  filterContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  filterButton: {
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.8125rem',
    fontWeight: '600',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    cursor: 'pointer',
  },
  filterActive: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'white',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  filterInactive: {
    background: 'transparent',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.04)',
    },
  },
  quickStatsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(32px)',
    borderRadius: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '2.5rem',
    marginBottom: '2.5rem',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.5rem',
  },
  quickStatCard: {
    textAlign: 'center' as const,
    padding: '1.75rem 1.25rem',
    borderRadius: '1.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  },
  quickStatCardHover: {
    transform: 'translateY(-6px)',
    background: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  },
  quickStatValue: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'white',
    margin: '0.25rem 0',
    fontFamily: "'Fredoka', system-ui, sans-serif",
    letterSpacing: '-0.02em',
  },
  quickStatLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '1.25rem',
    padding: '0.375rem',
    marginBottom: '2.5rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  tab: {
    flex: 1,
    padding: '0.875rem 1.5rem',
    borderRadius: '1rem',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.9375rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Fredoka', system-ui, sans-serif",
  },
  tabShopping: {
    '&:hover': { color: '#fb923c' },
  },
  tabShoppingActive: {
    background: 'rgba(251, 146, 60, 0.15)',
    color: '#fb923c',
    boxShadow: '0 4px 12px rgba(251, 146, 60, 0.2)',
  },
  tabPantry: {
    '&:hover': { color: '#10b981' },
  },
  tabPantryActive: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
  },
  tabRecipes: {
    '&:hover': { color: '#a855f7' },
  },
  tabRecipesActive: {
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#a855f7',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)',
  },
  // Bulk Add Modal Styles
  bulkTextarea: {
    width: '100%',
    padding: '1rem',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    color: 'white',
    fontSize: '0.9375rem',
    fontFamily: 'monospace',
    resize: 'vertical' as const,
    minHeight: '180px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  bulkLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9375rem',
    marginBottom: '0.75rem',
    display: 'block',
    fontWeight: '600',
  },
  bulkHelp: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '1rem',
    borderRadius: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '0.8125rem',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: '1.5',
  },
  bulkButton: {
    flex: '1',
    padding: '0.875rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
  },
  // Item source badges
  itemBadge: {
    padding: '0.25rem 0.625rem',
    borderRadius: '0.5rem',
    fontSize: '0.6875rem',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  itemBadgeSource: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.2)',
  },
  itemBadgeManual: {
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
  quantityDisplay: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.875rem',
    fontSize: '0.9375rem',
    fontWeight: '700',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: '4.5rem',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
};

// Lightweight SVG spinner that doesn't require external CSS
const Spinner: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 16,
  color = '#ffffff',
  style = {}
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6, ...style }}
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeOpacity="0.2"
    />
    <path
      fill="none"
      stroke={color}
      strokeWidth="5"
      d="M25 5 a20 20 0 0 1 0 40"
      strokeLinecap="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 25 25"
        to="360 25 25"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

// PantryAnalytics Component
const PantryAnalytics = ({ pantryItems }: { pantryItems: PantryItem[] }) => {
  const [sortBy, setSortBy] = useState<'stock' | 'category' | 'ratio'>('stock');
  const [showHighest, setShowHighest] = useState(true);

  // Process data for visualization
  const getAnalyticsData = () => {
    if (pantryItems.length === 0) return { highest: [], lowest: [], categories: [] };

    let processedItems = pantryItems.map(item => ({
      ...item,
      ratio: item.minCount > 0 ? item.currentCount / item.minCount : item.currentCount
    }));

    // Sort based on selected criteria
    if (sortBy === 'stock') {
      processedItems.sort((a, b) => b.currentCount - a.currentCount);
    } else if (sortBy === 'ratio') {
      processedItems.sort((a, b) => b.ratio - a.ratio);
    } else if (sortBy === 'category') {
      processedItems.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    }

    const highest = processedItems.slice(0, 5);
    const lowest = [...processedItems].reverse().slice(0, 5);

    // Category analysis
    const categoryData = pantryItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, totalStock: 0, items: [] };
      }
      acc[category].count++;
      acc[category].totalStock += item.currentCount;
      acc[category].items.push(item);
      return acc;
    }, {} as Record<string, { count: number; totalStock: number; items: PantryItem[] }>);

    const categories = Object.entries(categoryData).map(([name, data]) => ({
      name,
      ...data
    }));

    return { highest, lowest, categories };
  };

  const { highest, lowest, categories } = getAnalyticsData();

  // When sorting by category, aggregate by category item count for the bar view
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => b.count - a.count);
  }, [categories]);

  const dataToShow: any[] = sortBy === 'category'
    ? (showHighest ? sortedCategories.slice(0, 5) : [...sortedCategories].reverse().slice(0, 5))
    : (showHighest ? highest : lowest);

  const getMaxValue = () => {
    if (sortBy === 'stock') {
      return Math.max(...pantryItems.map(item => item.currentCount));
    } else if (sortBy === 'ratio') {
      return Math.max(...pantryItems.map(item => item.minCount > 0 ? item.currentCount / item.minCount : item.currentCount));
    } else if (sortBy === 'category') {
      return Math.max(...categories.map(c => c.count));
    }
    return 10;
  };

  const maxValue = getMaxValue();

  const getValue = (item: any) => {
    if (sortBy === 'stock') return item.currentCount;
    if (sortBy === 'ratio') return item.minCount > 0 ? item.currentCount / item.minCount : item.currentCount;
    if (sortBy === 'category') return item.count || 0;
    return item.currentCount;
  };

  const getValueLabel = (item: any) => {
    if (sortBy === 'stock') return `${formatQuantity(item.currentCount)} ${item.unit}`;
    if (sortBy === 'ratio') return `${(getValue(item)).toFixed(1)}x`;
    if (sortBy === 'category') return `${item.count} items`;
    return `${formatQuantity(item.currentCount)} ${item.unit}`;
  };

  if (pantryItems.length === 0) {
    return (
      <div style={{
        padding: '3rem 2rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1.5rem',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h3 style={{ color: 'white', marginBottom: '0.5rem', fontWeight: '700', fontFamily: "'Fredoka', system-ui, sans-serif" }}>Pantry Analytics</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9375rem' }}>Add items to see your pantry insights!</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      height: '100%'
    }}>
      {/* Controls */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ 
          color: 'white', 
          marginBottom: '1.25rem', 
          fontSize: '1.125rem', 
          fontWeight: '700',
          fontFamily: "'Fredoka', system-ui, sans-serif" 
        }}>📊 Pantry Insights</h3>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'stock' | 'category' | 'ratio')}
            style={{
              padding: '0.625rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.6)',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="stock" style={{ background: '#1e293b' }}>Sort by Stock Count</option>
            <option value="ratio" style={{ background: '#1e293b' }}>Sort by Stock Ratio</option>
            <option value="category" style={{ background: '#1e293b' }}>Sort by Category</option>
          </select>
          
          <button
            onClick={() => setShowHighest(!showHighest)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <span>{showHighest ? '📈' : '📉'}</span>
            {showHighest ? 'Show Highest' : 'Show Lowest'}
          </button>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '1.5rem',
        padding: '1.75rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
        flex: 1
      }}>
        <h4 style={{ 
          color: 'white', 
          margin: '0 0 1.5rem 0', 
          fontSize: '1rem',
          fontWeight: '700',
          fontFamily: "'Fredoka', system-ui, sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.8
        }}>
          {showHighest ? '✨ Top 5' : '🚨 Bottom 5'} {sortBy === 'category' ? 'Categories' : 'Items'}
          <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: '600', marginLeft: '0.75rem' }}>
            {sortBy === 'ratio' ? '(by ratio)' : sortBy === 'stock' ? '(by count)' : ''}
          </span>
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {dataToShow.map((item: any, index: number) => {
            const value = getValue(item);
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={item.id || index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ 
                  width: '100px', 
                  fontSize: '0.8125rem', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  fontWeight: '600'
                }}>
                  {item.name}
                </div>
                <div style={{ 
                  flex: 1, 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: '9999px',
                  height: '10px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: sortBy === 'category'
                      ? 'linear-gradient(to right, #6366f1, #a855f7)'
                      : value < (item.minCount || 1)
                        ? 'linear-gradient(to right, #f87171, #ef4444)'
                        : 'linear-gradient(to right, #34d399, #10b981)',
                    height: '100%',
                    width: `${Math.max(5, percentage)}%`,
                    borderRadius: '9999px',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 12px rgba(0, 0, 0, 0.2)'
                  }} />
                </div>
                <div style={{ 
                  width: '60px', 
                  fontSize: '0.8125rem', 
                  color: 'white',
                  textAlign: 'right',
                  fontWeight: '700',
                  fontFamily: 'monospace'
                }}>
                  {getValueLabel(item)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Summary */}
      {sortBy === 'category' && categories.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.75rem',
          marginTop: '1.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <h4 style={{ 
            color: 'white', 
            marginBottom: '1.25rem', 
            fontSize: '1rem',
            fontWeight: '700',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.8
          }}>📂 Category Breakdown</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {categories.slice(0, 4).map((category, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1.25rem 1rem',
                borderRadius: '1.25rem',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {category.name}
                </div>
                <div style={{ fontSize: '1.25rem', color: 'white', fontWeight: '800', fontFamily: 'monospace' }}>
                  {category.count} <span style={{ fontSize: '0.8125rem', fontWeight: '500', opacity: 0.5 }}>items</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for category group checkbox with indeterminate state support
const CategoryGroupCheckbox = ({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={checked}
      onChange={onChange}
      style={{ width: 16, height: 16, accentColor: '#10b981', cursor: 'pointer' }}
    />
  );
};

function App() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [modalType, setModalType] = useState<'loot' | 'pantry'>('loot');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [, setGroceryItems] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shopping' | 'pantry'>('shopping');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hoveredTab, setHoveredTab] = useState<'shopping' | 'pantry' | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPantryReviewModal, setShowPantryReviewModal] = useState(false);
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  const [reviewItems, setReviewItems] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [dietaryPreferences, setDietaryPreferences] = useState<any>({
    restrictions: [],
    allergies: [],
    dislikes: [],
    preferences: [],
    calorieGoal: 2000,
    servingSize: 2
  });
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [priceComparison, setPriceComparison] = useState<any>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [weeklyDeals, setWeeklyDeals] = useState<any[]>([]);
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<string>('');
  const [pantryCategoryFilter, setPantryCategoryFilter] = useState<string[]>(['all']);
  const [pantrySortBy, setPantrySortBy] = useState<'name' | 'status-critical' | 'status-good' | 'category'>('name');
  const [showWeeksListBox, setShowWeeksListBox] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [pantryBulkMode, setPantryBulkMode] = useState(false);
  const [pantryBulkText, setPantryBulkText] = useState('');

  // Normalize meal plan responses from the API/LLM to a consistent shape
  const normalizeMealPlanResponse = (raw: any) => {
    if (!raw) return null;

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const normalizeDay = (input: any): string => {
      if (!input && input !== 0) return '';
      const str = String(input).trim();
      // Numeric day handling: 1..7 => Mon..Sun, 0..6 => Sun..Sat
      const num = Number(str);
      if (!Number.isNaN(num)) {
        if (num >= 1 && num <= 7) return dayNames[num - 1];
        if (num >= 0 && num <= 6) return dayNames[(num + 6) % 7];
      }
      const lower = str.toLowerCase();
      const idx = dayNames.findIndex(d => d.toLowerCase().startsWith(lower.slice(0, 3)));
      return idx >= 0 ? dayNames[idx] : str;
    };

    const rawMeals = Array.isArray(raw.meals)
      ? raw.meals
      : Array.isArray(raw.mealPlan)
        ? raw.mealPlan
        : Array.isArray(raw.plan)
          ? raw.plan
          : [];

    const meals = rawMeals.map((m: any) => {
      const mealTypeRaw = (m?.mealType || m?.meal_type || m?.type || '').toString().toLowerCase();
      const mealType = ['breakfast', 'lunch', 'dinner'].includes(mealTypeRaw)
        ? mealTypeRaw
        : mealTypeRaw.includes('break')
          ? 'breakfast'
          : mealTypeRaw.includes('lunch')
            ? 'lunch'
            : 'dinner';

      return {
        day: normalizeDay(m?.day ?? m?.Day ?? m?.date ?? ''),
        mealType,
        recipeName: m?.recipeName || m?.title || m?.name || 'Untitled',
        ingredients: m?.ingredients || m?.ingredientList || [],
        instructions: m?.instructions || m?.steps || [],
        servings: Number(m?.servings || m?.serves || 2),
        cookTime: m?.cookTime || m?.time || '20 minutes',
        difficulty: m?.difficulty || 'Easy',
        availableIngredients: m?.availableIngredients || m?.ingredientsUsed || m?.available || [],
        missingIngredients: m?.missingIngredients || m?.missing || m?.ingredientsMissing || [],
        nutritionInfo: m?.nutritionInfo || m?.nutrition || null
      };
    });

    const shoppingList = Array.isArray(raw.shoppingList) && raw.shoppingList.length > 0
      ? raw.shoppingList
      : Array.from(new Set(meals.flatMap((m: any) => Array.isArray(m.missingIngredients) ? m.missingIngredients : [])));

    return {
      id: raw.id || `plan-${Date.now()}`,
      weekOf: raw.weekOf || raw.week_of || raw.startDate || raw.start_date || new Date().toISOString().split('T')[0],
      createdDate: raw.createdDate || new Date().toISOString(),
      dietaryPreferences: raw.dietaryPreferences || raw.preferences || [],
      meals,
      shoppingList,
      totalEstimatedCost: raw.totalEstimatedCost || Math.round(shoppingList.length * 3.5)
    };
  };

  // AI categorization function
  const categorizeItem = (itemName: string): string => {
    const name = itemName.toLowerCase();
    
    // Fresh produce
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('grape') || name.includes('berry') || name.includes('fruit') ||
        name.includes('lettuce') || name.includes('spinach') || name.includes('carrot') ||
        name.includes('tomato') || name.includes('cucumber') || name.includes('pepper') ||
        name.includes('onion') || name.includes('potato') || name.includes('broccoli') ||
        name.includes('celery') || name.includes('avocado') || name.includes('lime') ||
        name.includes('lemon') || name.includes('garlic') || name.includes('ginger')) {
      return 'Fresh Produce';
    }
    
    // Dairy & Eggs
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') ||
        name.includes('butter') || name.includes('cream') || name.includes('egg') ||
        name.includes('dairy')) {
      return 'Dairy & Eggs';
    }
    
    // Meat & Seafood
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
        name.includes('fish') || name.includes('salmon') || name.includes('tuna') ||
        name.includes('shrimp') || name.includes('meat') || name.includes('turkey') ||
        name.includes('bacon')) {
      return 'Meat & Seafood';
    }
    
    // Pantry Staples
    if (name.includes('rice') || name.includes('pasta') || name.includes('flour') ||
        name.includes('sugar') || name.includes('salt') || name.includes('oil') ||
        name.includes('vinegar') || name.includes('sauce') || name.includes('spice') ||
        name.includes('herb') || name.includes('can') || name.includes('jar')) {
      return 'Pantry Staples';
    }
    
    // Bakery
    if (name.includes('bread') || name.includes('bagel') || name.includes('muffin') ||
        name.includes('croissant') || name.includes('cake') || name.includes('cookie')) {
      return 'Bakery';
    }
    
    // Beverages
    if (name.includes('juice') || name.includes('soda') || name.includes('water') ||
        name.includes('coffee') || name.includes('tea') || name.includes('beer') ||
        name.includes('wine') || name.includes('drink')) {
      return 'Beverages';
    }
    
    // Frozen Foods
    if (name.includes('frozen') || name.includes('ice cream') || name.includes('popsicle')) {
      return 'Frozen Foods';
    }
    
    // Snacks
    if (name.includes('chip') || name.includes('cracker') || name.includes('nut') ||
        name.includes('candy') || name.includes('chocolate') || name.includes('popcorn')) {
      return 'Snacks';
    }
    
    // Default category
    return 'Other';
  };

  // Parse bulk text into individual items
  const parseBulkText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const items = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Try to parse different formats:
      // Format 1: "quantity unit item" (e.g., "2 lbs apples")
      // Format 2: "item, quantity unit" (e.g., "apples, 2 lbs")
      // Format 3: "item - quantity unit" (e.g., "apples - 2 lbs")
      // Format 4: Just "item" (defaults to 1 piece)
      
      let name = '', quantity = 1, unit = 'pieces';
      
      // Try format: "2 lbs apples" or "2 apples"
      const match1 = trimmedLine.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+)$/);
      if (match1) {
        quantity = parseFloat(match1[1]);
        unit = match1[2] || 'pieces';
        name = match1[3];
      }
      // Try format: "apples, 2 lbs" or "apples - 2 lbs"
      else {
        const match2 = trimmedLine.match(/^(.+?)[,\-]\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
        if (match2) {
          name = match2[1].trim();
          quantity = parseFloat(match2[2]);
          unit = match2[3] || 'pieces';
        }
        // Default: just the item name
        else {
          name = trimmedLine;
        }
      }
      
      // Clean up unit
      if (!unit || unit === '') unit = 'pieces';
      
      // Categorize the item
      const category = categorizeItem(name);
      
      items.push({
        name: name.trim(),
        category,
        quantity,
        unit: unit.trim(),
        priority: 'Medium' as 'High' | 'Medium' | 'Low',
        notes: ''
      });
    }
    
    return items;
  };

  // Handle bulk submission
  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    
    const items = parseBulkText(bulkText);
    let successCount = 0;
    
    try {
      for (const item of items) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groceries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...item, addedDate: new Date().toISOString(), completed: false}),
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        setShowAddModal(false);
        setBulkText('');
        setBulkMode(false);
        fetchShoppingList();
        
        // Show success message (you can add a toast notification here)
        console.log(`Successfully added ${successCount} items to shopping list`);
      }
    } catch (error) {
      console.error('Error adding bulk items:', error);
    }
  };

  // Parse bulk text for pantry items (different structure)
  const parseBulkPantryText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const items = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Try to parse different formats:
      // Format 1: "item name, current amount, min needed" (e.g., "Rice, 5 cups, 2 cups")
      // Format 2: "current amount item name, min needed" (e.g., "5 cups rice, 2 cups")
      // Format 3: "item name - current amount" (e.g., "Rice - 5 cups")
      // Format 4: Just "item name" (defaults to 1 current, 1 min)
      
      let name = '', currentCount: number = 1, minCount: number = 1, unit = 'pieces';
      
      // Try format: "item, current, min" (e.g., "Rice, 5 cups, 2 cups")
      const commaMatch = trimmedLine.match(/^(.+?),\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]*),?\s*(\d+(?:\.\d+)?)?\s*([a-zA-Z]*)?$/);
      if (commaMatch) {
        name = commaMatch[1].trim();
        currentCount = parseFloat(commaMatch[2]);
        unit = commaMatch[3] || 'pieces';
        minCount = commaMatch[4] ? parseFloat(commaMatch[4]) : 1;
      }
      // Try format: "current amount item, min amount" (e.g., "5 cups rice, 2 cups")
      else {
        const complexMatch = trimmedLine.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+?),\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]*)?$/);
        if (complexMatch) {
          currentCount = parseFloat(complexMatch[1]);
          unit = complexMatch[2] || 'pieces';
          name = complexMatch[3].trim();
          minCount = parseFloat(complexMatch[4]);
        }
        // Try format: "item - amount" (e.g., "Rice - 5 cups")
        else {
          const dashMatch = trimmedLine.match(/^(.+?)\s*-\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
          if (dashMatch) {
            name = dashMatch[1].trim();
            currentCount = parseFloat(dashMatch[2]);
            unit = dashMatch[3] || 'pieces';
            minCount = Math.max(0.25, Number((currentCount * 0.3).toFixed(2))); // Allow fractions
          }
          // Default: just the item name
          else {
            name = trimmedLine;
          }
        }
      }
      
      // Clean up unit
      if (!unit || unit === '') unit = 'pieces';
      
      // Categorize the item
      const category = categorizeItem(name);
      
      items.push({
        name: name.trim(),
        category,
        currentCount,
        minCount,
        unit: unit.trim(),
        notes: '',
        expiryDate: ''
      });
    }
    
    return items;
  };

  // Handle bulk pantry submission
  const handleBulkPantrySubmit = async () => {
    if (!pantryBulkText.trim()) return;
    
    const items = parseBulkPantryText(pantryBulkText);
    let successCount = 0;
    
    try {
      for (const item of items) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
        
        if (response.ok) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        setShowAddModal(false);
        setPantryBulkText('');
        setPantryBulkMode(false);
        fetchPantryItems();
        
        // Show success message
        console.log(`Successfully added ${successCount} items to pantry`);
      }
    } catch (error) {
      console.error('Error adding bulk pantry items:', error);
    }
  };

  // Get category-specific emoji icon
  const getCategoryEmoji = (category: string): string => {
    const cat = category.toLowerCase();
    
    // Fresh Produce
    if (cat.includes('fresh') || cat.includes('produce')) return '🥬';
    if (cat.includes('fruit')) return '🍎';
    if (cat.includes('vegetable')) return '🥕';
    
    // Dairy & Eggs
    if (cat.includes('dairy')) return '🥛';
    if (cat.includes('egg')) return '🥚';
    if (cat.includes('milk')) return '🥛';
    if (cat.includes('cheese')) return '🧀';
    if (cat.includes('yogurt')) return '🍦';
    if (cat.includes('butter')) return '🧈';
    
    // Meat & Seafood
    if (cat.includes('meat')) return '🍖';
    if (cat.includes('seafood') || cat.includes('fish')) return '🐟';
    if (cat.includes('chicken') || cat.includes('poultry')) return '🍗';
    if (cat.includes('beef')) return '🥩';
    if (cat.includes('pork')) return '🥓';
    
    // Pantry Staples & Grains
    if (cat.includes('pantry') || cat.includes('staple')) return '🌾';
    if (cat.includes('grain') || cat.includes('rice') || cat.includes('quinoa') || cat.includes('oats')) return '🌾';
    if (cat.includes('pasta') || cat.includes('spaghetti') || cat.includes('fusilli') || cat.includes('noodle')) return '🍝';
    if (cat.includes('flour') || cat.includes('baking')) return '🥖';
    if (cat.includes('oil') || cat.includes('vinegar')) return '🫒';
    if (cat.includes('spice') || cat.includes('herb') || cat.includes('seasoning')) return '🌿';
    if (cat.includes('sauce') || cat.includes('condiment')) return '🍯';
    if (cat.includes('can') || cat.includes('jar')) return '🥫';
    
    // Bakery
    if (cat.includes('bakery') || cat.includes('bread')) return '🍞';
    if (cat.includes('bagel')) return '🥯';
    if (cat.includes('muffin') || cat.includes('pastry')) return '🧁';
    if (cat.includes('cake')) return '🎂';
    if (cat.includes('cookie')) return '🍪';
    
    // Beverages
    if (cat.includes('beverage') || cat.includes('drink')) return '🥤';
    if (cat.includes('juice')) return '🧃';
    if (cat.includes('soda') || cat.includes('soft drink')) return '🥤';
    if (cat.includes('water')) return '💧';
    if (cat.includes('coffee')) return '☕';
    if (cat.includes('tea')) return '🍵';
    if (cat.includes('beer')) return '🍺';
    if (cat.includes('wine')) return '🍷';
    
    // Frozen Foods
    if (cat.includes('frozen')) return '🧊';
    if (cat.includes('ice cream')) return '🍨';
    if (cat.includes('popsicle')) return '🍭';
    
    // Snacks
    if (cat.includes('snack')) return '🍿';
    if (cat.includes('chip')) return '🥨';
    if (cat.includes('cracker')) return '🍘';
    if (cat.includes('nut')) return '🥜';
    if (cat.includes('candy') || cat.includes('sweet')) return '🍬';
    if (cat.includes('chocolate')) return '🍫';
    if (cat.includes('popcorn')) return '🍿';
    
    // Health & Personal Care
    if (cat.includes('health') || cat.includes('pharmacy') || cat.includes('medicine')) return '💊';
    if (cat.includes('vitamin')) return '💊';
    if (cat.includes('personal') || cat.includes('hygiene')) return '🧴';
    
    // Household & Cleaning
    if (cat.includes('household') || cat.includes('cleaning')) return '🧽';
    if (cat.includes('detergent') || cat.includes('soap')) return '🧼';
    if (cat.includes('paper') || cat.includes('tissue')) return '🧻';
    
    // Default fallback
    return '🛒';
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPantryItems();
    fetchGroceryItems();
    fetchShoppingList();
    // Auto-scroll to top disabled - let user control their own scrolling
  }, []);

  // Prevent browser from auto-restoring scroll position on load/navigation
  useEffect(() => {
    try {
      const historyObj: any = window.history as any;
      const prev = historyObj.scrollRestoration;
      if (typeof prev !== 'undefined') {
        historyObj.scrollRestoration = 'manual';
        return () => {
          historyObj.scrollRestoration = prev;
        };
      }
    } catch {}
  }, []);

  // Disable auto-popup of Weeks List entirely; enable only via manual click
  useEffect(() => {
    // Intentionally left empty to avoid auto-opening the Weeks List
  }, []);

  // Track window size for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPantryItems = async () => {
    try {
      console.log('🔍 Frontend: Calling pantry endpoint...');
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry?t=${Date.now()}`;
      console.log('🔍 Frontend: API URL:', apiUrl);
      const response = await fetch(apiUrl, { cache: 'no-store' });
      console.log('🔍 Frontend: Pantry response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Frontend: Pantry data received:', data);
        console.log('🔍 Frontend: First item details:', data[0] ? `ID: ${data[0].id}, Name: ${data[0].name}, Count: ${data[0].currentCount}` : 'No items');
        // Debug decimal quantities
        const decimalItems = data.filter((item: any) => item.currentCount !== Math.floor(item.currentCount));
        console.log('🔍 Frontend: Items with decimal quantities:', decimalItems.map((item: any) => `${item.name}: ${item.currentCount}`));
        console.log('🔍 Frontend: All items with current counts:', data.map((item: any) => `${item.name}: ${item.currentCount}`).slice(0, 10));
        setPantryItems(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch pantry items:', response.status);
        setPantryItems([]);
      }
    } catch (error) {
      console.error('Error fetching pantry items:', error);
      setPantryItems([]);
    }
  };

  const fetchGroceryItems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groceries`);
      if (response.ok) {
        const data = await response.json();
        setGroceryItems(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch grocery items:', response.status);
        setGroceryItems([]);
      }
    } catch (error) {
      console.error('Error fetching grocery items:', error);
      setGroceryItems([]);
    }
  };

  const fetchShoppingList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/shopping-list`);
      if (response.ok) {
        const data = await response.json();
        setShoppingList(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch shopping list:', response.status);
        setShoppingList([]);
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error);
      setShoppingList([]);
    }
  };



  const updateItemQuantity = async (itemId: string, newQuantity: number, _isIncrease: boolean) => {
    try {
      console.log('🔄 Updating quantity:', { itemId, newQuantity });
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentCount: newQuantity }),
      });
      
      console.log('🔄 Update response status:', response.status);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('🔄 Pantry update response:', responseText);
        console.log('🔄 Refreshing pantry data...');
        // Refresh data after successful update
        fetchPantryItems();
        fetchShoppingList();
      } else {
        const errorText = await response.text();
        console.error('Failed to update pantry item quantity:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
    }
  };

  const updateItemMinCount = async (itemId: string, newMinCount: number) => {
    try {
      console.log('Updating min count for item:', itemId, 'to:', newMinCount);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minCount: newMinCount }),
      });
      
      if (response.ok) {
        console.log('Successfully updated min count');
        // Refresh data after successful update
        await fetchPantryItems();
        await fetchShoppingList();
        // Force a small delay to ensure UI updates
        setTimeout(() => {
          fetchPantryItems();
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('Failed to update item min count:', response.status, errorText);
        alert(`Failed to update minimum count. Server responded with: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating item min count:', error);
      alert('Error updating minimum count. Please check your connection and try again.');
    }
  };

  // Category groups for a cleaner UI
  const categoryGroups = [
    {
      key: 'pantry',
      name: 'Pantry',
      emoji: '📦',
      sub: [
        'Pantry – Staples',
        'Pantry – Oils, Vinegars & Condiments',
        'Pantry – Cereals',
        'Pantry – Pasta',
        'Pantry – Rice & Grains',
        'Pantry – Baking & Misc. Dry Goods',
        'Snacks',
        'Beverages',
        '💖 CHOCOLATE'
      ]
    },
    {
      key: 'fridge',
      name: 'Fridge',
      emoji: '🧊',
      sub: [
        'Fridge – Dairy & Plant-Based Alternatives',
        'Fridge – Sauces & Condiments',
        'Fridge – Pickled & Preserved',
        'Produce',
        'Meat'
      ]
    },
    {
      key: 'freezer',
      name: 'Freezer',
      emoji: '❄️',
      sub: [
        'Freezer – Fruit',
        'Freezer – Vegetables',
        'Freezer – Meat',
        'Freezer – Leftovers',
        'Freezer – Baked Goods',
        'Freezer – Desserts',
        'Freezer – Harvested Items',
        'Freezer – General'
      ]
    }
  ] as const;

  // Flattened list for filtering logic
  const pantryCategories = ['all', ...categoryGroups.flatMap(g => g.sub)];
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filter and sort pantry items
  const filteredPantryItems = React.useMemo(() => {
    let filtered = pantryCategoryFilter.length === 0
      ? [] // If filter is empty (all unselected), show nothing
      : pantryCategoryFilter.includes('all') 
        ? pantryItems 
        : pantryItems.filter(item => pantryCategoryFilter.includes(item.category));
    
    // Sort the filtered items
    switch (pantrySortBy) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'status-critical':
        return filtered.sort((a, b) => {
          const getStatusPriority = (item: PantryItem) => {
            if (item.currentCount === 0) return 0; // Out (highest priority)
            if (item.currentCount < item.minCount) return 1; // Low
            return 2; // Okay (lowest priority)
          };
          return getStatusPriority(a) - getStatusPriority(b);
        });
      case 'status-good':
        return filtered.sort((a, b) => {
          const getStatusPriority = (item: PantryItem) => {
            if (item.currentCount === 0) return 2; // Out (lowest priority)
            if (item.currentCount < item.minCount) return 1; // Low
            return 0; // Okay (highest priority)
          };
          return getStatusPriority(a) - getStatusPriority(b);
        });
      case 'category':
        return filtered.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return filtered;
    }
  }, [pantryItems, pantryCategoryFilter, pantrySortBy]);

  // Helper function to check if all subcategories in a group are selected
  const areAllSubcategoriesSelected = (group: { sub: readonly string[] }): boolean => {
    if (pantryCategoryFilter.includes('all')) return true;
    return group.sub.every(sub => pantryCategoryFilter.includes(sub));
  };

  // Helper function to check if some (but not all) subcategories in a group are selected
  const areSomeSubcategoriesSelected = (group: { sub: readonly string[] }): boolean => {
    if (pantryCategoryFilter.includes('all')) return false;
    const selectedCount = group.sub.filter(sub => pantryCategoryFilter.includes(sub)).length;
    return selectedCount > 0 && selectedCount < group.sub.length;
  };

  // Handle category filter checkbox changes
  const handleCategoryFilterChange = (category: string) => {
    if (category === 'all') {
      // If "All" is already selected, unselect everything
      if (pantryCategoryFilter.includes('all')) {
        setPantryCategoryFilter([]);
      } else {
        // If "All" is not selected, select all
        setPantryCategoryFilter(['all']);
      }
    } else {
      // Remove 'all' if it was selected
      const newFilters = pantryCategoryFilter.filter(c => c !== 'all');
      
      if (pantryCategoryFilter.includes(category)) {
        // Remove category if already selected
        const updatedFilters = newFilters.filter(c => c !== category);
        // If no categories selected, default to 'all'
        setPantryCategoryFilter(updatedFilters.length > 0 ? updatedFilters : ['all']);
      } else {
        // Add category to selection
        setPantryCategoryFilter([...newFilters, category]);
      }
    }
  };

  // Handle category group toggle (select/deselect all subcategories in a group)
  const handleCategoryGroupToggle = (group: { key: string; sub: readonly string[] }) => {
    const allSelected = areAllSubcategoriesSelected(group);
    
    if (allSelected) {
      // Deselect all subcategories in this group
      const newFilters = pantryCategoryFilter.filter(c => c !== 'all' && !(group.sub as readonly string[]).includes(c));
      setPantryCategoryFilter(newFilters.length > 0 ? newFilters : ['all']);
    } else {
      // Select all subcategories in this group
      const newFilters = pantryCategoryFilter.filter(c => c !== 'all');
      const otherGroups = categoryGroups.filter(g => g.key !== group.key);
      const otherSelected = otherGroups.flatMap(g => g.sub).filter((sub: string) => newFilters.includes(sub));
      setPantryCategoryFilter([...otherSelected, ...group.sub]);
    }
  };

  const generateRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const pantryPayload = pantryItems.map(i => ({
        name: i.name,
        quantity: i.currentCount,
        unit: i.unit,
        category: i.category
      }));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/recipes/gpt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantry: pantryPayload })
      });

      if (!response.ok) {
        console.error('GPT recipe endpoint failed:', response.status);
        setRecipes([]);
      } else {
        const data = await response.json();
        const gptRecipes = (data?.recipes || []).slice(0, 4).map((r: any, idx: number) => ({
          id: `gpt-${Date.now()}-${idx}`,
          title: r.title || 'Untitled',
          description: r.shortDescription || r.description || '',
          cookTime: r.cookTime || '20 minutes',
          servings: r.servings || 2,
          difficulty: 'Easy',
          cuisine: 'Chef',
          mealType: (r.mealType || 'dinner') as any,
          ingredients: r.ingredientsUsed || [],
          instructions: r.steps || [],
          availableIngredients: r.ingredientsUsed || [],
          missingIngredients: r.optionalMissing || []
        }));
        setRecipes(gptRecipes);
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const generateMealPlan = async () => {
    setLoadingMealPlan(true);
    try {
      const pantryPayload = pantryItems.map(i => ({
        name: i.name,
        quantity: i.currentCount,
        unit: i.unit,
        category: i.category
      }));

      const currentDate = new Date();
      const mondayDate = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
      const weekOf = mondayDate.toISOString().split('T')[0];

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/meal-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pantry: pantryPayload, 
          dietaryPreferences,
          weekOf 
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Meal plan endpoint failed:', response.status);
        setMealPlan(null);
      } else {
        const data = await response.json();
        setMealPlan(normalizeMealPlanResponse(data));
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      setMealPlan(null);
    } finally {
      setLoadingMealPlan(false);
    }
  };

  const addMealPlanToShoppingList = async () => {
    if (!mealPlan || !mealPlan.shoppingList) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/meal-plan/add-to-shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: mealPlan.shoppingList })
      });

      if (response.ok) {
        alert(`Added ${mealPlan.shoppingList.length} ingredients to your shopping list!`);
        fetchShoppingList(); // Refresh shopping list
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error);
    }
  };

  const exportMealPlanPDF = async () => {
    if (!mealPlan) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/meal-plan/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealPlan })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meal-plan-${mealPlan.weekOf}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const comparePrices = async () => {
    setLoadingPrices(true);
    try {
      const shoppingItems = shoppingList.map(item => ({
        name: item.name,
        quantity: item.needed || 1,
        unit: item.unit || 'each'
      }));

      if (shoppingItems.length === 0) {
        alert('Add items to your shopping list first!');
        setLoadingPrices(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/price-comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: shoppingItems })
      });

      if (!response.ok) {
        console.error('Price comparison endpoint failed:', response.status);
        setPriceComparison(null);
      } else {
        const data = await response.json();
        setPriceComparison(data);
      }
    } catch (error) {
      console.error('Error comparing prices:', error);
      setPriceComparison(null);
    } finally {
      setLoadingPrices(false);
    }
  };

  const updateItemExpiryDate = async (itemId: string, expiryDate: string) => {
    try {
      console.log('Updating expiry date for item:', itemId, 'to:', expiryDate);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiryDate }),
      });

      if (response.ok) {
        console.log('✅ Successfully updated expiry date');
        // Refresh data after successful update
        fetchPantryItems();
      } else {
        const errorText = await response.text();
        console.error('Failed to update pantry item expiry date:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error updating item expiry date:', error);
    }
  };

  const handleExpiryDateUpdate = (itemId: string, expiryDate: string) => {
    if (expiryDate) {
      updateItemExpiryDate(itemId, expiryDate);
    }
    setEditingExpiry(null);
    setNewExpiryDate('');
  };

  const fetchWeeklyDeals = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/weekly-deals`);
      if (response.ok) {
        const data = await response.json();
        setWeeklyDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Error fetching weekly deals:', error);
    }
  };

  const addDetectedItems = async (items: any[]) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/add-detected-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        setShowPhotoModal(false);
        setDetectedItems([]);
        fetchPantryItems();
        fetchShoppingList();
        alert(`Successfully added ${items.length} items to your pantry!`);
      } else {
        console.error('Failed to add detected items');
        alert('Failed to add items. Please try again.');
      }
    } catch (error) {
      console.error('Error adding detected items:', error);
      alert('Error adding items. Please try again.');
    }
  };

  const updateShoppingListQuantity = async (itemId: string, newQuantity: number) => {
    try {
      console.log('🛒 Updating shopping list item:', itemId, 'to quantity:', newQuantity);
      
      // Find the item in the shopping list to get its current data
      const item = shoppingList.find(item => item.id === itemId);
      if (!item) {
        console.error('Item not found in shopping list:', itemId);
        return;
      }
      
      console.log('🛒 Item data:', `Name: ${item.name}, Unit: ${item.unit || 'none'}, Category: ${item.category}`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groceries/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: item.name,
          category: item.category,
          currentCount: newQuantity,
          minCount: item.needed || 1,
          unit: item.unit || '',
          notes: item.unit || '' // Notes field is used for UOM
        }),
      });
      
      if (response.ok) {
        // Refresh data after successful update
        fetchShoppingList();
        fetchPantryItems();
      } else {
        console.error('Failed to update shopping list item quantity');
      }
    } catch (error) {
      console.error('Error updating shopping list item quantity:', error);
    }
  };

  const openQuantityModal = (item: ShoppingListItem) => {
    console.log('📝 Opening quantity modal for:', item.name, 'Current quantity:', item.quantity || item.needed || 1);
    setEditingItem(item);
    setNewQuantity((item.quantity || item.needed || 1).toString());
    setShowQuantityModal(true);
  };

  const handleQuantityUpdate = async () => {
    if (!editingItem || !newQuantity) return;
    
    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    console.log('🔄 Submitting quantity update for:', editingItem.name, 'New quantity:', quantity);
    await updateShoppingListQuantity(editingItem.id, quantity);
    setShowQuantityModal(false);
    setEditingItem(null);
    setNewQuantity('');
  };

  const LootListModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: '',
      quantity: 1,
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      unit: '',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groceries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...formData, addedDate: new Date().toISOString(), completed: false}),
        });
        
        if (response.ok) {
          setShowAddModal(false);
          setBulkMode(false);
          setBulkText('');
          setFormData({
            name: '',
            category: '',
            quantity: 1,
            priority: 'Medium',
            unit: '',
            notes: ''
          });
          fetchGroceryItems();
          fetchShoppingList();
        }
      } catch (error) {
        console.error('Error adding item:', error);
      }
    };

    if (!showAddModal || modalType !== 'loot') return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(32px)',
          borderRadius: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '3rem',
          width: '90%',
          maxWidth: '650px',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          {/* Close X button */}
          <button
            onClick={() => {
              setShowAddModal(false);
              setBulkMode(false);
              setBulkText('');
            }}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
          >
            ×
          </button>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            padding: '0.6rem 2rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.875rem',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
            letterSpacing: '0.1em',
            zIndex: 10
          }}>
            SHOPPING LIST
          </div>
          
          <h2 style={{
            color: 'white', 
            marginBottom: '2.5rem', 
            marginTop: '0.5rem',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '2rem',
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}>
            ✨ Add New Item
          </h2>
          
          {/* Toggle between Single and Bulk mode */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '1.25rem',
            padding: '0.375rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            <button
              type="button"
              onClick={() => setBulkMode(false)}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                borderRadius: '1rem',
                border: 'none',
                background: !bulkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: !bulkMode ? 'white' : 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Fredoka', system-ui, sans-serif",
              }}
            >
              📝 Single Add
            </button>
            <button
              type="button"
              onClick={() => setBulkMode(true)}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                borderRadius: '1rem',
                border: 'none',
                background: bulkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: bulkMode ? 'white' : 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Fredoka', system-ui, sans-serif",
              }}
            >
              📋 Bulk Add
            </button>
          </div>

          {!bulkMode ? (
            <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gap: '1.5rem', padding: '0'}}>
              <input
                type="text"
                placeholder="What would you like to add? (e.g., Organic Bananas)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{
                  padding: '1.125rem 1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              />
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'}}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      width: '100%',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none'
                    }}
                  >
                    <option value="" disabled style={{background: '#1e293b'}}>📂 Select Category</option>
                    {pantryCategories.filter(cat => cat !== 'all').map((category) => (
                      <option key={category} value={category} style={{background: '#1e293b'}}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="📦 Unit (pcs, bags)"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'}}>
                <div>
                  <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    📊 Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 1})}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontWeight: '700',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    📈 Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as 'High' | 'Medium' | 'Low'})}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontSize: '0.9375rem',
                      fontWeight: '700',
                      width: '100%',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none'
                    }}
                  >
                    <option value="High" style={{background: '#1e293b'}}>🔴 High Priority</option>
                    <option value="Medium" style={{background: '#1e293b'}}>🟡 Medium Priority</option>
                    <option value="Low" style={{background: '#1e293b'}}>🟢 Low Priority</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                  📝 Notes
                </label>
                <textarea
                  placeholder="Any special instructions or preferences?"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  style={{
                    padding: '1.125rem 1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    resize: 'none',
                    fontFamily: 'inherit',
                    outline: 'none',
                    lineHeight: '1.5',
                    width: '100%'
                  }}
                />
              </div>
            </div>
            
            <div style={{
              display: 'flex', 
              gap: '1rem', 
              marginTop: '2rem', 
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setBulkMode(false);
                  setBulkText('');
                }}
                style={{
                  flex: '1',
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: '1',
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                Add to List
              </button>
            </div>
          </form>
          ) : (
            /* Bulk Add Mode */
            <div style={{display: 'grid', gap: '1.5rem'}}>
              <div>
                <label style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: '0.9375rem', 
                  marginBottom: '0.75rem', 
                  display: 'block', 
                  fontWeight: '700',
                  textAlign: 'center',
                  fontFamily: "'Fredoka', system-ui, sans-serif"
                }}>
                  📋 Paste your grocery list below (one item per line)
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Examples:
2 lbs apples
bananas - 6 pieces
milk, 1 gallon
bread
3 bottles olive oil
chicken breast, 2 lbs`}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    borderRadius: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontFamily: 'monospace',
                    resize: 'vertical' as const,
                    minHeight: '200px',
                    outline: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease',
                    lineHeight: '1.6'
                  }}
                />
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.25rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '0.8125rem',
                  margin: '0 0 0.75rem 0',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  📝 Supported formats:
                </p>
                <ul style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.8125rem',
                  margin: 0,
                  paddingLeft: '1.25rem',
                  display: 'grid',
                  gap: '0.375rem',
                  fontWeight: '500'
                }}>
                  <li>"2 lbs apples" or "3 bottles water"</li>
                  <li>"apples, 2 lbs" or "water - 3 bottles"</li>
                  <li>"bread" (defaults to 1 piece)</li>
                </ul>
                <p style={{
                  color: '#34d399',
                  fontSize: '0.75rem',
                  margin: '1rem 0 0 0',
                  fontStyle: 'italic',
                  fontWeight: '600'
                }}>
                  🤖 Items will be automatically categorized by AI
                </p>
              </div>

              <div style={{
                display: 'flex', 
                gap: '1rem', 
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setBulkText('');
                    setBulkMode(false);
                    setShowAddModal(false);
                  }}
                  style={{
                    ...styles.bulkButton,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={!bulkText.trim()}
                  style={{
                    ...styles.bulkButton,
                    background: bulkText.trim() 
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: bulkText.trim() ? 'white' : 'rgba(255, 255, 255, 0.2)',
                    cursor: bulkText.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: bulkText.trim() ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                    border: bulkText.trim() ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  🚀 Add All Items
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PantryModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: '',
      currentCount: 0,
      minCount: 1,
      unit: '',
      notes: '',
      expiryDate: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        console.log('🏠 Adding new pantry item:', `Name: ${formData.name}, Category: ${formData.category}, Count: ${formData.currentCount}, Unit: ${formData.unit}`);
        const timestamp = Date.now();
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry?t=${timestamp}`;
        console.log('🏠 POST URL:', apiUrl);
        console.log('🏠 POST body:', JSON.stringify(formData));
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        console.log('🏠 Add pantry response status:', response.status);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('🏠 Add pantry response:', responseText);
          console.log('🏠 Refreshing pantry data after adding item...');
          setShowAddModal(false);
          setFormData({
            name: '',
            category: '',
            currentCount: 0,
            minCount: 1,
            unit: '',
            notes: '',
            expiryDate: ''
          });
          fetchPantryItems();
          fetchShoppingList();
        } else {
          const errorText = await response.text();
          console.error('Failed to add pantry item:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error adding pantry item:', error);
      }
    };

    if (!showAddModal || modalType !== 'pantry') return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(32px)',
          borderRadius: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '3rem',
          width: '90%',
          maxWidth: '650px',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          {/* Close X button */}
          <button
            onClick={() => setShowAddModal(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
          >
            ×
          </button>
          
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            padding: '0.6rem 2rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.875rem',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
            letterSpacing: '0.1em',
            zIndex: 10
          }}>
            PANTRY INVENTORY
          </div>
          
          <h2 style={{
            color: 'white', 
            marginBottom: '2.5rem', 
            marginTop: '0.5rem',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '2rem',
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}>
            🏠 Update Inventory
          </h2>
          
          {/* Toggle buttons for single vs bulk mode */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '1.25rem',
            padding: '0.375rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            <button
              type="button"
              onClick={() => setPantryBulkMode(false)}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                borderRadius: '1rem',
                border: 'none',
                background: !pantryBulkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: !pantryBulkMode ? 'white' : 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Fredoka', system-ui, sans-serif",
              }}
            >
              Single Item
            </button>
            <button
              type="button"
              onClick={() => setPantryBulkMode(true)}
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                borderRadius: '1rem',
                border: 'none',
                background: pantryBulkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: pantryBulkMode ? 'white' : 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Fredoka', system-ui, sans-serif",
              }}
            >
              Bulk Add
            </button>
          </div>
          
          {!pantryBulkMode ? (
            <form onSubmit={handleSubmit}>
              <div style={{display: 'grid', gap: '1.25rem'}}>
                <input
                  type="text"
                  placeholder="What would you like to add? (e.g., Extra Virgin Olive Oil)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{
                  padding: '1.125rem 1.25rem',
                  borderRadius: '1.125rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                  width: '100%'
                }}
              />
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'}}>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none'
                  }}
                >
                  <option value="" disabled style={{background: '#1e293b'}}>🎪 Select Category</option>
                  {pantryCategories.filter(cat => cat !== 'all').map((category) => (
                    <option key={category} value={category} style={{background: '#1e293b'}}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="📦 Unit (jars, bottles)"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'}}>
                <div>
                  <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    📦 Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.currentCount}
                    onChange={(e) => setFormData({...formData, currentCount: parseFloat(e.target.value) || 0})}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontWeight: '700',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    ⚠️ Min Needed
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minCount}
                    onChange={(e) => setFormData({...formData, minCount: parseFloat(e.target.value) || 1})}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontWeight: '700',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem'}}>
                <div>
                  <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    📝 Storage notes...
                  </label>
                  <textarea
                    placeholder="Any special instructions or cooking tips?"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontSize: '0.9375rem',
                      resize: 'none',
                      fontFamily: 'inherit',
                      width: '100%',
                      outline: 'none',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                    📅 Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: 'white',
                      fontSize: '0.875rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex', 
              gap: '1rem', 
              marginTop: '2rem', 
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: '1',
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: '1',
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                Add to Pantry
              </button>
            </div>
          </form>
          ) : (
            <div>
              <label style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '0.9375rem', 
                marginBottom: '1rem', 
                display: 'block', 
                fontWeight: '700',
                textAlign: 'center',
                fontFamily: "'Fredoka', system-ui, sans-serif"
              }}>
                📝 Paste your pantry list (one item per line)
              </label>
              <textarea
                value={pantryBulkText}
                onChange={(e) => setPantryBulkText(e.target.value)}
                placeholder="Rice, 5 cups, 2 cups&#10;Pasta - 3 boxes&#10;Olive Oil, 2 bottles, 1 bottle&#10;Salt&#10;Black Pepper, 1 container, min 1"
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontFamily: 'monospace',
                  resize: 'vertical' as const,
                  minHeight: '200px',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  lineHeight: '1.6'
                }}
                rows={8}
              />
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.25rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  💡 Format examples:
                </div>
                <ul style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8125rem', margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.375rem', fontWeight: '500' }}>
                  <li>Item name, current amount, minimum needed</li>
                  <li>Item name - current amount</li>
                  <li>Just item name (will set defaults)</li>
                  <li>Add expiry dates with "expires YYYY-MM-DD"</li>
                </ul>
              </div>
              
              <button
                type="button"
                onClick={handleBulkPantrySubmit}
                disabled={!pantryBulkText.trim()}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: pantryBulkText.trim() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255, 255, 255, 0.05)',
                  color: pantryBulkText.trim() ? 'white' : 'rgba(255, 255, 255, 0.2)',
                  fontWeight: '800',
                  fontSize: '0.9375rem',
                  cursor: pantryBulkText.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: pantryBulkText.trim() ? '0 10px 25px -5px rgba(59, 130, 246, 0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                🏠 Add All to Pantry ({pantryBulkText.split('\n').filter(line => line.trim()).length} items)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Function to handle quantity changes in review modal
  const updateReviewItemQuantity = (itemId: string, newQuantity: number) => {
    setReviewItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: Math.max(0, newQuantity) }
          : item
      )
    );
  };

  // Function to remove item from review list
  const removeReviewItem = (itemId: string) => {
    setReviewItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Function to add a brand-new impulse item to the review list
  const addImpulseItem = () => {
    const name = prompt('Enter item name (Impulse Buy):');
    if (!name || !name.trim()) return;
    const qtyStr = prompt('Enter quantity:', '1');
    const qty = qtyStr ? parseFloat(qtyStr) : 1;
    if (isNaN(qty) || qty <= 0) return;
    const unit = prompt('Enter unit (e.g., pcs, packs):', 'units') || 'units';
    const expiryDate = prompt('Enter expiry date (YYYY-MM-DD) or leave empty:', '') || '';
    const newItem = {
      id: `new-${Date.now()}`,
      name: name.trim(),
      quantity: qty,
      unit,
      category: 'Misc',
      source: 'new' as const,
      expiryDate
    };
    setReviewItems(prev => [...prev, newItem]);
  };

  // Function to add items to pantry and remove from shopping list
  const addItemsToPantry = async () => {
    try {
      // Filter out items with 0 quantity
      const itemsToAdd = reviewItems.filter(item => item.quantity > 0);
      
      if (itemsToAdd.length === 0) {
        alert('No items to add to pantry!');
        return;
      }

      // Add items to pantry and remove from shopping list
      for (const item of itemsToAdd) {
        // Add to pantry - convert from grocery list format to pantry format
        const pantryData = {
          name: item.name,
          category: item.category || 'Misc',
          currentCount: item.quantity,
          minCount: 1,
          unit: item.unit || 'units', // Unit comes from item.unit (which was mapped from Notes column)
          notes: `Added from shopping list on ${new Date().toLocaleDateString()}`,
          expiryDate: item.expiryDate || ''
        };

        console.log(`📦 Adding item to pantry:`, pantryData);
        console.log(`📅 Expiry date being sent:`, pantryData.expiryDate);
        console.log(`📅 Expiry date type:`, typeof pantryData.expiryDate);
        const pantryResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pantryData)
        });
        
        if (!pantryResponse.ok) {
          const errorText = await pantryResponse.text();
          console.error(`❌ Failed to add ${item.name} to pantry:`, pantryResponse.status, errorText);
        } else {
          console.log(`✅ Successfully added ${item.name} to pantry`);
        }

        // If this item originally came from the grocery list, mark it off that list
        if (item.source === 'grocery') {
          console.log(`🔄 Updating grocery item ${item.id} to remove from shopping list:`, {
            name: item.name,
            onList: false
          });
          
          const updateResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groceries/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              category: item.category || 'Misc',
              currentCount: item.quantity,
              priority: 'Medium', // Column D: Priority
              notes: item.unit || 'units', // Column E: Notes (contains units)
              addedDate: new Date().toISOString().split('T')[0], // Column F: Added Date
              completed: false, // Column G: Completed
              onList: false // Column H: On List - mark as not on list
            })
          });
          
          if (!updateResponse.ok) {
            console.error(`❌ Failed to update grocery item ${item.id}:`, updateResponse.status);
          } else {
            console.log(`✅ Successfully updated grocery item ${item.id} onList to FALSE`);
          }
        }
      }

      // Refresh data
      await fetchPantryItems();
      await fetchShoppingList();
      
      // Close modal and reset
      setShowPantryReviewModal(false);
      setReviewItems([]);
      
      alert(`Successfully added ${itemsToAdd.length} items to pantry!`);
      
    } catch (error) {
      console.error('Error adding items to pantry:', error);
      alert('Error adding items to pantry. Please try again.');
    }
  };

  const PantryReviewModal = () => {
    if (!showPantryReviewModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(32px)',
          borderRadius: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '3rem',
          width: '95%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Close button */}
          <button
            onClick={() => setShowPantryReviewModal(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
          >
            ×
          </button>

          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            padding: '0.6rem 2.5rem',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.875rem',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
            letterSpacing: '0.1em',
            zIndex: 10
          }}>
            REVIEW & STOCK
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            marginTop: '0.5rem'
          }}>
            <h2 style={{
              color: 'white',
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontSize: '2.25rem',
              fontWeight: '800',
              margin: '0 0 0.75rem 0',
              letterSpacing: '-0.02em'
            }}>
              Stock Your Pantry 🏠
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.125rem',
              margin: '0',
              fontWeight: '500'
            }}>
              Check off what you bought and adjust quantities!
            </p>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid rgba(255,255,255,0.2)'
          }}>
            <div>
              <h2 style={{
                color: 'white',
                fontFamily: "'Fredoka', system-ui, sans-serif",
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <img src="/grocery icon 2.png" alt="Pantry Icon" style={{width: '32px', height: '32px', objectFit: 'contain'}} />
                Review & Add to Pantry
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                margin: '0.5rem 0 0 0',
                fontSize: '1rem'
              }}>
                Adjust quantities for items you actually purchased
              </p>
            </div>
            <button
              onClick={() => {
                setShowPantryReviewModal(false);
                setReviewItems([]);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              ×
            </button>
          </div>

          {/* Impulse add button */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={addImpulseItem}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              <span>➕</span> Impulse Buy!
            </button>
          </div>

          {/* Items List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '2rem',
            paddingRight: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {reviewItems.map((item, index) => (
              <div key={item.id || index} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1.25rem',
                padding: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0
                  }}>
                    {getCategoryEmoji(item.category || 'other')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{
                      color: 'white',
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      letterSpacing: '0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </h4>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      margin: '0.375rem 0 0 0',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{item.category}</span> • {item.unit || 'units'}
                      {item.expiryDate && (
                        <span style={{
                          color: '#fbbf24',
                          fontWeight: '700',
                          marginLeft: '0.5rem'
                        }}>
                          • 📅 {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexShrink: 0
                }}>
                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '1rem',
                    padding: '0.375rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <button
                      onClick={() => updateReviewItemQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      -
                    </button>
                    <span style={{
                      color: 'white',
                      fontWeight: '800',
                      fontSize: '1.125rem',
                      minWidth: '3rem',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateReviewItemQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#4ade80',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => removeReviewItem(item.id)}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.875rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {reviewItems.filter(item => item.quantity > 0).length} items to stock
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flex: 1,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowPantryReviewModal(false);
                  setReviewItems([]);
                }}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '1rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addItemsToPantry}
                disabled={reviewItems.filter(item => item.quantity > 0).length === 0}
                style={{
                  padding: '1rem 2.5rem',
                  background: reviewItems.filter(item => item.quantity > 0).length > 0 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: reviewItems.filter(item => item.quantity > 0).length > 0 ? 'white' : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '1rem',
                  cursor: reviewItems.filter(item => item.quantity > 0).length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '800',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: reviewItems.filter(item => item.quantity > 0).length > 0 ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                Stock {reviewItems.filter(item => item.quantity > 0).length} Items
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PhotoAnalyzerModal = () => {
    if (!showPhotoModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(32px)',
          borderRadius: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '3rem',
          width: '90%',
          maxWidth: '650px',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            color: 'white', 
            marginBottom: '2rem', 
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '2rem',
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}>
            📸 Photo Analysis
          </h2>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '2rem' }}>
            {detectedItems.length > 0 ? (
              <>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.5)', 
                  marginBottom: '1.5rem', 
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  We detected {detectedItems.length} items in your photo. Review and add them to your pantry:
                </p>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {detectedItems.map((item, index) => (
                    <div key={index} style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '1.25rem',
                      padding: '1.25rem',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{color: 'white', margin: '0 0 0.375rem 0', fontSize: '1.1rem', fontWeight: '700'}}>{item.name}</h4>
                        <p style={{color: 'rgba(255, 255, 255, 0.4)', margin: 0, fontSize: '0.875rem', fontWeight: '500'}}>
                          {item.category} • {item.estimatedCount} {item.unit}
                        </p>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        background: item.confidence > 0.8 ? 'rgba(16, 185, 129, 0.1)' : 
                                   item.confidence > 0.6 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: item.confidence > 0.8 ? '#34d399' : 
                               item.confidence > 0.6 ? '#fbbf24' : '#f87171',
                        border: '1px solid currentColor',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        {Math.round(item.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.125rem'}}>No items detected in the photo.</p>
              </div>
            )}
          </div>
          
          <div style={{display: 'flex', gap: '1rem'}}>
            <button
              onClick={() => {
                setShowPhotoModal(false);
                setDetectedItems([]);
              }}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => addDetectedItems(detectedItems)}
              disabled={detectedItems.length === 0}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '1rem',
                border: 'none',
                background: detectedItems.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.05)',
                color: detectedItems.length > 0 ? 'white' : 'rgba(255, 255, 255, 0.2)',
                fontWeight: '800',
                cursor: detectedItems.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: detectedItems.length > 0 ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              Add {detectedItems.length} Items
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Animated background orbs */}
      <div style={styles.backgroundOrbs}>
        <div style={styles.orb1}></div>
        <div style={styles.orb2}></div>
      </div>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              <img src="/grocery scene 1.png" alt="Grocery Scene" style={{
                width: '95px', 
                height: '95px', 
                objectFit: 'contain',
                borderRadius: '1rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }} />
            </div>
            <div style={{paddingLeft: '1.5rem'}}>
              <h1 style={styles.title}>Laurie's Culinary Console</h1>
              <p style={styles.subtitle}>Where culinary magic meets smart organization! ✨</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              style={styles.spreadsheetBtn}
              onClick={() => window.open('https://docs.google.com/spreadsheets/d/1HtJ5n9WkxkQbtRlaMYxQ9xv_ZISN9lEqoGtgf-7bPO4/edit?gid=899749109#gid=899749109', '_blank')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
              }}
            >
              📊 View Spreadsheet
            </button>
            <button
              style={styles.weeksListBtn}
              onClick={() => setShowWeeksListBox(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📥</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>Weeks List</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>PDF</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats Section */}
      <div style={{...styles.main, paddingBottom: 0}}>
        <div style={styles.quickStatsCard}>
          <div style={styles.quickStatsGrid}>
            <div 
              style={styles.quickStatCard}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.quickStatCardHover)}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = styles.quickStatCard.boxShadow;
                e.currentTarget.style.border = styles.quickStatCard.border;
              }}
            >
              <div style={{...styles.quickStatValue, color: '#6ee7b7'}}>{shoppingList.length}</div>
              <div style={styles.quickStatLabel}>On List</div>
            </div>
            <div 
              style={styles.quickStatCard}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.quickStatCardHover)}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = styles.quickStatCard.boxShadow;
                e.currentTarget.style.border = styles.quickStatCard.border;
              }}
            >
              <div style={{...styles.quickStatValue, color: '#fbbf24'}}>
                {pantryItems.filter(item => item.currentCount < item.minCount).length}
              </div>
              <div style={styles.quickStatLabel}>Running Low</div>
            </div>
            <div 
              style={styles.quickStatCard}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.quickStatCardHover)}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = styles.quickStatCard.boxShadow;
                e.currentTarget.style.border = styles.quickStatCard.border;
              }}
            >
              <div style={{...styles.quickStatValue, color: '#f87171'}}>
                {pantryItems.filter(item => item.currentCount === 0).length}
              </div>
              <div style={styles.quickStatLabel}>Items Out of Stock</div>
            </div>
            <div 
              style={styles.quickStatCard}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.quickStatCardHover)}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = styles.quickStatCard.boxShadow;
                e.currentTarget.style.border = styles.quickStatCard.border;
              }}
            >
              <div style={styles.quickStatValue}>{pantryItems.length}</div>
              <div style={styles.quickStatLabel}>In Pantry</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button 
            style={{
              ...styles.tab,
              ...styles.tabShopping,
              ...(activeTab === 'shopping' 
                ? styles.tabShoppingActive 
                : {}
              )
            }}
            onClick={() => setActiveTab('shopping')}
            onMouseEnter={() => setHoveredTab('shopping')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <img src="/grocery icon 1.png" alt="Grocery Icon" style={{width: '20px', height: '20px', objectFit: 'contain', marginRight: '8px'}} />
            Laurie's Loot List
          </button>
          <button 
            style={{
              ...styles.tab,
              ...styles.tabPantry,
              ...(activeTab === 'pantry' 
                ? styles.tabPantryActive 
                : {}
              )
            }}
            onClick={() => setActiveTab('pantry')}
            onMouseEnter={() => setHoveredTab('pantry')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <img src="/grocery icon 2.png" alt="Grocery Icon" style={{width: '20px', height: '20px', objectFit: 'contain', marginRight: '8px'}} />
            Laurie's Secret Stash
          </button>
        </div>

        {/* Toggle Buttons - Always Accessible Below Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button 
            style={{
              ...styles.addBtn,
              background: `linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(22,163,74,0.5) 100%), 
                           repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)`,
              border: '2px solid rgba(34,197,94,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
            onClick={() => {
              setModalType('pantry');
              setShowAddModal(true);
            }}
          >
            <img src="/grocery icon 2.png" alt="Add Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
            Top Up Stash!
          </button>
          <button 
            style={{
              ...styles.addBtn,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.8) 0%, rgba(15,118,110,0.7) 100%)',
              border: '2px solid rgba(20,184,166,0.7)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
            onClick={() => {
              setShowRecipes(!showRecipes);
              if (!showRecipes) generateRecipes();
            }}
          >
            <img src="/kitchen icon 2.png" alt="Recipe Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
            {showRecipes ? 'Hide Recipes' : 'Recipe Ideas'}
          </button>
          <button 
            style={{
              ...styles.addBtn,
              background: 'linear-gradient(135deg, rgba(100,116,139,0.4) 0%, rgba(71,85,105,0.35) 100%)',
              border: '2px solid rgba(100,116,139,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
            onClick={() => {
              setShowMealPlan(!showMealPlan);
              if (!showMealPlan) generateMealPlan();
            }}
          >
            <img src="/cupboard image 1.png" alt="Meal Plan Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
            {showMealPlan ? 'Hide Meal Plan' : 'Meal Planning'}
          </button>
          <button 
            style={{
              ...styles.addBtn,
              background: `linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(37,99,235,0.5) 100%), 
                           repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)`,
              border: '2px solid rgba(59,130,246,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <img src="/grocery icon 1.png" alt="Analytics Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
            {showAnalytics ? 'Hide Analytics' : 'Analytics'}
          </button>
        </div>

        {showAnalytics ? (
          <div style={{
            ...styles.card,
            marginBottom: '1.5rem',
            background: 'linear-gradient(145deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))',
            border: '1px solid rgba(59,130,246,0.3)'
          }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  Analytics
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Pantry Analytics</h2>
                  <p style={{...styles.cardSubtitle, marginTop: '0.1rem'}}>Insights and trends from your pantry data!</p>
                </div>
              </div>
            </div>
            <div style={{padding: '1rem'}}>
              <PantryAnalytics pantryItems={filteredPantryItems} />
            </div>
          </div>
        ) : null}

        {/* Recipes Section - Full Width Above All Tab Content */}
        {showRecipes && (
          <div style={{
            ...styles.card,
            marginBottom: '1.5rem',
            background: 'linear-gradient(145deg, rgba(20,184,166,0.1), rgba(15,118,110,0.05))',
            border: '1px solid rgba(20,184,166,0.3)'
          }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  <img src="/cupboard image 1.png" alt="Recipe Icon" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Recipe Inspiration</h2>
                  <p style={{...styles.cardSubtitle, marginTop: '0.1rem'}}>Delicious ideas based on your pantry ingredients! 👨‍🍳✨</p>
                </div>
              </div>
              <button 
                style={{
                  ...styles.addBtn,
                  background: loadingRecipes 
                    ? 'linear-gradient(to right, rgba(120,120,120,0.4), rgba(140,140,120,0.3))'
                    : 'linear-gradient(to right, rgba(20,184,166,0.8), rgba(15,118,110,0.7))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={generateRecipes}
                disabled={loadingRecipes}
              >
                {loadingRecipes ? <Spinner size={16} color="#ffffff" /> : (
                  <img src="/cupboard image 1.png" alt="Refresh Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                )}
                {loadingRecipes ? 'Finding Recipes...' : 'Get New Recipes'}
              </button>
            </div>
            
            <div style={{padding: '0.5rem'}}>
              {recipes.length === 0 ? (
                loadingRecipes ? (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <Spinner size={28} color="#14b8a6" style={{ marginRight: 0 }} />
                    <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '0.5rem'}}>
                      👩‍🍳 Hang on while the AI chefs cook something up for you!
                    </p>
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem'}}>
                      We're crafting breakfast, lunch, dinner, and dessert ideas from your pantry.
                    </p>
                  </div>
                ) : (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <img src="/cupboard image 1.png" alt="Recipe Icon" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', marginBottom: '1rem'}}>
                      🍽️ {pantryItems.filter(item => item.currentCount > 0).length === 0 
                        ? "Add some ingredients to your pantry first!" 
                        : "Not enough ingredients for complete recipes"}
                    </p>
                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem'}}>
                      {pantryItems.filter(item => item.currentCount > 0).length === 0 
                        ? "Stock up your pantry, then click 'Get New Recipes' to discover dishes you can make!"
                        : "Try adding more ingredients to your pantry for more recipe options. We only suggest recipes you can actually make!"}
                    </p>
                  </div>
                )
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: '2rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {recipes.map((recipe, index) => (
                    <div key={index} style={{
                      ...styles.card,
                      background: 'linear-gradient(145deg, rgba(100,116,139,0.1), rgba(71,85,105,0.05))',
                      border: '1px solid rgba(100,116,139,0.3)',
                      padding: '1.5rem',
                      minHeight: '300px',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(100,116,139,0.2), rgba(71,85,105,0.1))',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{fontSize: '2rem'}}>
                            {recipe.mealType === 'breakfast' ? '🌅' : 
                             recipe.mealType === 'lunch' ? '🌞' : 
                             recipe.mealType === 'dinner' ? '🌙' : '🍰'}
                          </span>
                        </div>
                        <div style={{flex: 1}}>
                          <h3 style={{
                            ...styles.cardTitleText,
                            fontSize: '1.3rem',
                            marginBottom: '0.5rem'
                          }}>{recipe.title}</h3>
                          <p style={{
                            ...styles.cardSubtitle,
                            marginBottom: '0.5rem'
                          }}>{recipe.description}</p>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(100,116,139,0.2), rgba(71,85,105,0.1))',
                              color: '#94a3b8',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              border: '1px solid rgba(100,116,139,0.3)'
                            }}>
                              ⏱️ {recipe.cookTime}
                            </span>
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(100,116,139,0.2), rgba(71,85,105,0.1))',
                              color: '#94a3b8',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              border: '1px solid rgba(100,116,139,0.3)'
                            }}>
                              👥 {recipe.servings} servings
                            </span>
                            <span style={{
                              background: 'linear-gradient(135deg, rgba(100,116,139,0.2), rgba(71,85,105,0.1))',
                              color: '#94a3b8',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              border: '1px solid rgba(100,116,139,0.3)'
                            }}>
                              🎯 {recipe.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{marginBottom: '1rem'}}>
                        <h4 style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '1rem',
                          marginBottom: '0.5rem',
                          fontWeight: '600'
                        }}>Ingredients:</h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.5rem'
                        }}>
                          {recipe.ingredients.map((ingredient, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(100,116,139,0.1)',
                              borderRadius: '0.5rem',
                              border: '1px solid rgba(100,116,139,0.2)'
                            }}>
                              <span style={{
                                color: recipe.availableIngredients.includes(ingredient) ? '#10b981' : '#f59e0b',
                                fontSize: '1.2rem'
                              }}>
                                {recipe.availableIngredients.includes(ingredient) ? '✅' : '⚠️'}
                              </span>
                              <span style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.9rem'
                              }}>
                                {ingredient}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '1rem',
                          marginBottom: '0.5rem',
                          fontWeight: '600'
                        }}>Instructions:</h4>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          {recipe.instructions.map((instruction, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              background: 'rgba(100,116,139,0.05)',
                              borderRadius: '0.5rem',
                              border: '1px solid rgba(100,116,139,0.1)'
                            }}>
                              <span style={{
                                background: 'linear-gradient(135deg, rgba(100,116,139,0.3), rgba(71,85,105,0.2))',
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                flexShrink: 0
                              }}>
                                {idx + 1}
                              </span>
                              <span style={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                              }}>
                                {instruction}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meal Planning Section - Full Width Above All Tab Content */}
        {showMealPlan && (
          <div style={{
            ...styles.card,
            marginBottom: '1.5rem',
            background: 'linear-gradient(145deg, rgba(100,116,139,0.1), rgba(139,92,246,0.05))',
            border: '1px solid rgba(100,116,139,0.3)'
          }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  <img src="/cupboard image 1.png" alt="Meal Plan Icon" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>AI Meal Planning</h2>
                  <p style={{...styles.cardSubtitle, marginTop: '0.1rem'}}>Weekly meal plans from your pantry ingredients! 📅🍽️</p>
                </div>
              </div>
              <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <button 
                  style={{
                    ...styles.addBtn,
                    background: loadingMealPlan 
                      ? 'linear-gradient(to right, rgba(120,120,120,0.4), rgba(140,140,120,0.3))'
                      : 'linear-gradient(to right, rgba(100,116,139,0.8), rgba(71,85,105,0.7))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={generateMealPlan}
                  disabled={loadingMealPlan}
                >
                  {loadingMealPlan ? <Spinner size={16} color="#ffffff" /> : (
                    <img src="/cupboard image 1.png" alt="Generate Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                  )}
                  {loadingMealPlan ? 'Generating...' : 'Generate New Plan'}
                </button>
                {mealPlan && (
                  <>
                    <button 
                      style={{
                        ...styles.addBtn,
                        background: 'linear-gradient(to right, rgba(34,197,94,0.8), rgba(22,163,74,0.7))',
                        fontSize: '0.85rem'
                      }}
                      onClick={addMealPlanToShoppingList}
                    >
                      📋 Add to Shopping List
                    </button>
                    <button 
                      style={{
                        ...styles.addBtn,
                        background: 'linear-gradient(to right, rgba(239,68,68,0.8), rgba(220,38,38,0.7))',
                        fontSize: '0.85rem'
                      }}
                      onClick={exportMealPlanPDF}
                    >
                      📄 Export PDF
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={{padding: '0.5rem'}}>
              {!mealPlan ? (
                loadingMealPlan ? (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <Spinner size={28} color="#a855f7" style={{ marginRight: 0 }} />
                    <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '0.5rem'}}>
                      👩‍🍳 Creating your personalized weekly meal plan...
                    </p>
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem'}}>
                      Analyzing your pantry and dietary preferences to craft the perfect week of meals!
                    </p>
                  </div>
                ) : (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <img src="/cupboard image 1.png" alt="Meal Plan Icon" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', marginBottom: '1rem'}}>
                      🍽️ {pantryItems.filter(item => item.currentCount > 0).length === 0 
                        ? "Add ingredients to your pantry first!" 
                        : "Ready to plan your week?"}
                    </p>
                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem'}}>
                      Click "Generate New Plan" to create a personalized weekly meal plan using your pantry ingredients!
                    </p>
                  </div>
                )
              ) : (
                <div style={{
                  background: 'linear-gradient(145deg, rgba(100,116,139,0.05), rgba(139,92,246,0.02))',
                  border: '1px solid rgba(100,116,139,0.2)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  width: '100%'
                }}>
                  <div style={{marginBottom: '2rem'}}>
                    <h3 style={{color: '#94a3b8', fontSize: '1.4rem', marginBottom: '1rem', textAlign: 'center'}}>
                      Weekly Meal Plan - {mealPlan.weekOf}
                    </h3>
                    {mealPlan.dietaryPreferences?.length > 0 && (
                      <p style={{color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '1rem'}}>
                        Dietary preferences: {mealPlan.dietaryPreferences.join(', ')}
                      </p>
                    )}
                    {mealPlan.totalEstimatedCost && (
                      <p style={{color: '#34d399', textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem'}}>
                        Estimated shopping cost: ${mealPlan.totalEstimatedCost}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const dayMeals = (mealPlan.meals || []).filter((meal: any) => meal.day === day);
                      return (
                        <div key={day} style={{
                          background: 'rgba(100,116,139,0.1)',
                          border: '1px solid rgba(100,116,139,0.2)',
                          borderRadius: '0.75rem',
                          padding: '1rem',
                          minHeight: '300px'
                        }}>
                          <h4 style={{color: '#94a3b8', fontSize: '1rem', marginBottom: '0.75rem', textAlign: 'center'}}>
                            {day}
                          </h4>
                          {['breakfast', 'lunch', 'dinner'].map(mealType => {
                            const meal = dayMeals.find((m: any) => m.mealType === mealType);
                            return (
                              <div key={mealType} style={{marginBottom: '0.75rem'}}>
                                <div style={{
                                  color: '#64748b',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  marginBottom: '0.25rem'
                                }}>
                                  {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '🌞' : '🌙'} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                </div>
                                {meal ? (
                                  <div style={{
                                    background: 'rgba(100,116,139,0.15)',
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem'
                                  }}>
                                    <div style={{color: 'rgba(255,255,255,0.9)', fontWeight: '500', marginBottom: '0.25rem'}}>
                                      {meal.recipeName}
                                    </div>
                                    <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem'}}>
                                      ⏱️ {meal.cookTime} | 👥 {meal.servings}
                                    </div>
                                    {meal.nutritionInfo && (
                                      <div style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', marginTop: '0.25rem'}}>
                                        📊 {meal.nutritionInfo.calories || 0} cal
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontStyle: 'italic'}}>
                                    No meal planned
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {mealPlan.shoppingList?.length > 0 && (
                    <div style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem'
                    }}>
                      <h4 style={{color: '#34d399', fontSize: '1.2rem', marginBottom: '1rem'}}>
                        📋 Shopping List ({mealPlan.shoppingList.length} items)
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {mealPlan.shoppingList.map((item: string, index: number) => (
                          <div key={index} style={{
                            background: 'rgba(34,197,94,0.15)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.5rem',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.85rem',
                            border: '1px solid rgba(34,197,94,0.2)'
                          }}>
                            • {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'shopping' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div 
                  style={styles.cardIcon}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardIconHover)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = styles.cardIcon.boxShadow;
                    e.currentTarget.style.border = styles.cardIcon.border;
                  }}
                >
                  <img src="/grocery icon 1.png" alt="Grocery Icon" style={{
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'contain',
                    borderRadius: '1rem',
                  }} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Loot List</h2>
                  <p style={styles.cardSubtitle}>Adventures awaiting in the grocery aisles! 🛒✨</p>
                </div>
              </div>
              <div style={styles.buttonGroup}>
                <button 
                  style={styles.addBtn}
                  onClick={() => {
                    setModalType('loot');
                    setShowAddModal(true);
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>➕</span>
                  Add to List
                </button>
                {shoppingList.length > 0 && (
                  <>
                    <button 
                      style={{
                        ...styles.addBtn,
                        background: 'rgba(251, 191, 36, 0.1)',
                        color: '#fbbf24',
                        borderColor: 'rgba(251, 191, 36, 0.2)'
                      }}
                      onClick={() => {
                        setShowPriceComparison(!showPriceComparison);
                        if (!showPriceComparison) {
                          comparePrices();
                          fetchWeeklyDeals();
                        }
                      }}
                      disabled={loadingPrices}
                    >
                      <span>{loadingPrices ? '⌛' : '💰'}</span>
                      {loadingPrices ? 'Comparing...' : (showPriceComparison ? 'Hide Prices' : 'Compare Prices')}
                    </button>
                    <button 
                      style={{
                        ...styles.pantryBtn,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#34d399',
                        borderColor: 'rgba(16, 185, 129, 0.2)'
                      }}
                      onClick={() => {
                        setReviewItems([...shoppingList]);
                        setShowPantryReviewModal(true);
                      }}
                    >
                      <span>📦</span>
                      Add All to Pantry
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div style={styles.inventoryList}>
              {shoppingList.length === 0 ? (
                <div style={{
                  ...styles.inventoryItem, 
                  textAlign: 'center', 
                  padding: '4rem 2rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderStyle: 'dashed'
                }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🎉</div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.125rem', fontWeight: '500' }}>
                    Laurie's all set! The snack gods are pleased! ✨
                  </p>
                </div>
              ) : (
                shoppingList.map((item, index) => {
                  const getStatusStyle = () => {
                    if (item.source === 'pantry') {
                      const current = item.currentCount ?? 0;
                      const minimum = item.minCount ?? 0;
                      if (current === 0) return styles.statusOut;
                      if (current < minimum) return styles.statusLow;
                      return styles.statusGood;
                    }
                    const priority = item.priority?.toLowerCase();
                    if (priority === 'high') return styles.statusOut;
                    if (priority === 'medium') return styles.statusLow;
                    return styles.statusGood;
                  };
                  
                  const getStatusText = () => {
                    if (item.source === 'pantry') {
                      const current = item.currentCount ?? 0;
                      const minimum = item.minCount ?? 0;
                      if (current === 0) return 'Out';
                      if (current < minimum) return 'Low';
                      return 'Okay';
                    }
                    const priority = item.priority?.toString() || 'Medium';
                    if (priority === 'High') return 'High';
                    if (priority === 'Low') return 'Low';
                    return 'Medium';
                  };
                  
                  const getItemIcon = () => {
                    const emoji = getCategoryEmoji(item.category || 'other');
                    return <span style={{fontSize: '1.5rem'}}>{emoji}</span>;
                  };
                  
                  const getDescription = () => {
                    const qty = item.quantity || item.needed || 1;
                    const uom = item.unit || '';
                    if (item.source === 'pantry') {
                      return `Need ${qty} ${uom}`;
                    }
                    return `${qty} ${uom}`;
                  };
                  
                  const statusColor = getStatusText() === 'Out' || getStatusText() === 'High' ? '#f87171' : 
                                     getStatusText() === 'Low' || getStatusText() === 'Medium' ? '#fbbf24' : '#4ade80';
                  
                  return (
                    <div key={item.id || index} style={{
                      ...styles.inventoryItem,
                      borderLeftColor: statusColor
                    }}>
                      <div style={styles.itemContent}>
                        <div style={styles.itemLeft}>
                          <div style={styles.itemIcon}>
                            {getItemIcon()}
                          </div>
                          <div style={styles.itemDetails}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <div style={styles.itemCategory}>
                              <span style={{
                                ...styles.itemBadge,
                                ...(item.source === 'pantry' ? styles.itemBadgeSource : styles.itemBadgeManual)
                              }}>
                                {item.source === 'pantry' ? '🏠 Pantry' : `📦 ${(item.category || 'Other').replace(/^(Pantry|Fridge|Freezer)\s*–\s*/, '')}`}
                              </span>
                              <span style={{fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600'}}>
                                {getDescription()}
                              </span>
                              {item.expiryDate && (
                                <span style={{
                                  ...styles.itemBadge,
                                  background: 'rgba(251, 191, 36, 0.1)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(251, 191, 36, 0.2)',
                                }}>
                                  📅 Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={isMobile ? styles.itemRightMobile : styles.itemRight}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            minWidth: '120px'
                          }}>
                            <div style={styles.stockLabel}>QUANTITY</div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <button
                                onClick={() => openQuantityModal(item)}
                                style={{
                                  ...styles.mobileButton,
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                              >
                                -
                              </button>
                              <div 
                                style={{
                                  ...styles.quantityDisplay,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '4rem',
                                  height: '2.5rem',
                                  padding: '0'
                                }}
                                onClick={() => openQuantityModal(item)}
                              >
                                <p style={{...styles.stockValue, margin: 0, lineHeight: '1', fontSize: '1rem'}}>{item.quantity || item.needed || 1}</p>
                                <p style={{...styles.stockUnit, margin: '0.125rem 0 0 0', lineHeight: '1', fontSize: '0.625rem'}}>{item.unit || 'units'}</p>
                              </div>
                              <button
                                onClick={() => openQuantityModal(item)}
                                style={{
                                  ...styles.mobileButton,
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div style={{
                            ...getStatusStyle(),
                            ...styles.statusBadge,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getStatusText()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Price Comparison Section */}
        {activeTab === 'shopping' && showPriceComparison && (
          <div style={{
            ...styles.card,
            marginTop: '1.5rem',
            background: 'linear-gradient(145deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
            border: '1px solid rgba(245,158,11,0.3)'
          }}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  <img src="/grocery icon 2.png" alt="Price Comparison Icon" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Price Comparison & Budget</h2>
                  <p style={{...styles.cardSubtitle, marginTop: '0.1rem'}}>Nanaimo stores: PC Optimum, Costco, Save-On-Foods 💰📊</p>
                </div>
              </div>
            </div>
            
            <div style={{padding: '1.5rem'}}>
              {!priceComparison ? (
                loadingPrices ? (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <img src="/grocery icon 2.png" alt="Loading" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
                    <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '0.5rem'}}>
                      💰 Comparing prices across Nanaimo stores...
                    </p>
                                      <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem'}}>
                    Real-time scraping of PC Express, Costco, and Save-On-Foods websites for live deals!
                  </p>
                  </div>
                ) : (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', marginBottom: '1rem'}}>
                      📊 Ready to compare prices?
                    </p>
                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem'}}>
                      Add items to your shopping list and click "Compare Prices" to find the best deals!
                    </p>
                  </div>
                )
              ) : (
                <div>
                  {/* Weekly Deals (Live data only) */}
                  {priceComparison.deals && priceComparison.deals.length > 0 && (
                    <div style={{
                      background: 'rgba(100,116,139,0.1)',
                      border: '1px solid rgba(100,116,139,0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem'
                    }}>
                      <h3 style={{color: '#64748b', fontSize: '1.2rem', marginBottom: '1rem'}}>
                        🎯 Live Deals from Nanaimo Stores
                      </h3>
                      {priceComparison.scrapingResults && (
                        <div style={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.8rem',
                          marginBottom: '1rem',
                          textAlign: 'center'
                        }}>
                          Scraped: {priceComparison.scrapingResults.pcOptimum} PC • {priceComparison.scrapingResults.costco} Costco • {priceComparison.scrapingResults.saveOnFoods} Save-On
                          {priceComparison.cached && (
                            <span style={{color: '#f59e0b', marginLeft: '10px'}}>
                              📦 Cached ({priceComparison.cacheAge}s ago)
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                      }}>
                        {priceComparison.deals.slice(0, 12).map((deal: any, index: number) => (
                          <div key={index} style={{
                            background: 'rgba(100,116,139,0.15)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(100,116,139,0.2)'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold'}}>
                                {deal.storeName}
                              </div>
                              <div style={{
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))',
                                color: '#ef4444',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>
                                {deal.discount}% OFF
                              </div>
                            </div>
                            <div style={{color: 'rgba(255,255,255,0.9)', fontSize: '1rem', marginBottom: '0.5rem'}}>
                              {deal.title}
                            </div>
                            <div style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: '0.5rem'}}>
                              {deal.description}
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div style={{color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem'}}>
                                ${deal.salePrice}
                                {deal.originalPrice && (
                                  <span style={{
                                    textDecoration: 'line-through',
                                    color: 'rgba(255,255,255,0.5)',
                                    marginLeft: '0.5rem'
                                  }}>
                                    ${deal.originalPrice}
                                  </span>
                                )}
                              </div>
                              <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem'}}>
                                Valid until {new Date(deal.validUntil).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pantry Tab Content */}
        {activeTab === 'pantry' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div 
                  style={styles.cardIcon}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardIconHover)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = styles.cardIcon.boxShadow;
                    e.currentTarget.style.border = styles.cardIcon.border;
                  }}
                >
                  <img src="/grocery icon 2.png" alt="Grocery Icon" style={{
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'contain',
                    borderRadius: '1rem',
                  }} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Secret Stash</h2>
                  <p style={styles.cardSubtitle}>Your culinary arsenal at a glance! 🍴✨</p>
                </div>
              </div>
            </div>
            
            {/* Pantry Category Multi-Select */}
            <div style={{
              padding: '0 0 2rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '2rem'
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1rem' }}>📂</span> Filter by Category
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* All Items toggle */}
                <label key="all" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', borderRadius: '0.875rem',
                  border: '1px solid',
                  borderColor: pantryCategoryFilter.includes('all') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)',
                  background: pantryCategoryFilter.includes('all') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                  color: pantryCategoryFilter.includes('all') ? '#34d399' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input type="checkbox" checked={pantryCategoryFilter.includes('all')} onChange={() => handleCategoryFilterChange('all')} style={{ width: 18, height: 18, accentColor: '#10b981' }} />
                  📦 All Items
                </label>

                {/* Grouped categories */}
                {categoryGroups.map(group => {
                  const allSelected = areAllSubcategoriesSelected(group);
                  const someSelected = areSomeSubcategoriesSelected(group);
                  
                  return (
                  <div key={group.key} style={{ 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: '1rem', 
                    background: 'rgba(255,255,255,0.02)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
                      <CategoryGroupCheckbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={() => handleCategoryGroupToggle(group)}
                      />
                      <button
                        onClick={() => setExpandedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                        style={{
                          flex: 1, textAlign: 'left', padding: '0', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{group.emoji} {group.name}</span>
                        <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>{expandedGroups[group.key] ? '▲' : '▼'}</span>
                      </button>
                    </div>
                    {expandedGroups[group.key] && (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '0.5rem', 
                        padding: '0.5rem 1rem 1rem 2.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {group.sub.map(category => {
                          const labelText = category
                            .replace(/^Fridge\s*–\s*/,'')
                            .replace(/^Pantry\s*–\s*/,'')
                            .replace(/^Freezer\s*–\s*/,'');
                          const isSelected = pantryCategoryFilter.includes(category);
                          return (
                          <label key={category} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                            padding: '0.4rem 0.75rem', borderRadius: '0.75rem', 
                            border: '1px solid',
                            borderColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.5)', 
                            fontSize: '0.75rem', 
                            fontWeight: isSelected ? '600' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}>
                            <input type="checkbox" checked={isSelected} onChange={() => handleCategoryFilterChange(category)} style={{ width: 14, height: 14, accentColor: '#3b82f6' }} />
                            {labelText}
                          </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '2rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1rem' }}>🔄</span> Sort Items
              </div>
              <select
                value={pantrySortBy}
                onChange={(e) => setPantrySortBy(e.target.value as 'name' | 'status-critical' | 'status-good' | 'category')}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.875rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1rem'
                }}
              >
                <option value="name" style={{background: '#1e293b'}}>📝 Name (A-Z)</option>
                <option value="status-critical" style={{background: '#1e293b'}}>🚨 Status (Critical First)</option>
                <option value="status-good" style={{background: '#1e293b'}}>✅ Status (Good First)</option>
                <option value="category" style={{background: '#1e293b'}}>📂 Category</option>
              </select>
            </div>
            
            {/* Main Content - Pantry List Only */}
            <div style={{ minHeight: '600px', paddingTop: '1rem' }}>
                <div style={styles.inventoryList}>
                  {filteredPantryItems.length === 0 ? (
                    <div style={{
                      ...styles.inventoryItem, 
                      textAlign: 'center', 
                      padding: '4rem 2rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderStyle: 'dashed'
                    }}>
                      <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🕵️‍♀️</div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.125rem', fontWeight: '500' }}>
                        {pantryCategoryFilter.length === 0
                          ? "No filters selected - select categories to view items"
                          : pantryCategoryFilter.includes('all') 
                            ? "Laurie's stash is suspiciously empty... Time for a 'Snack Attack'!"
                            : "No items found in the selected categories."
                        }
                      </p>
                    </div>
                  ) : (
                    filteredPantryItems.map((item, index) => {
                      const getStatusStyle = () => {
                        if (item.currentCount === 0) return styles.statusOut;
                        if (item.currentCount < item.minCount) return styles.statusLow;
                        return styles.statusGood;
                      };
                      
                      const getStatusText = () => {
                        if (item.currentCount === 0) return 'Out';
                        if (item.currentCount < item.minCount) return 'Low';
                        return 'Okay';
                      };
                      
                      const getItemIcon = () => {
                        const emoji = getCategoryEmoji(item.category || 'other');
                        return <span style={{fontSize: '1.5rem'}}>{emoji}</span>;
                      };
                      
                      const statusColor = item.currentCount === 0 ? '#ef4444' : 
                                         item.currentCount < item.minCount ? '#f59e0b' : '#10b981';
                      
                      return (
                        <div key={item.id || index} style={{
                          ...styles.inventoryItem,
                          borderLeftColor: statusColor
                        }}>
                          <div style={styles.itemContent}>
                            <div style={styles.itemLeft}>
                              <div style={styles.itemIcon}>
                                {getItemIcon()}
                              </div>
                              <div style={styles.itemDetails}>
                                <h3 style={styles.itemName}>{item.name}</h3>
                                <div style={styles.itemCategory}>
                                  <span style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                  }}>
                                    📦 {item.category.replace(/^(Pantry|Fridge|Freezer)\s*–\s*/, '')}
                                  </span>
                                  {editingExpiry === item.id ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                      <input
                                        type="date"
                                        value={newExpiryDate}
                                        onChange={(e) => setNewExpiryDate(e.target.value)}
                                        style={{
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '0.5rem',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          background: 'rgba(15, 23, 42, 0.6)',
                                          color: 'white',
                                          fontSize: '0.75rem'
                                        }}
                                      />
                                      <button
                                        onClick={() => handleExpiryDateUpdate(item.id, newExpiryDate)}
                                        style={{
                                          width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', border: 'none',
                                          background: '#10b981', color: 'white', fontSize: '0.75rem', cursor: 'pointer'
                                        }}
                                      >✓</button>
                                      <button
                                        onClick={() => { setEditingExpiry(null); setNewExpiryDate(''); }}
                                        style={{
                                          width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', border: 'none',
                                          background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.75rem', cursor: 'pointer'
                                        }}
                                      >✕</button>
                                    </div>
                                  ) : (
                                    <span 
                                      onClick={() => {
                                        setEditingExpiry(item.id);
                                        setNewExpiryDate(item.expiryDate || '');
                                      }}
                                      style={{
                                        color: item.expiryDate ? (
                                          new Date(item.expiryDate) < new Date() ? '#f87171' :
                                          new Date(item.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? '#fbbf24' :
                                          '#4ade80'
                                        ) : 'rgba(255, 255, 255, 0.3)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                    >
                                      📅 {item.expiryDate ? (
                                        new Date(item.expiryDate) < new Date() ? 'Expired' :
                                        new Date(item.expiryDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'Expires Soon' :
                                        new Date(item.expiryDate).toLocaleDateString()
                                      ) : 'Set Expiry'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div style={isMobile ? styles.itemRightMobile : styles.itemRight}>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                minWidth: '120px'
                              }}>
                                <div style={styles.stockLabel}>
                                  STOCK: {formatStockDisplay(item.currentCount, item.minCount)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => {
                                      const decrement = item.currentCount <= 1 ? 0.25 : 1;
                                      const newValue = Math.max(0, item.currentCount - decrement);
                                      updateItemQuantity(item.id, Math.round(newValue * 100) / 100, false);
                                    }}
                                    style={{
                                      ...styles.mobileButton,
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: '#f87171',
                                      border: '1px solid rgba(239, 68, 68, 0.2)'
                                    }}
                                  >−</button>
                                  
                                  <button
                                    onClick={() => {
                                      setEditingItem({...item, source: 'pantry', quantity: item.currentCount} as any);
                                      setShowQuantityModal(true);
                                    }}
                                    style={styles.quantityDisplay}
                                  >
                                    <QuantityDisplay quantity={item.currentCount} />
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '0.25rem' }}>
                                      {item.unit}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      const increment = item.currentCount < 1 ? 0.25 : 1;
                                      updateItemQuantity(item.id, item.currentCount + increment, false);
                                    }}
                                    style={{
                                      ...styles.mobileButton,
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: '#4ade80',
                                      border: '1px solid rgba(16, 185, 129, 0.2)'
                                    }}
                                  >+</button>
                                </div>
                              </div>
                              
                              <div style={{
                                ...getStatusStyle(),
                                ...styles.statusBadge
                              }}>
                                {getStatusText()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Item Modals */}
      <LootListModal />
      <PantryModal />
      <PantryReviewModal />

      {/* Quantity Edit Modal */}
      {showQuantityModal && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(32px)',
            borderRadius: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '3rem',
            width: '95%',
            maxWidth: '400px',
            boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <h2 style={{
              color: 'white', 
              marginBottom: '2rem', 
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontSize: '1.75rem',
              fontWeight: '800',
              textAlign: 'center',
              letterSpacing: '-0.02em'
            }}>
              Edit Quantity 🔢
            </h2>
            
            <div style={{marginBottom: '2rem'}}>
              <label style={{
                color: 'rgba(255, 255, 255, 0.4)', 
                fontSize: '0.75rem', 
                marginBottom: '0.75rem', 
                display: 'block',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Adjust Current Stock:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '1.25rem',
                padding: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                <button
                  onClick={() => setEditingItem({...editingItem, currentCount: Math.max(0, (editingItem.currentCount || 0) - 0.25)})}
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '1rem',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >−</button>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={editingItem.currentCount}
                  onChange={(e) => setEditingItem({...editingItem, currentCount: parseFloat(e.target.value) || 0})}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => setEditingItem({...editingItem, currentCount: (editingItem.currentCount || 0) + 0.25})}
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '1rem',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >+</button>
              </div>
            </div>

            <div style={{display: 'flex', gap: '1rem'}}>
              <button
                onClick={() => setShowQuantityModal(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateItemQuantity(editingItem.id, editingItem.currentCount || 0, false);
                  setShowQuantityModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weeks List Modal */}
      {showWeeksListBox && (
        <WeeksListBox 
          pantryItems={pantryItems}
          onClose={() => setShowWeeksListBox(false)} 
        />
      )}

      {/* Photo Analysis Modal */}
      {showPhotoAnalysis && (
        <PhotoAnalyzerModal />
      )}

      {/* App styles */}
      <style>{`
        .mobile-hidden {
          display: block;
        }
        
        .button-max-width {
          max-width: 120px !important;
        }
        
        @media (min-width: 1280px) {
          .grid-xl {
            grid-template-columns: 3fr 2fr;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
