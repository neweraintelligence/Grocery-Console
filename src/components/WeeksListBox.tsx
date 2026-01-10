import React, { useState, useEffect } from 'react';
import { predictiveRestockService } from '../services/predictiveRestock';
import { pdfGeneratorService } from '../services/pdfGenerator';

interface WeeksListBoxProps {
  pantryItems: any[]; // This will now be shopping list items
  isVisible?: boolean;
  onClose?: () => void;
}

interface RestockPrediction {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  predictedRunOutDate: Date;
  recommendedRestockDate: Date;
  recommendedQuantity: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  bestStore: string;
  reasoning: string[];
}

// Simple Spinner component for loading states
const Spinner = ({ size = 20, color = 'white' }: { size?: number, color?: string }) => (
  <div style={{
    width: size,
    height: size,
    border: `2px solid ${color}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }} />
);

export const WeeksListBox: React.FC<WeeksListBoxProps> = ({ 
  pantryItems, 
  isVisible: propIsVisible,
  onClose 
}) => {
  const [predictions, setPredictions] = useState<RestockPrediction[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if it's Friday and should show the component
  useEffect(() => {
    const checkFridayStatus = () => {
      const isFridayTime = predictiveRestockService.isFridayRestockTime();
      if (propIsVisible !== undefined) {
        setIsVisible(propIsVisible);
      } else {
        setIsVisible(isFridayTime);
      }
    };

    checkFridayStatus();
    
    // Check every minute for Friday status
    const interval = setInterval(checkFridayStatus, 60000);
    
    return () => clearInterval(interval);
  }, [propIsVisible]);

  // Generate predictions when component becomes visible
  useEffect(() => {
    if (isVisible && pantryItems.length > 0) {
      // Convert shopping list items to the format expected by predictive service
      const convertedItems = pantryItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        currentCount: item.quantity || 1,
        minCount: 1,
        unit: item.unit || 'units',
        lastUpdated: new Date().toISOString()
      }));
      
      // Show all items instead of filtering by predictive restock
      const allItems = convertedItems.map(item => ({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock: item.currentCount,
        predictedRunOutDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 1 week from now
        recommendedRestockDate: new Date(Date.now() + (24 * 60 * 60 * 1000)), // Tomorrow
        recommendedQuantity: item.currentCount,
        confidence: 1.0,
        urgency: 'medium' as const,
        bestStore: 'Grocery Store',
        reasoning: ['Added to weekly shopping list']
      }));
      
      setPredictions(allItems);
    }
  }, [isVisible, pantryItems]);

  const handleDownloadPDF = async () => {
    if (predictions.length === 0) {
      alert('No items to include in the weekly list!');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Convert predictions to the format expected by PDF generator
      const weeklyListItems = predictions.map(prediction => ({
        name: prediction.itemName,
        category: prediction.category,
        quantity: prediction.recommendedQuantity,
        unit: 'units', // Could be enhanced to use actual units
        urgency: prediction.urgency,
        bestStore: prediction.bestStore,
        reasoning: prediction.reasoning,
        predictedRunOutDate: prediction.predictedRunOutDate
      }));

             await pdfGeneratorService.generateWeeklyListPDF(weeklyListItems, {
         includeImages: true,
         includePricing: false,
         includeStoreInfo: true,
         includeReasoningDetails: showDetails,
         colorScheme: 'colorful',
         paperSize: 'letter'
       });

      // Show success message
      alert('📄 Your weekly grocery list has been downloaded! Happy shopping! 🛒✨');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Sorry, there was an error generating your PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'rgba(239, 68, 68, 0.2)';
      case 'high': return 'rgba(249, 115, 22, 0.2)';
      case 'medium': return 'rgba(234, 179, 8, 0.2)';
      case 'low': return 'rgba(34, 197, 94, 0.2)';
      default: return 'rgba(156, 163, 175, 0.1)';
    }
  };

  const getUrgencyTextColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#f87171';
      case 'high': return '#fb923c';
      case 'medium': return '#fbbf24';
      case 'low': return '#4ade80';
      default: return '#9ca3af';
    }
  };

  const getUrgencyEmoji = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '3rem',
        width: '95%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Animated Friday Banner */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          padding: '0.75rem 2.5rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '1rem',
          fontWeight: '800',
          color: '#451a03',
          boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)',
          whiteSpace: 'nowrap',
          zIndex: 10,
          letterSpacing: '0.05em'
        }}>
          FRIDAY'S HERE! WEEKS LIST TIME! 🎉
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
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

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem'
        }}>
          <h2 style={{
            color: 'white',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '2.5rem',
            fontWeight: '800',
            margin: '0 0 0.75rem 0',
            background: 'linear-gradient(to right, #fff, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Weekly Adventure List! ✨
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1.125rem',
            margin: '0',
            fontWeight: '500'
          }}>
            New food adventures await! Here's your roadmap for the week ahead! 🌟
          </p>
        </div>

        {/* Summary Stats */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white' }}>
              {predictions.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginTop: '0.25rem' }}>
              Total Items
            </div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f87171' }}>
              {predictions.filter(p => p.urgency === 'critical').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginTop: '0.25rem' }}>
              Critical
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fbbf24' }}>
              {predictions.filter(p => p.urgency === 'high').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginTop: '0.25rem' }}>
              High Priority
            </div>
          </div>
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
          {predictions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'rgba(255, 255, 255, 0.4)',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '1.5rem',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🎉</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem', fontWeight: '700' }}>
                All stocked up!
              </h3>
              <p style={{ margin: 0, fontSize: '1rem' }}>
                Your pantry is in great shape for the week.
              </p>
            </div>
          ) : (
            predictions.map((prediction, index) => (
              <div key={prediction.itemId || index} style={{
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
                    {getUrgencyEmoji(prediction.urgency)}
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
                      {prediction.itemName}
                    </h4>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      margin: '0.375rem 0 0 0',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{prediction.category}</span> • Need {prediction.recommendedQuantity} • 
                      Run out: {formatDate(prediction.predictedRunOutDate)}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexShrink: 0
                }}>
                  <div style={{
                    padding: '0.625rem 1rem',
                    borderRadius: '0.875rem',
                    background: getUrgencyColor(prediction.urgency),
                    color: getUrgencyTextColor(prediction.urgency),
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    minWidth: '85px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: `1px solid ${getUrgencyTextColor(prediction.urgency)}22`
                  }}>
                    {prediction.urgency}
                  </div>
                  <div style={{
                    textAlign: 'right',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {prediction.bestStore}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.9375rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                accentColor: '#fbbf24',
                cursor: 'pointer'
              }}
            />
            Include details in PDF
          </label>

          <div style={{
            display: 'flex',
            gap: '1rem',
            flex: '1',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleClose}
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
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
            >
              Maybe Later
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || predictions.length === 0}
              style={{
                padding: '1rem 2.5rem',
                background: isGeneratingPDF 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: isGeneratingPDF ? 'rgba(255, 255, 255, 0.4)' : '#451a03',
                border: 'none',
                borderRadius: '1rem',
                cursor: isGeneratingPDF || predictions.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                fontSize: '1rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: isGeneratingPDF ? 'none' : '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingPDF && predictions.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(245, 158, 11, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGeneratingPDF && predictions.length > 0) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(245, 158, 11, 0.4)';
                }
              }}
            >
              {isGeneratingPDF ? (
                <>
                  <Spinner size={18} color="rgba(69, 26, 3, 0.6)" />
                  Generating...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1.25rem' }}>📥</span>
                  Download Weeks List!
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add CSS animation styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
};