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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  // Detect if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  };

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);
      setLoading(true);

      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      // Use back camera on mobile, default camera on laptop/desktop
      const isMobile = isMobileDevice();
      let cameraConfig: any;
      
      if (isMobile) {
        cameraConfig = { facingMode: 'environment' }; // Back camera on mobile
      } else {
        // For desktop, try to get available cameras and use the first one
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          if (videoDevices.length > 0) {
            cameraConfig = { deviceId: { exact: videoDevices[0].deviceId } };
          } else {
            // Fallback: use user-facing camera
            cameraConfig = { facingMode: 'user' };
          }
        } catch (err) {
          // If enumeration fails, use user-facing camera
          cameraConfig = { facingMode: 'user' };
        }
      }

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Prevent duplicate scans
          if (decodedText === lastScanned) {
            return;
          }
          
          setLastScanned(decodedText);
          setLoading(true);
          
          // Stop scanning temporarily
          await scanner.stop();
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
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );
      
      setLoading(false);
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
          marginBottom: '1rem'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            📷 Barcode Scanner
          </h2>
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
            💡 Point {isMobileDevice() ? 'your back camera' : 'your camera'} at a product barcode
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            Using Open Food Facts - Free & Open Source Product Database
          </p>
        </div>
      </div>
    </div>
  );
};
