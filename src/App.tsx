import React, { useState, useEffect } from 'react';
import { WeeksListBox } from './components/WeeksListBox';

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
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("/kitchen scene 1.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative' as const,
    overflow: 'hidden',
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
    width: '20rem',
    height: '20rem',
    background: 'radial-gradient(circle, rgba(251,146,60,0.2) 0%, rgba(236,72,153,0.2) 100%)',
    borderRadius: '50%',
    filter: 'blur(3rem)',
    animation: 'pulse 3s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute' as const,
    bottom: '-10rem',
    left: '-10rem',
    width: '20rem',
    height: '20rem',
    background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, rgba(59,130,246,0.2) 100%)',
    borderRadius: '50%',
    filter: 'blur(3rem)',
    animation: 'pulse 3s ease-in-out infinite 1s',
  },
  header: {
    position: 'sticky' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    top: 0,
    zIndex: 50,
  },
  headerContent: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoIcon: {
    width: '4rem',
    height: '4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, white, #fed7aa, #fecaca)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    fontFamily: "'Fredoka', system-ui, sans-serif",
    margin: '0',
    lineHeight: '1.2',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    margin: '0',
    marginTop: '0.125rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  quickAddBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, rgba(16,185,129,0.7), rgba(5,150,105,0.7))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  },
  spreadsheetBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, rgba(75,85,99,0.8), rgba(55,65,81,0.9))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  },
  weeksListBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, rgba(59,130,246,0.8), rgba(37,99,235,0.9))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.25rem',
  },
  btnIcon: {
    fontSize: '0.75rem',
    marginBottom: '0.25rem',
  },
  btnText: {
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  main: {
    position: 'relative' as const,
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem',
    zIndex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2rem',
  },
  gridLarge: {
    '@media (min-width: 1280px)': {
      gridTemplateColumns: '3fr 2fr',
    },
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  cardIcon: {
    width: '4rem',
    height: '4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
  },
  cardTitleText: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    fontFamily: "'Fredoka', system-ui, sans-serif",
    margin: 0,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
    margin: 0,
    marginTop: '0.05rem',
  },
  addBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, rgba(120,120,120,0.4), rgba(140,140,140,0.3))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  },
  pantryBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, rgba(100,116,139,0.4), rgba(71,85,105,0.3))',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  inventoryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  inventoryItem: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
    backdropFilter: 'blur(15px)',
    borderRadius: '1.25rem',
    padding: '1.25rem',
    border: '1px solid rgba(255,255,255,0.15)',
    borderLeft: '4px solid rgba(59,130,246,0.6)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative' as const,
  },
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  itemIcon: {
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))',
    borderRadius: '0.75rem',
    border: '1px solid rgba(59,130,246,0.3)',
    boxShadow: '0 4px 12px rgba(59,130,246,0.15)',
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  itemName: {
    color: 'white',
    fontWeight: '700',
    fontSize: '1.25rem',
    margin: 0,
    marginBottom: '0.25rem',
    lineHeight: '1.3',
  },
  itemCategory: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.875rem',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    justifyContent: 'flex-end',
  },
  itemRightMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '1rem',
  },
  mobileButton: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  stockInfo: {
    textAlign: 'center' as const,
  },
  stockLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
    marginBottom: '0.25rem',
  },
  stockValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  stockUnit: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.75rem',
  },
  statusBadge: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    minWidth: '90px',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
  },
  statusLow: {
    background: 'linear-gradient(to right, rgba(234,179,8,0.7), rgba(249,115,22,0.7))',
  },
  statusOut: {
    background: 'linear-gradient(to right, rgba(239,68,68,0.7), rgba(236,72,153,0.7))',
    animation: 'pulse 2s ease-in-out infinite',
  },
  statusGood: {
    background: 'linear-gradient(to right, rgba(16,185,129,0.7), rgba(5,150,105,0.7))',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  sidebarCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  sidebarIcon: {
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
  },
  sidebarTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    fontFamily: "'Fredoka', system-ui, sans-serif",
  },
  sidebarSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
  },
  filterContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  filterButton: {
    padding: '1rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    minWidth: '90px',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
  },
  filterActive: {
    background: 'linear-gradient(to right, rgba(16,185,129,0.7), rgba(5,150,105,0.7))',
  },
  filterInactive: {
    background: 'rgba(255,255,255,0.1)',
  },
  quickStatsCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(59, 130, 246, 0.4))',
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
  },
  quickStatCard: {
    textAlign: 'center' as const,
    padding: '1rem',
  },
  quickStatValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: '0.5rem 0',
    fontFamily: "'Fredoka', system-ui, sans-serif",
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.875rem',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: '1rem',
    padding: '0.5rem',
    marginBottom: '2rem',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  tab: {
    flex: 1,
    padding: '1rem 2rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Fredoka', system-ui, sans-serif",
  },
  tabShopping: {
    background: 'rgba(251, 146, 60, 0.1)',
    borderLeft: '3px solid #fb923c',
  },
  tabShoppingHover: {
    background: 'rgba(251, 146, 60, 0.2)',
    color: 'rgba(255,255,255,0.8)',
    transform: 'translateY(-1px)',
  },
  tabShoppingActive: {
    background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(236, 72, 153, 0.2))',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(251, 146, 60, 0.3)',
    borderLeft: '3px solid #fb923c',
  },
  tabPantry: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderLeft: '3px solid #10b981',
  },
  tabPantryHover: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: 'rgba(255,255,255,0.8)',
    transform: 'translateY(-1px)',
  },
  tabPantryActive: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.2))',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
    borderLeft: '3px solid #10b981',
  },
  tabRecipes: {
    background: 'rgba(168, 85, 247, 0.1)',
    borderLeft: '3px solid #a855f7',
  },
  tabRecipesHover: {
    background: 'rgba(168, 85, 247, 0.2)',
    color: 'rgba(255,255,255,0.8)',
    transform: 'translateY(-1px)',
  },
  tabRecipesActive: {
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2))',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.3)',
    borderLeft: '3px solid #a855f7',
  },
  // Bulk Add Modal Styles
  bulkTextarea: {
    width: '100%',
    padding: '1rem',
    borderRadius: '1rem',
    border: '2px solid rgba(255,215,0,0.4)',
    backgroundColor: 'rgba(139,69,19,0.8)',
    color: '#ffd700',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    resize: 'vertical' as const,
    minHeight: '200px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
  },
  bulkLabel: {
    color: '#ffd700',
    fontSize: '1rem',
    marginBottom: '0.75rem',
    display: 'block',
    fontWeight: 'bold',
    textAlign: 'center' as const,
  },
  bulkHelp: {
    background: 'rgba(0,0,0,0.2)',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255,215,0,0.2)',
  },
  bulkButton: {
    flex: '1 1 0',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    minWidth: '0',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  // Item source badges
  itemBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  itemBadgeSource: {
    background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.3))',
    color: 'rgba(34,197,94,1)',
    border: '1px solid rgba(34,197,94,0.4)',
  },
  itemBadgeManual: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.3))',
    color: 'rgba(59,130,246,1)',
    border: '1px solid rgba(59,130,246,0.4)',
  },
  quantityDisplay: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    minWidth: '4rem',
    textAlign: 'center' as const,
  },
};

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

  // When sorting by category, aggregate by category totals for the bar view
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => b.totalStock - a.totalStock);
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
      return Math.max(...categories.map(c => c.totalStock));
    }
    return 10;
  };

  const maxValue = getMaxValue();

  const getValue = (item: any) => {
    if (sortBy === 'stock') return item.currentCount;
    if (sortBy === 'ratio') return item.minCount > 0 ? item.currentCount / item.minCount : item.currentCount;
    if (sortBy === 'category') return item.totalStock || 0;
    return item.currentCount;
  };

  const getValueLabel = (item: any) => {
    if (sortBy === 'stock') return `${item.currentCount} ${item.unit}`;
    if (sortBy === 'ratio') return `${(getValue(item)).toFixed(1)}x`;
    if (sortBy === 'category') return `${item.totalStock} total`;
    return `${item.currentCount} ${item.unit}`;
  };

  if (pantryItems.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        background: 'rgba(30,58,138,0.3)',
        borderRadius: '1rem',
        border: '1px solid rgba(59,130,246,0.3)',
        textAlign: 'center'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>📊 Pantry Analytics</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Add items to your pantry to see analytics</p>
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
        background: 'rgba(30,58,138,0.3)',
        borderRadius: '1rem',
        border: '1px solid rgba(59,130,246,0.3)',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>📊 Pantry Analytics</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'stock' | 'category' | 'ratio')}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(59,130,246,0.4)',
              background: 'rgba(30,58,138,0.6)',
              color: 'white',
              fontSize: '0.875rem'
            }}
          >
            <option value="stock">Sort by Stock Count</option>
            <option value="ratio">Sort by Stock Ratio</option>
            <option value="category">Sort by Category</option>
          </select>
          
          <button
            onClick={() => setShowHighest(!showHighest)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: showHighest 
                ? 'linear-gradient(to right, rgba(34,197,94,0.6), rgba(22,163,74,0.6))'
                : 'linear-gradient(to right, rgba(239,68,68,0.6), rgba(220,38,38,0.6))',
              color: 'white',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            {showHighest ? '📈 Highest' : '📉 Lowest'}
          </button>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{
        background: 'rgba(30,58,138,0.3)',
        borderRadius: '1rem',
        border: '1px solid rgba(59,130,246,0.3)',
        padding: '1.5rem',
        flex: 1
      }}>
        <h4 style={{ 
          color: 'white', 
          marginBottom: '1rem',
          fontSize: '1rem'
        }}>
          {showHighest ? 'Top 5' : 'Bottom 5'} {sortBy === 'category' ? 'Categories' : 'Items'}
          {sortBy === 'ratio' ? ' (by Stock Ratio)' : sortBy === 'stock' ? ' (by Count)' : ''}
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dataToShow.map((item: any, index: number) => {
            const value = getValue(item);
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={item.id || index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{ 
                  width: '120px', 
                  fontSize: '0.875rem', 
                  color: 'white',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {item.name}
                </div>
                <div style={{ 
                  flex: 1, 
                  background: 'rgba(71,85,105,0.3)', 
                  borderRadius: '0.25rem',
                  height: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: sortBy === 'category'
                      ? 'linear-gradient(to right, rgba(168,85,247,0.8), rgba(139,92,246,0.8))'
                      : value < (item.minCount || 1)
                        ? 'linear-gradient(to right, rgba(239,68,68,0.8), rgba(220,38,38,0.8))'
                        : 'linear-gradient(to right, rgba(34,197,94,0.8), rgba(22,163,74,0.8))',
                    height: '100%',
                    width: `${Math.max(5, percentage)}%`,
                    borderRadius: '0.25rem',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  width: '60px', 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.8)',
                  textAlign: 'right'
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
          background: 'rgba(30,58,138,0.3)',
          borderRadius: '1rem',
          border: '1px solid rgba(59,130,246,0.3)',
          padding: '1.5rem'
        }}>
          <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1rem' }}>📂 Categories Overview</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
            {categories.slice(0, 4).map((category, index) => (
              <div key={index} style={{
                background: 'rgba(71,85,105,0.3)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  {category.name}
                </div>
                <div style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>
                  {category.count} items
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  {category.totalStock} total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
  const [showPantryReviewModal, setShowPantryReviewModal] = useState(false);
  const [reviewItems, setReviewItems] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [pantryCategoryFilter, setPantryCategoryFilter] = useState<string[]>(['all']);
  const [showWeeksListBox, setShowWeeksListBox] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [pantryBulkMode, setPantryBulkMode] = useState(false);
  const [pantryBulkText, setPantryBulkText] = useState('');

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
        'CHOCOLATE'
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
        'Freezer',
        'Meat'
      ]
    }
  ] as const;

  // Flattened list for filtering logic
  const pantryCategories = ['all', ...categoryGroups.flatMap(g => g.sub)];
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filter pantry items by selected categories
  const filteredPantryItems = pantryCategoryFilter.includes('all') 
    ? pantryItems 
    : pantryItems.filter(item => pantryCategoryFilter.includes(item.category));

  // Handle category filter checkbox changes
  const handleCategoryFilterChange = (category: string) => {
    if (category === 'all') {
      // If "All" is selected, clear other selections
      setPantryCategoryFilter(['all']);
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
          background: 'linear-gradient(135deg, rgba(139,69,19,0.95) 0%, rgba(184,134,11,0.95) 25%, rgba(217,119,6,0.95) 75%, rgba(120,53,15,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '2rem',
          border: '3px solid rgba(255,215,0,0.6)',
          padding: '2.5rem',
          width: '90%',
          maxWidth: '650px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
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
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffd700',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'}
          >
            ×
          </button>
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
            padding: '0.5rem 1.5rem',
            borderRadius: '1rem',
            border: '2px solid rgba(255,215,0,0.8)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: '#8b4513',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            SHOPPING LIST
          </div>
          
          <h2 style={{
            color: '#ffd700', 
            marginBottom: '2rem', 
            marginTop: '1rem',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '1.8rem',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            ✨ Add New Item to List
          </h2>
          
          {/* Toggle between Single and Bulk mode */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '1rem',
            padding: '0.5rem',
            border: '1px solid rgba(255,215,0,0.3)'
          }}>
            <button
              type="button"
              onClick={() => setBulkMode(false)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: !bulkMode ? 'rgba(255,215,0,0.3)' : 'transparent',
                color: '#ffd700',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📝 Single Add
            </button>
            <button
              type="button"
              onClick={() => setBulkMode(true)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: bulkMode ? 'rgba(255,215,0,0.3)' : 'transparent',
                color: '#ffd700',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
                  padding: '1.2rem',
                  borderRadius: '1rem',
                  border: '2px solid rgba(255,215,0,0.4)',
                  backgroundColor: 'rgba(139,69,19,0.8)',
                  color: '#ffd700',
                  fontSize: '1rem',
                  fontWeight: '500',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              />
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(255,215,0,0.4)',
                    backgroundColor: 'rgba(139,69,19,0.8)',
                    color: '#ffd700',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  <option value="" disabled style={{backgroundColor: 'rgba(139,69,19,0.9)', color: '#ffd700'}}>📂 Select Category</option>
                  {pantryCategories.filter(cat => cat !== 'all').map((category) => (
                    <option key={category} value={category} style={{backgroundColor: 'rgba(139,69,19,0.9)', color: '#ffd700'}}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="📦 Unit (pieces, bags)"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(255,215,0,0.4)',
                    backgroundColor: 'rgba(139,69,19,0.8)',
                    color: '#ffd700',
                    width: '100%'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{color: '#ffd700', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    📊 Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 1})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(255,215,0,0.4)',
                      backgroundColor: 'rgba(139,69,19,0.8)',
                      color: '#ffd700',
                      width: '100%'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: '#ffd700', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    📈 Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as 'High' | 'Medium' | 'Low'})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(255,215,0,0.4)',
                      backgroundColor: 'rgba(139,69,19,0.8)',
                      color: '#ffd700',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>
              
              <textarea
                placeholder="📝 Notes... (any special instructions or preferences?)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '2px solid rgba(255,215,0,0.4)',
                  backgroundColor: 'rgba(139,69,19,0.8)',
                  color: '#ffd700',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
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
                  flex: '1 1 0',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '2px solid rgba(255,215,0,0.4)',
                  backgroundColor: 'rgba(139,69,19,0.8)',
                  color: '#ffd700',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  minWidth: '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ❌ Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: '1 1 0',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(to right, #ffd700, #ffed4e)',
                  color: '#8b4513',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  minWidth: '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ✅ Add to List
              </button>
            </div>
          </form>
          ) : (
            /* Bulk Add Mode */
            <div style={{display: 'grid', gap: '1.5rem'}}>
              <div>
                <label style={styles.bulkLabel}>
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
                  style={styles.bulkTextarea}
                />
              </div>
              
              <div style={styles.bulkHelp}>
                <p style={{
                  color: '#ffd700',
                  fontSize: '0.8rem',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 'bold'
                }}>
                  📝 Supported formats:
                </p>
                <ul style={{
                  color: 'rgba(255,215,0,0.8)',
                  fontSize: '0.75rem',
                  margin: 0,
                  paddingLeft: '1.2rem'
                }}>
                  <li>"2 lbs apples" or "3 bottles water"</li>
                  <li>"apples, 2 lbs" or "water - 3 bottles"</li>
                  <li>"bread" (defaults to 1 piece)</li>
                </ul>
                <p style={{
                  color: 'rgba(255,215,0,0.7)',
                  fontSize: '0.7rem',
                  margin: '0.5rem 0 0 0',
                  fontStyle: 'italic'
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
                    border: '2px solid rgba(255,215,0,0.4)',
                    backgroundColor: 'rgba(139,69,19,0.8)',
                    color: '#ffd700',
                  }}
                >
                  ❌ Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={!bulkText.trim()}
                  style={{
                    ...styles.bulkButton,
                    background: bulkText.trim() 
                      ? 'linear-gradient(45deg, #ffd700, #ffed4e)'
                      : 'rgba(100,100,100,0.5)',
                    color: bulkText.trim() ? '#8b4513' : '#666',
                    cursor: bulkText.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: bulkText.trim() ? '0 4px 8px rgba(255,215,0,0.3)' : 'none'
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
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #1d4ed8 75%, #1e3a8a 100%)',
          backdropFilter: 'blur(25px)',
          borderRadius: '2rem',
          border: '2px solid rgba(59, 130, 246, 0.4)',
          padding: '2.5rem',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 25px 50px -12px rgba(30, 58, 138, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
          {/* Close X button */}
          <button
            onClick={() => setShowAddModal(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
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
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'}
          >
            ×
          </button>
          
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(45deg, #60a5fa, #3b82f6)',
            padding: '0.7rem 2rem',
            borderRadius: '1.5rem',
            border: '2px solid rgba(59, 130, 246, 0.6)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 8px 16px rgba(30, 58, 138, 0.3)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            PANTRY INVENTORY
          </div>
          
          <h2 style={{
            color: '#bfdbfe', 
            marginBottom: '1rem', 
            marginTop: '1.5rem',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '1.9rem',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
          }}>
            🏠 Add to Pantry Inventory
          </h2>
          
          {/* Toggle buttons for single vs bulk mode */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            backgroundColor: 'rgba(30, 58, 138, 0.4)',
            borderRadius: '0.75rem',
            padding: '0.25rem'
          }}>
            <button
              type="button"
              onClick={() => setPantryBulkMode(false)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: !pantryBulkMode ? 'rgba(59, 130, 246, 0.8)' : 'transparent',
                color: !pantryBulkMode ? '#ffffff' : '#bfdbfe'
              }}
            >
              Single Item
            </button>
            <button
              type="button"
              onClick={() => setPantryBulkMode(true)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: pantryBulkMode ? 'rgba(59, 130, 246, 0.8)' : 'transparent',
                color: pantryBulkMode ? '#ffffff' : '#bfdbfe'
              }}
            >
              Bulk Add
            </button>
          </div>
          
          {!pantryBulkMode ? (
            <form onSubmit={handleSubmit}>
              <div style={{display: 'grid', gap: '1rem'}}>
                <input
                  type="text"
                  placeholder="What would you like to add to your pantry? (e.g., Extra Virgin Olive Oil)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{
                  padding: '1.2rem',
                  borderRadius: '1rem',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  backgroundColor: 'rgba(30, 58, 138, 0.6)',
                  color: '#bfdbfe',
                  fontSize: '1rem',
                  fontWeight: '500',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                }}
              />
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'rgba(30, 58, 138, 0.6)',
                    color: '#bfdbfe',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  <option value="" disabled style={{backgroundColor: 'rgba(30, 58, 138, 0.8)', color: '#bfdbfe'}}>🎪 Select Category</option>
                  {pantryCategories.filter(cat => cat !== 'all').map((category) => (
                    <option key={category} value={category} style={{backgroundColor: 'rgba(30, 58, 138, 0.8)', color: '#bfdbfe'}}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="📦 Unit (jars, bottles, cups)"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'rgba(30, 58, 138, 0.6)',
                    color: '#bfdbfe',
                    width: '100%'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    📦 Quantity Added
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.currentCount}
                    onChange={(e) => setFormData({...formData, currentCount: parseFloat(e.target.value) || 0})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(59, 130, 246, 0.4)',
                      backgroundColor: 'rgba(30, 58, 138, 0.6)',
                      color: '#bfdbfe',
                      width: '100%'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    ⚠️ Min Needed
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minCount}
                    onChange={(e) => setFormData({...formData, minCount: parseFloat(e.target.value) || 1})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(59, 130, 246, 0.4)',
                      backgroundColor: 'rgba(30, 58, 138, 0.6)',
                      color: '#bfdbfe',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <textarea
                  placeholder="📝 Storage notes... (special instructions or cooking tips)"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'rgba(30, 58, 138, 0.6)',
                    color: '#bfdbfe',
                    resize: 'none',
                    fontFamily: 'inherit',
                    width: '100%'
                  }}
                />
                <div>
                  <label style={{color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    📅 Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '2px solid rgba(59, 130, 246, 0.4)',
                      backgroundColor: 'rgba(30, 58, 138, 0.6)',
                      color: '#bfdbfe',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex', 
              gap: '1rem', 
              marginTop: '1.5rem', 
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: '1 1 0',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  backgroundColor: 'rgba(30, 58, 138, 0.6)',
                  color: '#bfdbfe',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  minWidth: '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ❌ Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: '1 1 0',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(30, 58, 138, 0.3)',
                  minWidth: '0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                ✅ Add to Pantry
              </button>
            </div>
          </form>
          ) : (
            <div>
              <label style={styles.bulkLabel}>
                📝 Paste your pantry list (one item per line)
              </label>
              <textarea
                value={pantryBulkText}
                onChange={(e) => setPantryBulkText(e.target.value)}
                placeholder="Rice, 5 cups, 2 cups&#10;Pasta - 3 boxes&#10;Olive Oil, 2 bottles, 1 bottle&#10;Salt&#10;Black Pepper, 1 container, min 1"
                style={styles.bulkTextarea}
                rows={8}
              />
              
              <div style={styles.bulkHelp}>
                💡 <strong>Format examples:</strong><br/>
                • Item name, current amount, minimum needed<br/>
                • Item name - current amount<br/>
                • Just item name (will set defaults)<br/>
                • Add expiry dates with "expires YYYY-MM-DD"
              </div>
              
              <button
                type="button"
                onClick={handleBulkPantrySubmit}
                style={styles.bulkButton}
                disabled={!pantryBulkText.trim()}
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(5,150,105,0.95) 25%, rgba(4,120,87,0.95) 75%, rgba(6,78,59,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '2rem',
          border: '3px solid rgba(16,185,129,0.6)',
          padding: '2rem',
          width: '95%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
          {/* Header */}
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
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={addImpulseItem}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(to right, rgba(251,146,60,0.6), rgba(236,72,153,0.6))',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0px)')}
            >
              ➕ Item (Impulse Buy!)
            </button>
          </div>

          {/* Items List */}
          <div style={{
            maxHeight: '50vh',
            overflowY: 'auto',
            marginBottom: '2rem',
            paddingRight: '0.5rem'
          }}>
            {reviewItems.map((item, index) => (
              <div key={item.id || index} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1rem',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flex: 1
                }}>
                  <img src="/grocery icon 1.png" alt="Item Icon" style={{width: '32px', height: '32px', objectFit: 'contain'}} />
                  <div>
                    <h3 style={{
                      color: 'white',
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      {item.name}
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.7)',
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.9rem'
                    }}>
                      {item.category} • {item.unit || 'units'}
                      {item.expiryDate && (
                        <span style={{
                          color: '#fbbf24',
                          fontWeight: 'bold',
                          marginLeft: '0.5rem'
                        }}>
                          • Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem'
                  }}>
                    <button
                      onClick={() => updateReviewItemQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'linear-gradient(to right, rgba(239,68,68,0.6), rgba(220,38,38,0.7))',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      -
                    </button>
                    <span style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      minWidth: '2.5rem',
                      textAlign: 'center'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateReviewItemQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'linear-gradient(to right, rgba(34,197,94,0.6), rgba(22,163,74,0.7))',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    onClick={() => removeReviewItem(item.id)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(239,68,68,0.5)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
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
            paddingTop: '1rem',
            borderTop: '2px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.9rem'
            }}>
              {reviewItems.filter(item => item.quantity > 0).length} items ready to add
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowPantryReviewModal(false);
                  setReviewItems([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addItemsToPantry}
                disabled={reviewItems.filter(item => item.quantity > 0).length === 0}
                style={{
                  padding: '0.75rem 2rem',
                  background: reviewItems.filter(item => item.quantity > 0).length > 0 
                    ? 'linear-gradient(to right, #22c55e, #16a34a)' 
                    : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: reviewItems.filter(item => item.quantity > 0).length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  opacity: reviewItems.filter(item => item.quantity > 0).length > 0 ? 1 : 0.5
                }}
              >
                Add {reviewItems.filter(item => item.quantity > 0).length} to Pantry
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '2rem',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}>
          <h2 style={{color: 'white', marginBottom: '1.5rem', fontFamily: "'Fredoka', system-ui, sans-serif"}}>
            📸 Photo Analysis Results
          </h2>
          
          {detectedItems.length > 0 ? (
            <>
              <p style={{color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'}}>
                We detected {detectedItems.length} items in your photo. Review and add them to your pantry:
              </p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
                {detectedItems.map((item, index) => (
                  <div key={index} style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h4 style={{color: 'white', margin: '0 0 0.5rem 0', fontSize: '1.1rem'}}>{item.name}</h4>
                        <p style={{color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.875rem'}}>
                          {item.category} • {item.estimatedCount} {item.unit} • {Math.round(item.confidence * 100)}% confidence
                        </p>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        background: `linear-gradient(to right, ${
                          item.confidence > 0.8 ? '#10b981, #059669' : 
                          item.confidence > 0.6 ? '#eab308, #f97316' : 
                          '#ef4444, #ec4899'
                        })`,
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {Math.round(item.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
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
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => addDetectedItems(detectedItems)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: 'linear-gradient(to right, rgba(16,185,129,0.7), rgba(5,150,105,0.7))',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Add All Items
                </button>
              </div>
            </>
          ) : (
            <p style={{color: 'rgba(255,255,255,0.7)'}}>No items detected in the photo.</p>
          )}
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
              <img src="/grocery scene 1.png" alt="Grocery Scene" style={{width: '90px', height: '90px', objectFit: 'contain'}} />
            </div>
            <div style={{paddingLeft: '1.5rem'}}>
              <h1 style={styles.title}>Laurie's Legendary Kitchen</h1>
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
            <div style={styles.quickStatCard}>
              <div style={styles.quickStatValue}>{pantryItems.length}</div>
              <div style={styles.quickStatLabel}>In Pantry</div>
            </div>
            <div style={styles.quickStatCard}>
              <div style={{...styles.quickStatValue, color: '#fbbf24'}}>
                {pantryItems.filter(item => item.currentCount < item.minCount).length}
              </div>
              <div style={styles.quickStatLabel}>Running Low</div>
            </div>
            <div style={styles.quickStatCard}>
              <div style={{...styles.quickStatValue, color: '#f87171'}}>
                {pantryItems.filter(item => item.currentCount < item.minCount).length}
              </div>
              <div style={styles.quickStatLabel}>Items below minimum</div>
            </div>
            <div style={styles.quickStatCard}>
              <div style={{...styles.quickStatValue, color: '#6ee7b7'}}>{shoppingList.length}</div>
              <div style={styles.quickStatLabel}>Need to Buy</div>
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
                : hoveredTab === 'shopping' 
                ? styles.tabShoppingHover 
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
                : hoveredTab === 'pantry' 
                ? styles.tabPantryHover 
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

        {/* Tab Content */}
        {activeTab === 'shopping' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  <img src="/grocery icon 1.png" alt="Grocery Icon" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Loot List</h2>
                  <p style={{...styles.cardSubtitle, marginTop: '0.1rem'}}>Adventures awaiting in the grocery jungle! 🛒✨</p>
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
                  <img src="/grocery icon 1.png" alt="Add Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                  Add Treasure!
                </button>
                {shoppingList.length > 0 && (
                  <button 
                    style={styles.pantryBtn}
                    onClick={() => {
                      setReviewItems([...shoppingList]);
                      setShowPantryReviewModal(true);
                    }}
                  >
                    <img src="/grocery icon 2.png" alt="Pantry Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                    Add All to Pantry
                  </button>
                )}
              </div>
            </div>
            
            <div style={styles.inventoryList}>
              {shoppingList.length === 0 ? (
                <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                  <img src="/grocery icon 1.png" alt="Grocery Icon" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem'}}>
                    🎉 Laurie's all set! The snack gods are pleased! ✨
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
                  
                  return (
                    <div key={item.id || index} style={styles.inventoryItem}>
                      <div style={styles.itemContent}>
                        <div style={styles.itemLeft}>
                          <div style={styles.itemIcon}>
                            {getItemIcon()}
                          </div>
                          <div style={styles.itemDetails}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <div style={styles.itemCategory}>
                              <span style={{fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)'}}>
                                {getDescription()}
                              </span>
                              <span style={{
                                ...styles.itemBadge,
                                ...(item.source === 'pantry' ? styles.itemBadgeSource : styles.itemBadgeManual)
                              }}>
                                {item.source === 'pantry' ? '🏠 Pantry' : '✋ Manual'}
                              </span>
                              {item.expiryDate && (
                                <span style={{
                                  ...styles.itemBadge,
                                  background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.3))',
                                  color: 'rgba(251,191,36,1)',
                                  border: '1px solid rgba(251,191,36,0.4)',
                                }}>
                                  📅 Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={isMobile ? styles.itemRightMobile : styles.itemRight}>
                          <div style={styles.stockInfo}>
                            <p style={styles.stockLabel}>Quantity</p>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <button
                                onClick={() => openQuantityModal(item)}
                                style={{
                                  ...(isMobile ? styles.mobileButton : {
                                    width: '2.2rem',
                                    height: '2.2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }),
                                  background: 'linear-gradient(to right, rgba(239,68,68,0.4), rgba(220,38,38,0.5))'
                                }}
                              >
                                -
                              </button>
                              <div 
                                style={{
                                  textAlign: 'center', 
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '3rem',
                                  height: '2.2rem',
                                  padding: '0.25rem 0'
                                }}
                                onClick={() => openQuantityModal(item)}
                              >
                                <p style={{...styles.stockValue, margin: 0, lineHeight: '1', fontSize: '1.1rem'}}>{(item.quantity || item.needed || 1) + ' ' + (item.unit || '')}</p>
                                <p style={{...styles.stockUnit, margin: 0, lineHeight: '1', fontSize: '0.65rem'}}>click to edit</p>
                              </div>
                              <button
                                onClick={() => openQuantityModal(item)}
                                style={{
                                  ...(isMobile ? styles.mobileButton : {
                                    width: '2.2rem',
                                    height: '2.2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }),
                                  background: 'linear-gradient(to right, rgba(34,197,94,0.4), rgba(22,163,74,0.5))'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div style={{
                            ...styles.statusBadge, 
                            ...getStatusStyle(),
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

        {/* Pantry Tab Content */}
        {activeTab === 'pantry' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  <img src="/grocery icon 2.png" alt="Grocery Icon" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Secret Stash</h2>
                  <p style={{...styles.cardSubtitle, marginTop: '0.1rem'}}>The mysterious depths of the kitchen kingdom! 👑</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  style={styles.addBtn}
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
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.8) 0%, rgba(139,92,246,0.8) 100%)',
                    border: '2px solid rgba(168,85,247,0.4)',
                  }}
                  onClick={() => {
                    setShowRecipes(!showRecipes);
                    if (!showRecipes) generateRecipes();
                  }}
                >
                  <img src="/kitchen icon 2.png" alt="Recipe Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                  {showRecipes ? 'Hide Recipes' : 'Recipe Ideas'}
                </button>
              </div>
            </div>
            
            {/* Pantry Category Multi-Select */}
            <div style={{
              padding: '0 1rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '1rem'
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginBottom: '0.75rem'
              }}>
                📂 Filter by Category:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* All Items toggle */}
                <label key="all" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: pantryCategoryFilter.includes('all') ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(59,130,246,0.2))' : 'rgba(255,255,255,0.05)',
                  color: pantryCategoryFilter.includes('all') ? 'white' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.75rem', fontWeight: pantryCategoryFilter.includes('all') ? 'bold' : 'normal', cursor: 'pointer'
                }}>
                  <input type="checkbox" checked={pantryCategoryFilter.includes('all')} onChange={() => handleCategoryFilterChange('all')} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                  📦 All Items
                </label>

                {/* Grouped categories */}
                {categoryGroups.map(group => (
                  <div key={group.key} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                      style={{
                        width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <span>{group.emoji} {group.name}</span>
                      <span style={{ opacity: 0.8 }}>{expandedGroups[group.key] ? '▲' : '▼'}</span>
                    </button>
                    {expandedGroups[group.key] && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.75rem' }}>
                        {group.sub.map(category => {
                          const labelText = group.key === 'fridge'
                            ? category.replace(/^Fridge\s*–\s*/,'')
                            : category;
                          return (
                          <label key={category} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)',
                            background: pantryCategoryFilter.includes(category) ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.2))' : 'rgba(255,255,255,0.05)',
                            color: pantryCategoryFilter.includes(category) ? 'white' : 'rgba(255,255,255,0.7)', fontSize: '0.72rem', cursor: 'pointer'
                          }}>
                            <input type="checkbox" checked={pantryCategoryFilter.includes(category)} onChange={() => handleCategoryFilterChange(category)} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                            {labelText}
                          </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '2rem', minHeight: '600px'}}>
              {/* Left Half - Inventory List */}
              <div style={{flex: '1', maxWidth: '50%'}}>
                <div style={styles.inventoryList}>
                  {filteredPantryItems.length === 0 ? (
                    <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                      <img src="/grocery icon 2.png" alt="Grocery Icon" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
                      <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem'}}>
                        {pantryCategoryFilter.includes('all') 
                          ? "🕵️‍♀️ Laurie's stash is suspiciously empty... Time for a 'Snack Attack'!"
                          : `📦 No items found in ${pantryCategoryFilter.includes('Pantry – Staples') ? 'Staples' :
                             pantryCategoryFilter.includes('Pantry – Oils, Vinegars & Condiments') ? 'Oils & Condiments' :
                             pantryCategoryFilter.includes('Pantry – Cereals') ? 'Cereals' :
                             pantryCategoryFilter.includes('Pantry – Pasta') ? 'Pasta' :
                             pantryCategoryFilter.includes('Pantry – Rice & Grains') ? 'Rice & Grains' :
                             pantryCategoryFilter.includes('Pantry – Baking & Misc. Dry Goods') ? 'Baking & Misc' :
                             pantryCategoryFilter.includes('Fridge') ? 'Fridge' :
                             pantryCategoryFilter.includes('Freezer') ? 'Freezer' :
                             pantryCategoryFilter.includes('Produce') ? 'Produce' :
                             pantryCategoryFilter.includes('Dairy') ? 'Dairy' :
                             pantryCategoryFilter.includes('Meat') ? 'Meat' :
                             pantryCategoryFilter.includes('Snacks') ? 'Snacks' :
                             pantryCategoryFilter.includes('Beverages') ? 'Beverages' :
                             pantryCategoryFilter.includes('CHOCOLATE') ? 'CHOCOLATE' : 'selected categories'}`
                        }
                      </p>
                    </div>
                  ) : (
                filteredPantryItems.map((item, index) => {
                  // Debug specific items with decimal values
                  if (item.name.includes('Philadelphia') || item.name.includes('Butter')) {
                    console.log(`🔍 Card View Debug - ${item.name}: currentCount=${item.currentCount} (type: ${typeof item.currentCount})`);
                  }
                  
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
                  
                  return (
                    <div key={item.id || index} style={styles.inventoryItem}>
                      <div style={styles.itemContent}>
                        <div style={styles.itemLeft}>
                          <div style={styles.itemIcon}>
                            {getItemIcon()}
                          </div>
                          <div style={styles.itemDetails}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <p style={styles.itemCategory}>
                              {item.category} • Last updated {item.lastUpdated}
                              {item.expiryDate && (
                                <span style={{
                                  color: '#fbbf24',
                                  fontWeight: 'bold',
                                  marginLeft: '0.5rem'
                                }}>
                                  • Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div style={isMobile ? styles.itemRightMobile : styles.itemRight}>
                          {/* Stock Controls */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            minWidth: '120px'
                          }}>
                            <p style={{
                              ...styles.stockLabel,
                              fontSize: '0.75rem',
                              margin: 0,
                              textAlign: 'center'
                            }}>
                              Stock: {item.currentCount}/{item.minCount}
                            </p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}>
                              <button
                                onClick={() => {
                                  console.log('🔽 Decrease button clicked for item:', item.id, item.name);
                                  // Smart decrement: use 0.25 for values < 1, otherwise use 1
                                  const decrement = item.currentCount <= 1 ? 0.25 : 1;
                                  const newValue = Math.max(0, item.currentCount - decrement);
                                  updateItemQuantity(item.id, Math.round(newValue * 100) / 100, false);
                                }}
                                style={{
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '50%',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(to right, rgba(239,68,68,0.4), rgba(220,38,38,0.5))',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                -
                              </button>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '2.5rem',
                                height: '2rem'
                              }}>
                                <p style={{
                                  margin: 0,
                                  lineHeight: '1',
                                  fontSize: '1rem',
                                  fontWeight: 'bold',
                                  color: 'white'
                                }}>
                                  {item.currentCount}
                                </p>
                                <p style={{
                                  margin: 0,
                                  lineHeight: '1',
                                  fontSize: '0.6rem',
                                  color: 'rgba(255,255,255,0.7)'
                                }}>
                                  {item.unit}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  console.log('🔼 Increase button clicked for item:', item.id, item.name);
                                  // Smart increment: use 0.25 for values < 1, otherwise use 1  
                                  const increment = item.currentCount < 1 ? 0.25 : 1;
                                  const newValue = item.currentCount + increment;
                                  updateItemQuantity(item.id, Math.round(newValue * 100) / 100, true);
                                }}
                                style={{
                                  width: '2rem',
                                  height: '2rem',
                                  borderRadius: '50%',
                                  border: 'none',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(to right, rgba(34,197,94,0.4), rgba(22,163,74,0.5))',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Min Needed - Compact */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            minWidth: '80px'
                          }}>
                            <p style={{
                              ...styles.stockLabel,
                              fontSize: '0.7rem',
                              margin: 0,
                              textAlign: 'center'
                            }}>
                              Min Needed
                            </p>
                            <div 
                              style={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)',
                                minWidth: '2.5rem',
                                height: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                const newMin = prompt(`Set minimum needed for ${item.name}:`, item.minCount.toString());
                                if (newMin !== null) {
                                  const newMinValue = parseFloat(newMin);
                                  if (!isNaN(newMinValue) && newMinValue >= 0) {
                                    updateItemMinCount(item.id, newMinValue);
                                  } else {
                                    alert('Please enter a valid number (0 or greater)');
                                  }
                                }
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                              }}
                            >
                              <p style={{
                                margin: 0,
                                lineHeight: '1',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                color: 'white'
                              }}>
                                {item.minCount}
                              </p>
                              <p style={{
                                margin: 0,
                                lineHeight: '1',
                                fontSize: '0.5rem',
                                color: 'rgba(255,255,255,0.6)'
                              }}>
                                edit
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div style={{
                            ...styles.statusBadge,
                            ...getStatusStyle(),
                            minWidth: '60px',
                            textAlign: 'center'
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
              
              {/* Right Half - Analytics */}
              <div style={{flex: '1', maxWidth: '50%'}}>
                <PantryAnalytics pantryItems={filteredPantryItems} />
              </div>
            </div>
            
            {/* Recipe Section within Pantry Tab */}
            {showRecipes && (
              <div style={{
                ...styles.card,
                marginTop: '1rem',
                background: 'linear-gradient(145deg, rgba(168,85,247,0.1), rgba(139,92,246,0.05))',
                border: '1px solid rgba(168,85,247,0.3)'
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
                        ? 'linear-gradient(to right, rgba(120,120,120,0.4), rgba(140,140,140,0.3))'
                        : 'linear-gradient(to right, rgba(168,85,247,0.4), rgba(139,92,246,0.4))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={generateRecipes}
                    disabled={loadingRecipes}
                  >
                    <img src="/cupboard image 1.png" alt="Refresh Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                    {loadingRecipes ? 'Finding Recipes...' : 'Get New Recipes'}
                  </button>
                </div>
                
                <div style={{padding: '1rem'}}>
                  {recipes.length === 0 ? (
                    loadingRecipes ? (
                      <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                        <img src="/cupboard image 1.png" alt="Recipe Icon" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
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
                      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      {recipes
                        .sort((a, b) => {
                          const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, dessert: 4 };
                          return mealOrder[a.mealType] - mealOrder[b.mealType];
                        })
                        .map((recipe) => (
                        <div key={recipe.id} style={{
                          background: 'linear-gradient(145deg, rgba(168,85,247,0.1), rgba(139,92,246,0.05))',
                          borderRadius: '1rem',
                          border: '1px solid rgba(168,85,247,0.3)',
                          padding: '1.5rem',
                          backdropFilter: 'blur(10px)'
                        }}>
                          {/* Recipe Header */}
                          <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{color: 'white', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>
                              {recipe.title}
                            </h3>
                            <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: '1.4', marginBottom: '0.75rem'}}>
                              {recipe.description}
                            </p>
                            
                            {/* Recipe Meta */}
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                              <span style={{
                                background: recipe.mealType === 'breakfast' 
                                  ? 'rgba(251,191,36,0.3)' 
                                  : recipe.mealType === 'lunch'
                                  ? 'rgba(34,197,94,0.3)'
                                  : recipe.mealType === 'dinner'
                                  ? 'rgba(239,68,68,0.3)'
                                  : 'rgba(168,85,247,0.3)',
                                color: recipe.mealType === 'breakfast' 
                                  ? 'rgba(251,191,36,1)' 
                                  : recipe.mealType === 'lunch'
                                  ? 'rgba(34,197,94,1)'
                                  : recipe.mealType === 'dinner'
                                  ? 'rgba(239,68,68,1)'
                                  : 'rgba(168,85,247,1)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontWeight: 'bold'
                              }}>
                                {recipe.mealType.charAt(0).toUpperCase() + recipe.mealType.slice(1)}
                              </span>
                              <span style={{color: 'rgba(255,255,255,0.7)'}}>
                                🕒 {recipe.cookTime}
                              </span>
                              <span style={{color: 'rgba(255,255,255,0.7)'}}>
                                👥 {recipe.servings} servings
                              </span>
                            </div>
                          </div>

                          {/* Recipe Content - Ingredients & Instructions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Ingredients */}
                            <div>
                              <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                🥘 Ingredients:
                              </h4>
                              <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                                {recipe.ingredients.slice(0, 6).map((ingredient, i) => (
                                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                                    {ingredient}
                                  </li>
                                ))}
                                {recipe.ingredients.length > 6 && (
                                  <li style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                    ... and {recipe.ingredients.length - 6} more
                                  </li>
                                )}
                              </ul>
                            </div>

                            {/* Instructions Preview */}
                            <div>
                              <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                📝 Instructions:
                              </h4>
                              <div style={{ fontSize: '0.75rem' }}>
                                {recipe.instructions.slice(0, 3).map((step, i) => (
                                  <p key={i} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                                    <span style={{ color: 'rgba(168,85,247,0.8)', fontWeight: 'bold' }}>
                                      {i + 1}.
                                    </span> {step}
                                  </p>
                                ))}
                                {recipe.instructions.length > 3 && (
                                  <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                    ... {recipe.instructions.length - 3} more steps
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Old Recipes Tab Content - Now Removed */}
        {false && (
          <div style={styles.card}>
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
                    ? 'linear-gradient(to right, rgba(120,120,120,0.4), rgba(140,140,140,0.3))'
                    : 'linear-gradient(to right, rgba(168,85,247,0.4), rgba(139,92,246,0.4))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={generateRecipes}
                disabled={loadingRecipes}
              >
                <img src="/cupboard image 1.png" alt="Refresh Icon" style={{width: '18px', height: '18px', objectFit: 'contain', marginRight: '6px'}} />
                {loadingRecipes ? 'Finding Recipes...' : 'Get New Recipes'}
              </button>
            </div>
            
            <div style={{padding: '1rem'}}>
              {recipes.length === 0 ? (
                loadingRecipes ? (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <img src="/cupboard image 1.png" alt="Recipe Icon" style={{width: '72px', height: '72px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.7}} />
                    <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem', marginBottom: '0.5rem'}}>
                      👩‍🍳 Hang on while the AI chefs cook something up for you!
                    </p>
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem'}}>
                      We’re crafting breakfast, lunch, dinner, and dessert ideas from your pantry.
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {recipes
                    .sort((a, b) => {
                      const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, dessert: 4 };
                      return mealOrder[a.mealType] - mealOrder[b.mealType];
                    })
                    .map((recipe) => (
                    <div key={recipe.id} style={{
                      background: 'linear-gradient(145deg, rgba(168,85,247,0.1), rgba(139,92,246,0.05))',
                      borderRadius: '1rem',
                      border: '1px solid rgba(168,85,247,0.3)',
                      padding: '1.5rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {/* Recipe Header */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem'
                        }}>
                          {recipe.title}
                        </h3>
                        <p style={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          marginBottom: '0.75rem'
                        }}>
                          {recipe.description}
                        </p>
                        
                        {/* Recipe Meta */}
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          <span>⏱️ {recipe.cookTime}</span>
                          <span>👥 {recipe.servings} servings</span>
                          <span>📊 {recipe.difficulty}</span>
                          <span>🌍 {recipe.cuisine}</span>
                          <span style={{
                            background: 'rgba(168,85,247,0.3)',
                            color: 'rgba(168,85,247,1)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontWeight: 'bold'
                          }}>
                            {recipe.mealType === 'breakfast' ? '🌅 Breakfast' :
                             recipe.mealType === 'lunch' ? '🌞 Lunch' :
                             recipe.mealType === 'dinner' ? '🌙 Dinner' :
                             '🍰 Dessert'}
                          </span>
                        </div>
                      </div>

                      {/* Ingredient Availability */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          marginBottom: '0.5rem'
                        }}>
                          {recipe.availableIngredients.length > 0 && (
                            <span style={{
                              background: 'rgba(34,197,94,0.3)',
                              color: 'rgba(34,197,94,1)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontWeight: 'bold'
                            }}>
                              ✅ {recipe.availableIngredients.length} available
                            </span>
                          )}
                          {recipe.missingIngredients.length > 0 && (
                            <span style={{
                              background: 'rgba(239,68,68,0.3)',
                              color: 'rgba(239,68,68,1)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontWeight: 'bold'
                            }}>
                              🛒 {recipe.missingIngredients.length} needed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ingredients List */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                          fontWeight: 'bold'
                        }}>
                          🥘 Ingredients:
                        </h4>
                        <ul style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          fontSize: '0.75rem'
                        }}>
                          {recipe.ingredients.slice(0, 6).map((ingredient, i) => (
                            <li key={i} style={{
                              color: 'rgba(255,255,255,0.7)',
                              marginBottom: '0.25rem',
                              paddingLeft: '1rem',
                              position: 'relative'
                            }}>
                              <span style={{
                                position: 'absolute',
                                left: 0,
                                color: 'rgba(168,85,247,0.8)'
                              }}>•</span>
                              {ingredient}
                            </li>
                          ))}
                          {recipe.ingredients.length > 6 && (
                            <li style={{
                              color: 'rgba(255,255,255,0.5)',
                              fontStyle: 'italic',
                              fontSize: '0.7rem'
                            }}>
                              ... and {recipe.ingredients.length - 6} more
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Instructions Preview */}
                      <div>
                        <h4 style={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                          fontWeight: 'bold'
                        }}>
                          📝 Instructions:
                        </h4>
                        <div style={{ fontSize: '0.75rem' }}>
                          {recipe.instructions.slice(0, 3).map((step, i) => (
                            <p key={i} style={{
                              color: 'rgba(255,255,255,0.7)',
                              marginBottom: '0.5rem',
                              lineHeight: '1.3'
                            }}>
                              <span style={{ color: 'rgba(168,85,247,0.8)', fontWeight: 'bold' }}>
                                {i + 1}.
                              </span> {step}
                            </p>
                          ))}
                          {recipe.instructions.length > 3 && (
                            <p style={{
                              color: 'rgba(255,255,255,0.5)',
                              fontStyle: 'italic',
                              fontSize: '0.7rem'
                            }}>
                              ... {recipe.instructions.length - 3} more steps
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #1d4ed8 75%, #1e3a8a 100%)',
            padding: '2rem',
            borderRadius: '1rem',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              background: 'linear-gradient(45deg, #60a5fa, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              fontFamily: "'Fredoka', system-ui, sans-serif"
            }}>
              Edit Quantity
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              <p style={{color: 'white', marginBottom: '0.5rem'}}>
                {editingItem.name}
              </p>
              <label style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                marginBottom: '0.5rem'
              }}>
                Total Amount Needed:
              </label>
              <input
                type="number"
                step="0.1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Enter total quantity"
                min="0.1"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: 'rgba(30, 58, 138, 0.6)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '0.25rem'}}>
                UOM: {editingItem.unit || 'No unit specified'}
              </p>
            </div>

            <div style={{display: 'flex', gap: '1rem'}}>
              <button
                type="button"
                onClick={() => {
                  setShowQuantityModal(false);
                  setEditingItem(null);
                  setNewQuantity('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: 'rgba(30, 58, 138, 0.6)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuantityUpdate}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Analyzer Modal */}
      <PhotoAnalyzerModal />

      {/* Weeks List Box Modal */}
      <WeeksListBox 
        pantryItems={shoppingList}
        isVisible={showWeeksListBox}
        onClose={() => setShowWeeksListBox(false)}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        button:hover {
          transform: scale(1.05);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
        }
        
        [style*="inventoryItem"]:hover {
          background-color: rgba(255,255,255,0.1) !important;
          transform: scale(1.02);
        }
        
        /* Ensure consistent status badge styling */
        div[style*="statusBadge"] {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          min-width: 90px !important;
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
// Force rebuild - Sat, Aug  9, 2025  6:17:00 AM
/* Trigger Render redeploy - partial quantities + navigation fixes */
