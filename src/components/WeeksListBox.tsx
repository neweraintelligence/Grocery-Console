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
      
      const weeklyList = predictiveRestockService.getWeeklyRestockList(convertedItems);
      setPredictions(weeklyList);
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
      case 'critical': return 'linear-gradient(to right, rgba(239,68,68,0.8), rgba(220,38,38,0.8))';
      case 'high': return 'linear-gradient(to right, rgba(249,115,22,0.8), rgba(234,88,12,0.8))';
      case 'medium': return 'linear-gradient(to right, rgba(234,179,8,0.8), rgba(202,138,4,0.8))';
      case 'low': return 'linear-gradient(to right, rgba(34,197,94,0.8), rgba(22,163,74,0.8))';
      default: return 'rgba(156,163,175,0.8)';
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
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        position: 'relative'
      }}>
        {/* Animated Friday Banner */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e, #ffd700)',
          padding: '0.7rem 2rem',
          borderRadius: '1.5rem',
          border: '2px solid rgba(255,215,0,0.8)',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#8b4513',
          boxShadow: '0 8px 16px rgba(255,215,0,0.3)',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
          whiteSpace: 'nowrap'
        }}>
          🎉 FRIDAY'S HERE! WEEKS LIST TIME! 🎉
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
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
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          marginBottom: '3rem'
        }}>
          <h2 style={{
            color: 'white',
            fontFamily: "'Fredoka', system-ui, sans-serif",
            fontSize: '2.2rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
          }}>
            🛒 Laurie's Weekly Adventure List! ✨
          </h2>
                     <p style={{
             color: 'rgba(255,255,255,0.9)',
             fontSize: '1.1rem',
             margin: '0 0 1rem 0',
             fontWeight: '500'
           }}>
             New food adventures await! Here's your culinary roadmap for the week ahead! 🌟
           </p>
        </div>

        {/* Summary Stats */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                {predictions.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Total Items
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b6b' }}>
                {predictions.filter(p => p.urgency === 'critical').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Critical Items
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd93d' }}>
                {predictions.filter(p => p.urgency === 'high').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                High Priority
              </div>
            </div>
            
          </div>
        </div>

        {/* Items List */}
        <div style={{
          maxHeight: '40vh',
          overflowY: 'auto',
          marginBottom: '1.5rem',
          paddingRight: '0.5rem'
        }}>
          {predictions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>
                All stocked up for the week!
              </h3>
              <p style={{ margin: 0 }}>
                Your pantry is in great shape. Enjoy your weekend!
              </p>
            </div>
          ) : (
            predictions.map((prediction, index) => (
              <div key={prediction.itemId || index} style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '1rem',
                padding: '1rem',
                marginBottom: '0.75rem',
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
                  <div style={{
                    fontSize: '1.5rem'
                  }}>
                    {getUrgencyEmoji(prediction.urgency)}
                  </div>
                  <div>
                    <h4 style={{
                      color: 'white',
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      {prediction.itemName}
                    </h4>
                    <p style={{
                      color: 'rgba(255,255,255,0.7)',
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.875rem'
                    }}>
                      {prediction.category} • Need {prediction.recommendedQuantity} • 
                      Run out: {formatDate(prediction.predictedRunOutDate)}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    background: getUrgencyColor(prediction.urgency),
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    {prediction.urgency.toUpperCase()}
                  </div>
                                     <div style={{
                     textAlign: 'right',
                     color: 'white'
                   }}>
                     <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                       {prediction.bestStore}
                     </div>
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
          paddingTop: '1rem',
          borderTop: '2px solid rgba(255,255,255,0.2)',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'white',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              style={{
                marginRight: '0.25rem'
              }}
            />
            Include detailed reasoning in PDF
          </label>

          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={handleClose}
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
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            >
              Maybe Later
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || predictions.length === 0}
              style={{
                padding: '0.75rem 2rem',
                background: isGeneratingPDF 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'linear-gradient(to right, #ffd700, #ffed4e)',
                color: isGeneratingPDF ? 'rgba(255,255,255,0.7)' : '#8b4513',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: isGeneratingPDF || predictions.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isGeneratingPDF || predictions.length === 0 ? 0.6 : 1
              }}
            >
              {isGeneratingPDF ? (
                <>
                  <span>📄</span> Generating PDF...
                </>
              ) : (
                <>
                  <span>📥</span> Download Weeks List!
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add CSS animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
};