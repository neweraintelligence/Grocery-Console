import React from 'react';

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
    position: 'relative' as const,
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    position: 'sticky' as const,
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
            <button style={styles.quickAddBtn}>+ Quick Add</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={{...styles.grid, gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width: 1280px)': {gridTemplateColumns: '3fr 2fr'}}}>
          
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
              <div style={styles.inventoryItem}>
                <div style={styles.itemContent}>
                  <div style={styles.itemLeft}>
                    <div style={{...styles.itemIcon, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'}}>🥛</div>
                    <div style={styles.itemDetails}>
                      <h3 style={styles.itemName}>Organic Milk</h3>
                      <p style={styles.itemCategory}>Dairy • Added 2 days ago</p>
                    </div>
                  </div>
                  <div style={styles.itemRight}>
                    <div style={styles.stockInfo}>
                      <p style={styles.stockLabel}>Current Stock</p>
                      <p style={styles.stockValue}>1</p>
                      <p style={styles.stockUnit}>cartons</p>
                    </div>
                    <div style={styles.stockInfo}>
                      <p style={styles.stockLabel}>Min Required</p>
                      <p style={styles.stockValue}>2</p>
                      <p style={styles.stockUnit}>cartons</p>
                    </div>
                    <div style={{...styles.statusBadge, ...styles.statusLow}}>Running Low</div>
                  </div>
                </div>
              </div>

              <div style={styles.inventoryItem}>
                <div style={styles.itemContent}>
                  <div style={styles.itemLeft}>
                    <div style={{...styles.itemIcon, background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>🍞</div>
                    <div style={styles.itemDetails}>
                      <h3 style={styles.itemName}>Sourdough Bread</h3>
                      <p style={styles.itemCategory}>Bakery • Last used yesterday</p>
                    </div>
                  </div>
                  <div style={styles.itemRight}>
                    <div style={styles.stockInfo}>
                      <p style={styles.stockLabel}>Current Stock</p>
                      <p style={styles.stockValue}>0</p>
                      <p style={styles.stockUnit}>loaves</p>
                    </div>
                    <div style={styles.stockInfo}>
                      <p style={styles.stockLabel}>Min Required</p>
                      <p style={styles.stockValue}>1</p>
                      <p style={styles.stockUnit}>loaves</p>
                    </div>
                    <div style={{...styles.statusBadge, ...styles.statusOut}}>Out of Stock</div>
                  </div>
                </div>
              </div>

              <div style={styles.inventoryItem}>
                <div style={styles.itemContent}>
                  <div style={styles.itemLeft}>
                    <div style={{...styles.itemIcon, background: 'linear-gradient(135deg, #10b981, #059669)'}}>🍌</div>
                    <div style={styles.itemDetails}>
                      <h3 style={styles.itemName}>Organic Bananas</h3>
                      <p style={styles.itemCategory}>Produce • Fresh & ripe</p>
                    </div>
                  </div>
                  <div style={styles.itemRight}>
                    <div style={styles.stockInfo}>
                      <p style={styles.stockLabel}>Current Stock</p>
                      <p style={styles.stockValue}>3</p>
                      <p style={styles.stockUnit}>bunches</p>
                    </div>
                    <div style={styles.stockInfo}>
                      <p style={styles.stockLabel}>Min Required</p>
                      <p style={styles.stockValue}>2</p>
                      <p style={styles.stockUnit}>bunches</p>
                    </div>
                    <div style={{...styles.statusBadge, ...styles.statusGood}}>Well Stocked</div>
                  </div>
                </div>
              </div>
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
              
              <div style={styles.listItem}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div style={{width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'linear-gradient(to right, #eab308, #f97316)'}}></div>
                    <div>
                      <p style={{color: 'white', fontWeight: '500', margin: 0}}>Organic Milk</p>
                      <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0}}>Need 1 more carton</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={styles.listItem}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div style={{width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'linear-gradient(to right, #ef4444, #ec4899)'}}></div>
                    <div>
                      <p style={{color: 'white', fontWeight: '500', margin: 0}}>Sourdough Bread</p>
                      <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0}}>Need 1 fresh loaf</p>
                    </div>
                  </div>
                </div>
              </div>
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
                  <span style={{...styles.statValue, color: 'white'}}>12</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Running Low</span>
                  <span style={{...styles.statValue, color: '#fbbf24'}}>2</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Categories</span>
                  <span style={{...styles.statValue, color: 'white'}}>5</span>
                </div>
                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Recipes Available</span>
                  <span style={{...styles.statValue, color: '#34d399'}}>8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
