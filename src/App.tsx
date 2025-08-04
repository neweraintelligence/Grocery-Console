import React, { useState, useEffect } from 'react';

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
  source: 'pantry' | 'grocery';
  currentCount?: number;
  minCount?: number;
  needed?: number;
  quantity?: number;
  unit: string;
  priority?: 'High' | 'Medium' | 'Low';
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative' as const,
    overflow: 'hidden'
  },
  backgroundOrbs: {
    position: 'absolute' as const,
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none' as const,
    zIndex: 0
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
    animation: 'pulse 3s ease-in-out infinite'
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
    animation: 'pulse 3s ease-in-out infinite 1s'
  },
  header: {
    position: 'sticky' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    top: 0,
    zIndex: 50
  },
  headerContent: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logoIcon: {
    width: '3.5rem',
    height: '3.5rem',
    background: 'linear-gradient(135deg, #fb923c, #ec4899)',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, white, #fed7aa, #fecaca)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    fontFamily: "'Fredoka', system-ui, sans-serif"
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: '0.25rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  quickAddBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, #10b981, #059669)',
    color: 'white',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },
  main: {
    position: 'relative' as const,
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '2rem',
    zIndex: 1
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2rem'
  },
  gridLarge: {
    '@media (min-width: 1280px)': {
      gridTemplateColumns: '3fr 2fr'
    }
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem'
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  cardIcon: {
    width: '4rem',
    height: '4rem',
    background: 'linear-gradient(135deg, #fb923c, #ec4899)',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  cardTitleText: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'white',
    fontFamily: "'Fredoka', system-ui, sans-serif"
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
    marginTop: '0.25rem'
  },
  addBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(to right, #f97316, #ec4899)',
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },
  inventoryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  inventoryItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    padding: '1.5rem',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  itemIcon: {
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  itemName: {
    color: 'white',
    fontWeight: '600',
    fontSize: '1.25rem'
  },
  itemCategory: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem'
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  stockInfo: {
    textAlign: 'center' as const
  },
  stockLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
    marginBottom: '0.25rem'
  },
  stockValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.5rem'
  },
  stockUnit: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.75rem'
  },
  statusBadge: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  statusLow: {
    background: 'linear-gradient(to right, #eab308, #f97316)'
  },
  statusOut: {
    background: 'linear-gradient(to right, #ef4444, #ec4899)',
    animation: 'pulse 2s ease-in-out infinite'
  },
  statusGood: {
    background: 'linear-gradient(to right, #10b981, #059669)'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem'
  },
  sidebarCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  sidebarIcon: {
    width: '3rem',
    height: '3rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  sidebarTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.25rem',
    fontFamily: "'Fredoka', system-ui, sans-serif"
  },
  sidebarSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem'
  },
  listItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '0.75rem',
    padding: '1rem',
    border: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '0.75rem',
    transition: 'all 0.2s ease'
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: '1.5rem'
  }
};
function App() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [, setGroceryItems] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchPantryItems();
    fetchGroceryItems();
    fetchShoppingList();
  }, []);

  const fetchPantryItems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry`);
      const data = await response.json();
      setPantryItems(data);
    } catch (error) {
      console.error('Error fetching pantry items:', error);
    }
  };

  const fetchGroceryItems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/groceries`);
      const data = await response.json();
      setGroceryItems(data);
    } catch (error) {
      console.error('Error fetching grocery items:', error);
    }
  };

  const fetchShoppingList = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/shopping-list`);
      const data = await response.json();
      setShoppingList(data);
    } catch (error) {
      console.error('Error fetching shopping list:', error);
    }
  };

  const updateItemQuantity = async (itemId: string, newQuantity: number, _isIncrease: boolean) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentCount: newQuantity }),
      });
      
      if (response.ok) {
        // Refresh data after successful update
        fetchPantryItems();
        fetchShoppingList();
      } else {
        console.error('Failed to update item quantity');
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
    }
  };

  const AddItemModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      category: '',
      currentCount: 0,
      minCount: 1,
      packSize: 1,
      unit: '',
      notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          setShowAddModal(false);
          setFormData({
            name: '',
            category: '',
            currentCount: 0,
            minCount: 1,
            packSize: 1,
            unit: '',
            notes: ''
          });
          fetchPantryItems();
          fetchShoppingList();
        }
      } catch (error) {
        console.error('Error adding item:', error);
      }
    };

    if (!showAddModal) return null;

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
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}>
          <h2 style={{color: 'white', marginBottom: '1.5rem', fontFamily: "'Fredoka', system-ui, sans-serif"}}>
            🍳 Add New Item
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gap: '1rem'}}>
              <input
                type="text"
                placeholder="Item Name (e.g., Greek Yogurt)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                />
                <input
                  type="text"
                  placeholder="Unit (cups, bottles)"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block'}}>
                    Current Count
                  </label>
                  <input
                    type="number"
                    value={formData.currentCount}
                    onChange={(e) => setFormData({...formData, currentCount: parseInt(e.target.value) || 0})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      width: '100%'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block'}}>
                    Min Count
                  </label>
                  <input
                    type="number"
                    value={formData.minCount}
                    onChange={(e) => setFormData({...formData, minCount: parseInt(e.target.value) || 1})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      width: '100%'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block'}}>
                    Pack Size
                  </label>
                  <input
                    type="number"
                    value={formData.packSize}
                    onChange={(e) => setFormData({...formData, packSize: parseInt(e.target.value) || 1})}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
              
              <textarea
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
                type="submit"
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(to right, #10b981, #059669)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Add Item
              </button>
            </div>
          </form>
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
            <div style={styles.logoIcon}>🍳</div>
            <div>
              <h1 style={styles.title}>Mom's Grocery Dashboard</h1>
              <p style={styles.subtitle}>Orange you glad it's grocery time? 🍊</p>
            </div>
          </div>
                      <div style={styles.headerActions}>
              <button 
                style={styles.quickAddBtn}
                onClick={() => setShowAddModal(true)}
              >
                + Quick Add
              </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={{...styles.grid, gridTemplateColumns: window.innerWidth >= 1280 ? '3fr 2fr' : 'minmax(0, 1fr)'}}>
          
          {/* Main Inventory Section */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>🥫</div>
                <div>
                  <h2 style={styles.cardTitleText}>Pantry Inventory</h2>
                  <p style={styles.cardSubtitle}>Track everything you have at home</p>
                </div>
              </div>
              <button style={styles.addBtn}>+ Add Item</button>
            </div>
            
                          <div style={styles.inventoryList}>
                {pantryItems.length === 0 ? (
                  <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                    <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem'}}>
                      🛒 No pantry items yet. Click "Quick Add" to get started!
                    </p>
                  </div>
                ) : (
                  pantryItems.map((item, index) => {
                    const getStatusStyle = () => {
                      if (item.currentCount === 0) return styles.statusOut;
                      if (item.currentCount <= item.minCount) return styles.statusLow;
                      return styles.statusGood;
                    };
                    
                    const getStatusText = () => {
                      if (item.currentCount === 0) return 'Out of Stock';
                      if (item.currentCount <= item.minCount) return 'Running Low';
                      return 'Well Stocked';
                    };
                    
                    const getItemIcon = () => {
                      const category = item.category?.toLowerCase() || '';
                      if (category.includes('dairy')) return '🥛';
                      if (category.includes('meat')) return '🍖';
                      if (category.includes('produce')) return '🥬';
                      if (category.includes('bakery')) return '🍞';
                      if (category.includes('pantry')) return '🥫';
                      return '🛒';
                    };
                    
                    return (
                      <div key={item.id || index} style={styles.inventoryItem}>
                        <div style={styles.itemContent}>
                          <div style={styles.itemLeft}>
                            <div style={{...styles.itemIcon, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'}}>
                              {getItemIcon()}
                            </div>
                            <div style={styles.itemDetails}>
                              <h3 style={styles.itemName}>{item.name}</h3>
                              <p style={styles.itemCategory}>
                                {item.category} • Last updated {item.lastUpdated}
                              </p>
                            </div>
                          </div>
                          <div style={styles.itemRight}>
                            <div style={styles.stockInfo}>
                              <p style={styles.stockLabel}>Current Stock</p>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <button
                                  onClick={() => updateItemQuantity(item.id, Math.max(0, item.currentCount - 1), false)}
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'linear-gradient(to right, #ef4444, #dc2626)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  -
                                </button>
                                <div style={{textAlign: 'center'}}>
                                  <p style={styles.stockValue}>{item.currentCount}</p>
                                  <p style={styles.stockUnit}>{item.unit}</p>
                                </div>
                                <button
                                  onClick={() => updateItemQuantity(item.id, item.currentCount + 1, true)}
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'linear-gradient(to right, #10b981, #059669)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div style={styles.stockInfo}>
                              <p style={styles.stockLabel}>Min Required</p>
                              <p style={styles.stockValue}>{item.minCount}</p>
                              <p style={styles.stockUnit}>{item.unit}</p>
                            </div>
                            <div style={{...styles.statusBadge, ...getStatusStyle()}}>
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

          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Shopping List */}
            <div style={styles.sidebarCard}>
              <div style={styles.sidebarHeader}>
                <div style={{...styles.sidebarIcon, background: 'linear-gradient(135deg, #10b981, #059669)'}}>📝</div>
                <div>
                  <h3 style={styles.sidebarTitle}>Shopping List</h3>
                  <p style={styles.sidebarSubtitle}>Items you need to buy</p>
                </div>
              </div>
              
              {shoppingList.length === 0 ? (
                <div style={{...styles.listItem, textAlign: 'center', padding: '2rem'}}>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1rem'}}>
                    ✅ All stocked up! No items needed.
                  </p>
                </div>
              ) : (
                shoppingList.slice(0, 5).map((item, index) => {
                  const getPriorityColor = () => {
                    if (item.source === 'pantry') {
                      if (item.currentCount === 0) return 'linear-gradient(to right, #ef4444, #ec4899)';
                      return 'linear-gradient(to right, #eab308, #f97316)';
                    }
                    const priority = item.priority?.toLowerCase();
                    if (priority === 'high') return 'linear-gradient(to right, #ef4444, #ec4899)';
                    if (priority === 'medium') return 'linear-gradient(to right, #eab308, #f97316)';
                    return 'linear-gradient(to right, #10b981, #059669)';
                  };
                  
                  const getDescription = () => {
                    if (item.source === 'pantry') {
                      return `Need ${item.needed} ${item.unit} (low stock)`;
                    }
                    return `${item.quantity} ${item.unit} - ${item.priority} priority`;
                  };
                  
                  return (
                    <div key={item.id || index} style={styles.listItem}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          <div style={{
                            width: '0.5rem', 
                            height: '0.5rem', 
                            borderRadius: '50%', 
                            background: getPriorityColor()
                          }}></div>
                          <div>
                            <p style={{color: 'white', fontWeight: '500', margin: 0}}>{item.name}</p>
                            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0}}>
                              {getDescription()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {shoppingList.length > 5 && (
                <div style={{...styles.listItem, textAlign: 'center', padding: '1rem'}}>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem'}}>
                    ...and {shoppingList.length - 5} more items
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div style={{...styles.sidebarCard, background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(147,51,234,0.8))'}}>
              <div style={styles.sidebarHeader}>
                <div style={{...styles.sidebarIcon, background: 'rgba(255,255,255,0.2)'}}>📊</div>
                <div>
                  <h3 style={styles.sidebarTitle}>Quick Stats</h3>
                </div>
              </div>
              
                              <div style={styles.statsGrid}>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Total Items</span>
                    <span style={{...styles.statValue, color: 'white'}}>{pantryItems.length}</span>
                  </div>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Running Low</span>
                    <span style={{...styles.statValue, color: '#fbbf24'}}>
                      {pantryItems.filter(item => item.currentCount <= item.minCount).length}
                    </span>
                  </div>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Categories</span>
                    <span style={{...styles.statValue, color: 'white'}}>
                      {new Set(pantryItems.map(item => item.category)).size}
                    </span>
                  </div>
                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Need to Buy</span>
                    <span style={{...styles.statValue, color: '#34d399'}}>{shoppingList.length}</span>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Item Modal */}
      <AddItemModal />

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
