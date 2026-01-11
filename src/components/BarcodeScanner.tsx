import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { fetchProductByBarcode, mapToAppCategory } from '../services/openFoodFacts';

interface BarcodeScannerProps {
  onScanSuccess: (product: {
    name: string;
    category: string;
    currentCount: number;
    minCount: number;
    unit: string;
  }) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'back' | 'front'>('back'); // Default to back camera
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount - use setTimeout to let React finish its cleanup first
      setTimeout(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.stop().catch(() => {
              // Ignore stop errors during cleanup
            });
          } catch (e) {
            // Ignore any errors during cleanup
          }
          try {
            scannerRef.current.clear();
          } catch (e) {
            // Ignore clear errors
          }
          scannerRef.current = null;
        }
      }, 100);
    };
  }, []);

  // Detect if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  };

  // Common scan callback handler
  const createScanCallback = () => {
    return async (decodedText: string) => {
      // Prevent duplicate scans
      if (decodedText === lastScanned) {
        return;
      }
      
      setLastScanned(decodedText);
      setLoading(true);
      
      if (!scannerRef.current) return;
      
      // Stop scanning temporarily
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setScanning(false);
      
      // Fetch product info
      const productInfo = await fetchProductByBarcode(decodedText);
      
      if (productInfo) {
        // Parse quantity if available
        let currentCount = 1;
        let unit = productInfo.unit || 'units';
        
        if (productInfo.quantity) {
          const qtyMatch = productInfo.quantity.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
          if (qtyMatch) {
            currentCount = parseFloat(qtyMatch[1]);
            unit = qtyMatch[2] || unit;
          }
        }
        
        const category = productInfo.category 
          ? mapToAppCategory(productInfo.category)
          : 'Other';
        
        onScanSuccess({
          name: productInfo.name,
          category,
          currentCount,
          minCount: Math.max(0.25, Number((currentCount * 0.3).toFixed(2))),
          unit
        });
        
        // Close scanner after successful scan
        onClose();
      } else {
        setError(`Product not found for barcode: ${decodedText}. You can add it manually.`);
        setLoading(false);
        // Resume scanning after a delay
        setTimeout(() => {
          startScanning();
        }, 2000);
      }
    };
  };

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);
      setLoading(true);

      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      // Use user-selected camera mode
      const scanCallback = createScanCallback();
      const errorCallback = (errorMessage: string) => {
        // Ignore scanning errors (they're frequent during scanning)
      };
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      // Use selected camera mode
      const cameraConfig: any = cameraMode === 'back'
        ? { facingMode: 'environment' } // Back camera
        : { facingMode: 'user' }; // Front camera

      try {
        await scanner.start(cameraConfig, config, scanCallback, errorCallback);
        setLoading(false);
        return;
      } catch (configError: any) {
        // If OverconstrainedError, try alternative facing mode
        if (configError.name === 'OverconstrainedError' || configError.message?.includes('Overconstrained')) {
          console.warn('Selected camera config failed, trying alternative:', configError);
          try {
            // Try the opposite facing mode
            const alternativeConfig = cameraMode === 'back'
              ? { facingMode: 'user' } // Try front camera if back fails
              : { facingMode: 'environment' }; // Try back camera if front fails
            
            await scanner.start(alternativeConfig, config, scanCallback, errorCallback);
            setLoading(false);
            return;
          } catch (fallbackError: any) {
            console.error('Fallback camera config also failed:', fallbackError);
            setError('Failed to access camera. Please check permissions or try switching camera mode.');
            setScanning(false);
            setLoading(false);
            return;
          }
        }
        // For other errors, rethrow
        throw configError;
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setScanning(false);
      setLoading(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err: any) {
        // Ignore "scanner is not running" errors
        if (!err.message?.includes('not running') && !err.message?.includes('not paused')) {
          console.error('Error stopping scanner:', err);
        }
      }
      try {
        await scannerRef.current.clear();
      } catch (err) {
        // Ignore clear errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            📷 Barcode Scanner
          </h2>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {/* Camera Toggle */}
            <button
              onClick={async () => {
                if (scanning) {
                  // If scanning, stop first, then switch
                  await stopScanning();
                }
                setCameraMode(prev => prev === 'back' ? 'front' : 'back');
                // If we were scanning, restart with new camera
                if (scanning) {
                  setTimeout(() => {
                    startScanning();
                  }, 500);
                }
              }}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: scanning 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '0.5rem',
                color: '#60a5fa',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.5 : 1
              }}
              title={cameraMode === 'back' ? 'Switch to front camera' : 'Switch to back camera'}
            >
              {cameraMode === 'back' ? '📷 Back' : '📱 Front'}
            </button>
            <button
              onClick={() => {
                stopScanning();
                onClose();
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div
          id="barcode-scanner"
          key={`scanner-${cameraMode}`}
          style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            borderRadius: '1rem',
            overflow: 'hidden',
            backgroundColor: '#000',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!scanning && !loading && (
            <div style={{
              color: 'white',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                Click "Start Scanner" to begin
              </p>
              <button
                onClick={startScanning}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
              >
                Start Scanner
              </button>
            </div>
          )}
          
          {loading && (
            <div style={{
              color: 'white',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <p style={{ fontSize: '1.1rem' }}>Loading product information...</p>
            </div>
          )}
        </div>

        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem',
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            💡 Point your {cameraMode === 'back' ? 'back camera' : 'front camera'} at a product barcode
          </p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>
            💡 Tip: Use the camera toggle to switch between back and front cameras
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            Using Open Food Facts - Free & Open Source Product Database
          </p>
        </div>
      </div>
    </div>
  );
};
