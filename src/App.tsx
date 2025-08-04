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
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    minWidth: '90px',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const
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
  },
  quickStatsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderRadius: '1.5rem',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(147,51,234,0.8))'
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem'
  },
  quickStatCard: {
    textAlign: 'center' as const,
    padding: '1rem'
  },
  quickStatValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: '0.5rem 0',
    fontFamily: "'Fredoka', system-ui, sans-serif"
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.875rem',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  }
};
function App() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [, setGroceryItems] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchPantryItems();
    fetchGroceryItems();
    fetchShoppingList();
  }, []);

  const fetchPantryItems = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry`);
      if (response.ok) {
        const data = await response.json();
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

  const updateItemMinCount = async (itemId: string, newMinCount: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pantry/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minCount: newMinCount }),
      });
      
      if (response.ok) {
        // Refresh data after successful update
        fetchPantryItems();
        fetchShoppingList();
      } else {
        console.error('Failed to update item min count');
      }
    } catch (error) {
      console.error('Error updating item min count:', error);
    }
  };

  const analyzePhoto = async (file: File) => {
    setAnalyzingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analyze-photo`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDetectedItems(data.detectedItems);
        setShowPhotoModal(true);
      } else {
        console.error('Failed to analyze photo');
        alert('Failed to analyze photo. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing photo:', error);
      alert('Error analyzing photo. Please try again.');
    } finally {
      setAnalyzingPhoto(false);
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
            🎪 Laurie's Item Circus!
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gap: '1rem'}}>
              <input
                type="text"
                placeholder="What delicious thing caught your eye? (e.g., Magical Greek Yogurt)"
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
                    background: 'linear-gradient(to right, #10b981, #059669)',
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
            <div style={styles.logoIcon}>🍳</div>
            <div>
              <h1 style={styles.title}>Laurie's Legendary Larder</h1>
              <p style={styles.subtitle}>Where snacks meet statistics and chaos meets organization! 🎉</p>
            </div>
          </div>
                      <div style={styles.headerActions}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    analyzePhoto(file);
                  }
                }}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                style={{
                  ...styles.quickAddBtn,
                  background: analyzingPhoto ? 'linear-gradient(to right, #6b7280, #4b5563)' : 'linear-gradient(to right, #6366f1, #8b5cf6)',
                  cursor: analyzingPhoto ? 'not-allowed' : 'pointer',
                  marginRight: '1rem'
                }}
              >
                {analyzingPhoto ? '🔍 Magic Happening...' : '📸 Fridge Detective'}
              </label>
              <button 
                style={styles.quickAddBtn}
                onClick={() => setShowAddModal(true)}
              >
                ➕ Snack Attack!
              </button>
            </div>
        </div>
      </header>

      {/* Quick Stats Section */}
      <div style={{...styles.main, paddingBottom: 0}}>
        <div style={styles.quickStatsContainer}>
          <div style={styles.quickStatsGrid}>
            <div style={styles.quickStatCard}>
              <div style={styles.quickStatValue}>{pantryItems.length}</div>
              <div style={styles.quickStatLabel}>Total Items</div>
            </div>
            <div style={styles.quickStatCard}>
              <div style={{...styles.quickStatValue, color: '#fbbf24'}}>
                {pantryItems.filter(item => item.currentCount <= item.minCount).length}
              </div>
              <div style={styles.quickStatLabel}>Running Low</div>
            </div>
            <div style={styles.quickStatCard}>
              <div style={styles.quickStatValue}>
                {new Set(pantryItems.map(item => item.category)).size}
              </div>
              <div style={styles.quickStatLabel}>Categories</div>
            </div>
            <div style={styles.quickStatCard}>
              <div style={{...styles.quickStatValue, color: '#34d399'}}>{shoppingList.length}</div>
              <div style={styles.quickStatLabel}>Need to Buy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={{...styles.grid, gridTemplateColumns: window.innerWidth >= 1280 ? '3fr 2fr' : 'minmax(0, 1fr)'}}>
          
          {/* Main Shopping List Section */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>📝</div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Loot List</h2>
                  <p style={styles.cardSubtitle}>Adventures awaiting in the grocery jungle! 🛒✨</p>
                </div>
              </div>
              <button 
                style={styles.addBtn}
                onClick={() => setShowAddModal(true)}
              >
                🎯 Add Treasure!
              </button>
            </div>
            
            <div style={styles.inventoryList}>
              {shoppingList.length === 0 ? (
                <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem'}}>
                    🎉 Laurie's all set! The snack gods are pleased! ✨
                  </p>
                </div>
              ) : (
                shoppingList.map((item, index) => {
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
                  
                  const getStatusStyle = () => {
                    if (item.source === 'pantry') {
                      if (item.currentCount === 0) return styles.statusOut;
                      return styles.statusLow;
                    }
                    const priority = item.priority?.toLowerCase();
                    if (priority === 'high') return styles.statusOut;
                    if (priority === 'medium') return styles.statusLow;
                    return styles.statusGood;
                  };
                  
                  const getStatusText = () => {
                    if (item.source === 'pantry') {
                      return item.currentCount === 0 ? 'Out' : 'Low';
                    }
                    const priority = item.priority?.toString() || 'Medium';
                    if (priority === 'High') return 'High';
                    if (priority === 'Low') return 'Low';
                    return 'Medium';
                  };
                  
                  const getItemIcon = () => {
                    if (item.source === 'pantry') return '🥫';
                    return '🛒';
                  };
                  
                  const getDescription = () => {
                    if (item.source === 'pantry') {
                      return `Need ${item.needed || 1} ${item.unit}`;
                    }
                    return `${item.quantity || 1} ${item.unit}`;
                  };
                  
                  return (
                    <div key={item.id || index} style={styles.inventoryItem}>
                      <div style={styles.itemContent}>
                        <div style={styles.itemLeft}>
                          <div style={{...styles.itemIcon, background: getPriorityColor()}}>
                            {getItemIcon()}
                          </div>
                          <div style={styles.itemDetails}>
                            <h3 style={styles.itemName}>{item.name}</h3>
                            <p style={styles.itemCategory}>
                              {getDescription()} • {item.source === 'pantry' ? 'From pantry stock' : 'Manual addition'}
                            </p>
                          </div>
                        </div>
                        <div style={styles.itemRight}>
                          <div style={styles.stockInfo}>
                            <p style={styles.stockLabel}>Quantity</p>
                            <div style={{textAlign: 'center'}}>
                              <p style={styles.stockValue}>{item.quantity || item.needed || 1}</p>
                              <p style={styles.stockUnit}>{item.unit}</p>
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

          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Pantry Inventory */}
            <div style={styles.sidebarCard}>
              <div style={styles.sidebarHeader}>
                <div style={{...styles.sidebarIcon, background: 'linear-gradient(135deg, #fb923c, #ec4899)'}}>🥫</div>
                <div>
                  <h3 style={styles.sidebarTitle}>Laurie's Secret Stash</h3>
                  <p style={styles.sidebarSubtitle}>The mysterious depths of the kitchen kingdom! 👑</p>
                </div>
              </div>
              
              {pantryItems.length === 0 ? (
                <div style={{...styles.listItem, textAlign: 'center', padding: '2rem'}}>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1rem'}}>
                    🕵️‍♀️ Laurie's stash is suspiciously empty... Time for a "Snack Attack"!
                  </p>
                </div>
              ) : (
                pantryItems.slice(0, 5).map((item, index) => {
                  const getPriorityColor = () => {
                    if (item.currentCount === 0) return 'linear-gradient(to right, #ef4444, #ec4899)';
                    if (item.currentCount <= item.minCount) return 'linear-gradient(to right, #eab308, #f97316)';
                    return 'linear-gradient(to right, #10b981, #059669)';
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
                              {item.currentCount}/{item.minCount} {item.unit}
                            </p>
                          </div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                          <button
                            onClick={() => updateItemMinCount(item.id, Math.max(1, item.minCount - 1))}
                            style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.625rem',
                              fontWeight: 'bold'
                            }}
                            title="Decrease minimum needed"
                          >
                            -
                          </button>
                          <button
                            onClick={() => updateItemQuantity(item.id, Math.max(0, item.currentCount - 1), false)}
                            style={{
                              width: '1.5rem',
                              height: '1.5rem',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'linear-gradient(to right, #ef4444, #dc2626)',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                            title="Remove one item"
                          >
                            -
                          </button>
                          <button
                            onClick={() => updateItemQuantity(item.id, item.currentCount + 1, true)}
                            style={{
                              width: '1.5rem',
                              height: '1.5rem',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'linear-gradient(to right, #10b981, #059669)',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                            title="Add one item"
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateItemMinCount(item.id, item.minCount + 1)}
                            style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.625rem',
                              fontWeight: 'bold'
                            }}
                            title="Increase minimum needed"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {pantryItems.length > 5 && (
                <div style={{...styles.listItem, textAlign: 'center', padding: '1rem'}}>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem'}}>
                    ...and {pantryItems.length - 5} more items
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Add Item Modal */}
      <AddItemModal />

      {/* Photo Analyzer Modal */}
      <PhotoAnalyzerModal />

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
