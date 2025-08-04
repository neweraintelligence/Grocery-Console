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
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("/kitchen scene 1.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
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
  itemRightMobile: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '1rem'
  },
  mobileButton: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1.2rem',
    fontWeight: 'bold'
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
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '1rem',
    padding: '0.5rem',
    marginBottom: '2rem',
    border: '1px solid rgba(255,255,255,0.1)'
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
    fontFamily: "'Fredoka', system-ui, sans-serif"
  },
  activeTab: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  }
};
function App() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalType, setModalType] = useState<'loot' | 'pantry'>('loot');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [, setGroceryItems] = useState<GroceryItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<'shopping' | 'pantry'>('shopping');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Fetch data on component mount
  useEffect(() => {
    fetchPantryItems();
    fetchGroceryItems();
    fetchShoppingList();
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
        fetchPantryItems();
        fetchShoppingList();
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

  const updateShoppingListQuantity = async (itemId: string, newQuantity: number) => {
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
        fetchShoppingList();
        fetchPantryItems();
      } else {
        console.error('Failed to update shopping list item quantity');
      }
    } catch (error) {
      console.error('Error updating shopping list item quantity:', error);
    }
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
          maxWidth: '550px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
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
            🎯 Add New Treasure to Hunt!
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gap: '1.5rem'}}>
              <input
                type="text"
                placeholder="🏆 What treasure are we hunting? (e.g., Golden Bananas)"
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
                <input
                  type="text"
                  placeholder="🗂️ Category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(255,215,0,0.4)',
                    backgroundColor: 'rgba(139,69,19,0.8)',
                    color: '#ffd700'
                  }}
                />
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
                    color: '#ffd700'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{color: '#ffd700', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    ⚖️ Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
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
                    🚨 Priority Level
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
                    <option value="High">🔥 High Priority</option>
                    <option value="Medium">⚡ Medium Priority</option>
                    <option value="Low">🌟 Low Priority</option>
                  </select>
                </div>
              </div>
              
              <textarea
                placeholder="📜 Quest notes... (any special instructions for this treasure hunt?)"
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
            
            <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '2px solid rgba(255,215,0,0.4)',
                  backgroundColor: 'rgba(139,69,19,0.8)',
                  color: '#ffd700',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🚪 Abandon Quest
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(to right, #ffd700, #ffed4e)',
                  color: '#8b4513',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                🗺️ Start the Hunt!
              </button>
            </div>
          </form>
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
            marginBottom: '2rem', 
            marginTop: '1.5rem',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '1.9rem',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
          }}>
            ✨ Stock the Royal Pantry! ✨
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{display: 'grid', gap: '1.5rem'}}>
              <input
                type="text"
                placeholder="🎭 What magical ingredient shall we add? (e.g., Enchanted Olive Oil)"
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
                <input
                  type="text"
                  placeholder="🎪 Category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'rgba(30, 58, 138, 0.6)',
                    color: '#bfdbfe'
                  }}
                />
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
                    color: '#bfdbfe'
                  }}
                />
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div>
                  <label style={{color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>
                    🎯 Current Stock
                  </label>
                  <input
                    type="number"
                    value={formData.currentCount}
                    onChange={(e) => setFormData({...formData, currentCount: parseInt(e.target.value) || 0})}
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
                    value={formData.minCount}
                    onChange={(e) => setFormData({...formData, minCount: parseInt(e.target.value) || 1})}
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
                    📦 Pack Size
                  </label>
                  <input
                    type="number"
                    value={formData.packSize}
                    onChange={(e) => setFormData({...formData, packSize: parseInt(e.target.value) || 1})}
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
              
              <textarea
                placeholder="📋 Royal decree notes... (special storage instructions or cooking tips)"
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
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  backgroundColor: 'rgba(30, 58, 138, 0.6)',
                  color: '#bfdbfe',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🚪 Close Vault
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 8px rgba(30, 58, 138, 0.3)'
                }}
              >
                👑 Add to Kingdom!
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
            <div style={styles.logoIcon}>
              <img src="/kitchen icon 1.png" alt="Kitchen Icon" style={{width: '32px', height: '32px', objectFit: 'contain'}} />
            </div>
            <div>
              <h1 style={styles.title}>Laurie's Legendary Kitchen</h1>
              <p style={styles.subtitle}>Where culinary magic meets smart organization! ✨</p>
            </div>
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
              <div style={{...styles.quickStatValue, color: '#ef4444'}}>
                {pantryItems.filter(item => item.currentCount < item.minCount).length}
              </div>
              <div style={styles.quickStatLabel}>Items below minimum</div>
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
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'shopping' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('shopping')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17A2 2 0 0 1 15 19H9A2 2 0 0 1 7 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Laurie's Loot List
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === 'pantry' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('pantry')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
              <path d="M19 7H16V6A4 4 0 0 0 8 6V7H5A1 1 0 0 0 4 8V19A3 3 0 0 0 7 22H17A3 3 0 0 0 20 19V8A1 1 0 0 0 19 7ZM10 6A2 2 0 0 1 14 6V7H10V6Z" fill="currentColor"/>
            </svg>
            Laurie's Secret Stash
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'shopping' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <div style={styles.cardIcon}>
                  <img src="/kitchen icon 2.png" alt="Kitchen Icon" style={{width: '36px', height: '36px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Loot List</h2>
                  <p style={styles.cardSubtitle}>Adventures awaiting in the grocery jungle! 🛒✨</p>
                </div>
              </div>
              <button 
                style={styles.addBtn}
                onClick={() => {
                  setModalType('loot');
                  setShowAddModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                🎯 Add Treasure!
              </button>
            </div>
            
            <div style={styles.inventoryList}>
              {shoppingList.length === 0 ? (
                <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                  <img src="/kitchen icon 2.png" alt="Kitchen Icon" style={{width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.6}} />
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
                    if (item.source === 'pantry') {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 7H16V6A4 4 0 0 0 8 6V7H5A1 1 0 0 0 4 8V19A3 3 0 0 0 7 22H17A3 3 0 0 0 20 19V8A1 1 0 0 0 19 7ZM10 6A2 2 0 0 1 14 6V7H10V6Z" fill="white"/>
                        </svg>
                      );
                    }
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17A2 2 0 0 1 15 19H9A2 2 0 0 1 7 17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    );
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
                        <div style={isMobile ? styles.itemRightMobile : styles.itemRight}>
                          <div style={styles.stockInfo}>
                            <p style={styles.stockLabel}>Quantity</p>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <button
                                onClick={() => updateShoppingListQuantity(item.id, Math.max(1, (item.quantity || item.needed || 1) - 1))}
                                style={{
                                  ...(isMobile ? styles.mobileButton : {
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }),
                                  background: 'linear-gradient(to right, #ef4444, #dc2626)'
                                }}
                              >
                                -
                              </button>
                              <div style={{textAlign: 'center'}}>
                                <p style={styles.stockValue}>{item.quantity || item.needed || 1}</p>
                                <p style={styles.stockUnit}>{item.unit}</p>
                              </div>
                              <button
                                onClick={() => updateShoppingListQuantity(item.id, (item.quantity || item.needed || 1) + 1)}
                                style={{
                                  ...(isMobile ? styles.mobileButton : {
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }),
                                  background: 'linear-gradient(to right, #10b981, #059669)'
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
                  <img src="/kitchen icon 1.png" alt="Kitchen Icon" style={{width: '36px', height: '36px', objectFit: 'contain'}} />
                </div>
                <div>
                  <h2 style={styles.cardTitleText}>Laurie's Secret Stash</h2>
                  <p style={styles.cardSubtitle}>The mysterious depths of the kitchen kingdom! 👑</p>
                </div>
              </div>
              <button 
                style={{
                  ...styles.addBtn,
                  background: 'linear-gradient(to right, #6366f1, #8b5cf6)'
                }}
                onClick={() => {
                  setModalType('pantry');
                  setShowAddModal(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '6px'}}>
                  <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                🏺 Top Up Stash!
              </button>
            </div>
            
            <div style={styles.inventoryList}>
              {pantryItems.length === 0 ? (
                <div style={{...styles.inventoryItem, textAlign: 'center', padding: '3rem'}}>
                  <img src="/kitchen icon 1.png" alt="Kitchen Icon" style={{width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 1rem', opacity: 0.6}} />
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem'}}>
                    🕵️‍♀️ Laurie's stash is suspiciously empty... Time for a "Snack Attack"!
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
                    if (item.currentCount === 0) return 'Out';
                    if (item.currentCount <= item.minCount) return 'Low';
                    return 'Good';
                  };
                  
                  const getItemIcon = () => {
                    const category = item.category?.toLowerCase() || '';
                    
                    if (category.includes('dairy')) {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12V7A7 7 0 0 1 19 7V12A7 7 0 0 1 5 12Z" stroke="white" strokeWidth="2"/>
                          <path d="M12 7V17" stroke="white" strokeWidth="2"/>
                        </svg>
                      );
                    }
                    if (category.includes('meat')) {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.84 4.61A5.5 5.5 0 0 0 15.5 3H8.5A5.5 5.5 0 0 0 3.16 4.61A2 2 0 0 0 2 6.5V18A2 2 0 0 0 4 20H20A2 2 0 0 0 22 18V6.5A2 2 0 0 0 20.84 4.61Z" fill="white"/>
                        </svg>
                      );
                    }
                    if (category.includes('produce')) {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2"/>
                          <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      );
                    }
                    if (category.includes('bakery')) {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L13.09 8.26L19 9L14 14.27L15.18 21.02L12 17.77L8.82 21.02L10 14.27L5 9L10.91 8.26L12 2Z" fill="white"/>
                        </svg>
                      );
                    }
                    if (category.includes('pantry') || category.includes('canned')) {
                      return (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2"/>
                          <path d="M8 8H16M8 12H16M8 16H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      );
                    }
                    
                    // Default icon
                    return (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7H16V6A4 4 0 0 0 8 6V7H5A1 1 0 0 0 4 8V19A3 3 0 0 0 7 22H17A3 3 0 0 0 20 19V8A1 1 0 0 0 19 7ZM10 6A2 2 0 0 1 14 6V7H10V6Z" fill="white"/>
                      </svg>
                    );
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
                        <div style={isMobile ? styles.itemRightMobile : styles.itemRight}>
                          <div style={styles.stockInfo}>
                            <p style={styles.stockLabel}>Stock: {item.currentCount}/{item.minCount} {item.unit}</p>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <button
                                onClick={() => updateItemQuantity(item.id, Math.max(0, item.currentCount - 1), false)}
                                style={{
                                  ...(isMobile ? styles.mobileButton : {
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }),
                                  background: 'linear-gradient(to right, #ef4444, #dc2626)'
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
                                  ...(isMobile ? styles.mobileButton : {
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                  }),
                                  background: 'linear-gradient(to right, #10b981, #059669)'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div style={styles.stockInfo}>
                            <p style={styles.stockLabel}>Min Needed</p>
                            <div 
                              style={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)'
                              }}
                              onClick={() => {
                                const newMin = prompt(`Set minimum needed for ${item.name}:`, item.minCount.toString());
                                if (newMin !== null) { // User didn't cancel
                                  const newMinValue = parseInt(newMin);
                                  if (!isNaN(newMinValue) && newMinValue >= 0) {
                                    updateItemMinCount(item.id, newMinValue);
                                  } else {
                                    alert('Please enter a valid number (0 or greater)');
                                  }
                                }
                              }}
                            >
                              <p style={styles.stockValue}>{item.minCount}</p>
                              <p style={styles.stockUnit}>click to edit</p>
                            </div>
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
        )}
      </main>

      {/* Add Item Modals */}
      <LootListModal />
      <PantryModal />

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
