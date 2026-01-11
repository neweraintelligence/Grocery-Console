import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

interface ReceiptScannerProps {
  onItemsExtracted: (items: ReceiptItem[]) => void;
  onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onItemsExtracted, onClose }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Stop camera if running
    if (cameraStream) {
      stopCamera();
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process the image
    await processReceiptImage(file);
  };

  const startCamera = async () => {
    try {
      setError(null);
      setScanning(true);
      
      // Use back camera on mobile, default camera on laptop/desktop
      const isMobile = isMobileDevice();
      const cameraConfig = isMobile 
        ? { facingMode: 'environment' } // Back camera on mobile
        : {}; // Default camera on laptop/desktop

      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraConfig
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions or use file upload instead.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setProcessing(true);
      setError(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setError('Failed to capture image');
            setProcessing(false);
            return;
          }

          // Create preview
          const previewUrl = URL.createObjectURL(blob);
          setPreview(previewUrl);

          // Stop camera
          stopCamera();

          // Process the image
          const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
          await processReceiptImage(file);
        }, 'image/jpeg', 0.9);
      }
    } catch (err: any) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again.');
      setProcessing(false);
    }
  };

  const processReceiptImage = async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      // Initialize Tesseract worker
      const worker = await createWorker('eng');
      
      // Perform OCR
      const { data: { text } } = await worker.recognize(file);
      
      // Terminate worker
      await worker.terminate();

      // Parse the extracted text into items
      const items = parseReceiptText(text);
      
      if (items.length === 0) {
        setError('No items found in receipt. Please try a clearer image or add items manually.');
        setProcessing(false);
        return;
      }

      // Pass items to parent for review
      onItemsExtracted(items);
    } catch (err: any) {
      console.error('Error processing receipt:', err);
      setError(err.message || 'Failed to process receipt image. Please try again.');
      setProcessing(false);
    }
  };

  const parseReceiptText = (text: string): ReceiptItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ReceiptItem[] = [];
    
    // Common patterns in receipts:
    // - Item name followed by price
    // - Item name, quantity, price
    // - Item name with quantity embedded
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip lines that are clearly not items
      if (
        trimmed.match(/^(TOTAL|SUBTOTAL|TAX|CHANGE|CASH|CARD|RECEIPT|DATE|TIME|STORE|THANK|YOU)/i) ||
        trimmed.match(/^\$?\d+\.\d{2}$/) || // Just a price
        trimmed.length < 3 ||
        trimmed.match(/^\d+$/) // Just numbers
      ) {
        continue;
      }

      // Try to extract item name and quantity
      // Pattern 1: "Item Name $X.XX" or "Item Name X.XX"
      // Pattern 2: "Item Name Qty X" or "Item Name X units"
      // Pattern 3: "X Item Name"
      
      let itemName = '';
      let quantity = 1;
      let unit = 'units';

      // Remove price at the end (e.g., "$5.99" or "5.99")
      const withoutPrice = trimmed.replace(/\s+\$?\d+\.\d{2}\s*$/, '').trim();
      
      // Try to find quantity patterns
      const qtyPattern1 = withoutPrice.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i); // "2 Apples"
      const qtyPattern2 = withoutPrice.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(pcs?|units?|lbs?|oz|kg|g|ml|l|pack|packs|box|boxes|bottle|bottles|can|cans)$/i); // "Apples 2 pcs"
      const qtyPattern3 = withoutPrice.match(/^(.+?)\s+x\s*(\d+)$/i); // "Apples x 2"
      
      if (qtyPattern1) {
        quantity = parseFloat(qtyPattern1[1]);
        itemName = qtyPattern1[2].trim();
      } else if (qtyPattern2) {
        itemName = qtyPattern2[1].trim();
        quantity = parseFloat(qtyPattern2[2]);
        unit = qtyPattern2[3]?.toLowerCase() || 'units';
      } else if (qtyPattern3) {
        itemName = qtyPattern3[1].trim();
        quantity = parseFloat(qtyPattern3[2]);
      } else {
        // No quantity found, use the whole line as item name
        itemName = withoutPrice;
      }

      // Clean up item name (remove common receipt artifacts)
      itemName = itemName
        .replace(/\s+/g, ' ')
        .replace(/^[@#*]\s*/, '')
        .trim();

      // Skip if item name is too short or looks invalid
      if (itemName.length < 2 || itemName.match(/^\d+$/)) {
        continue;
      }

      // Categorize the item
      const category = categorizeItem(itemName);

      items.push({
        id: `receipt-${Date.now()}-${items.length}`,
        name: itemName,
        quantity,
        unit,
        category
      });
    }

    return items;
  };

  const categorizeItem = (itemName: string): string => {
    const name = itemName.toLowerCase();
    
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('grape') || name.includes('berry') || name.includes('fruit') ||
        name.includes('lettuce') || name.includes('spinach') || name.includes('carrot') ||
        name.includes('tomato') || name.includes('cucumber') || name.includes('pepper') ||
        name.includes('onion') || name.includes('potato') || name.includes('broccoli')) {
      return 'Fresh Produce';
    }
    
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') ||
        name.includes('butter') || name.includes('cream') || name.includes('egg')) {
      return 'Dairy & Eggs';
    }
    
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
        name.includes('fish') || name.includes('salmon') || name.includes('tuna') ||
        name.includes('shrimp') || name.includes('meat') || name.includes('turkey')) {
      return 'Meat & Seafood';
    }
    
    if (name.includes('rice') || name.includes('pasta') || name.includes('flour') ||
        name.includes('sugar') || name.includes('salt') || name.includes('oil') ||
        name.includes('vinegar') || name.includes('sauce') || name.includes('spice')) {
      return 'Pantry Staples';
    }
    
    if (name.includes('bread') || name.includes('bagel') || name.includes('muffin') ||
        name.includes('croissant') || name.includes('cake') || name.includes('cookie')) {
      return 'Bakery';
    }
    
    if (name.includes('juice') || name.includes('soda') || name.includes('water') ||
        name.includes('coffee') || name.includes('tea') || name.includes('beer') ||
        name.includes('wine') || name.includes('drink')) {
      return 'Beverages';
    }
    
    if (name.includes('frozen') || name.includes('ice cream')) {
      return 'Frozen Foods';
    }
    
    if (name.includes('chip') || name.includes('cracker') || name.includes('nut') ||
        name.includes('candy') || name.includes('chocolate')) {
      return 'Snacks';
    }
    
    return 'Other';
  };

  // Cleanup camera on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
            🧾 Receipt Scanner
          </h2>
          <button
            onClick={() => {
              stopCamera();
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

        {/* Camera Preview */}
        {scanning && !preview && (
          <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            backgroundColor: '#000'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={stopCamera}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={processing}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: processing ? 'rgba(100, 100, 100, 0.5)' : '#3b82f6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: processing ? 'not-allowed' : 'pointer'
                }}
              >
                📸 Capture
              </button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {preview && !scanning && (
          <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            borderRadius: '1rem',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <img 
              src={preview} 
              alt="Receipt preview" 
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        {!scanning && !processing && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'stretch',
            width: '100%'
          }}>
            <button
              onClick={startCamera}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              📷 Use Camera
            </button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.875rem'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
              <span>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              📁 Upload Image
            </button>
          </div>
        )}

        {processing && (
          <div style={{
            color: 'white',
            textAlign: 'center',
            fontSize: '0.9rem',
            padding: '2rem'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>⏳ Processing receipt...</p>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>
              Extracting items from receipt. This may take a few seconds.
            </p>
          </div>
        )}

        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem',
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            💡 Tips for best results:
          </p>
          <ul style={{
            margin: 0,
            paddingLeft: '1.5rem',
            textAlign: 'left',
            fontSize: '0.8rem'
          }}>
            <li>Use a clear, well-lit {isMobileDevice() ? 'photo with your back camera' : 'photo'}</li>
            <li>Ensure text is readable and not blurry</li>
            <li>You'll be able to review and adjust items before adding</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
