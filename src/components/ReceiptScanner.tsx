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

    // Validate file size
    if (file.size === 0) {
      setError('Selected file is empty. Please choose a valid image.');
      return;
    }

    console.log('📁 Selected file size:', file.size, 'bytes, type:', file.type);

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
      
      if (!ctx) {
        setError('Failed to get canvas context');
        setProcessing(false);
        return;
      }
      
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to blob using Promise-based approach
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
          } else {
            resolve(blob);
          }
        }, 'image/jpeg', 0.95); // Higher quality for better OCR
      });

      console.log('📷 Captured image blob size:', blob.size, 'bytes');

      // Create preview
      const previewUrl = URL.createObjectURL(blob);
      setPreview(previewUrl);

      // Stop camera
      stopCamera();

      // Process the image - pass blob directly or create proper File
      await processReceiptImage(blob);
    } catch (err: any) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again.');
      setProcessing(false);
    }
  };

  // Helper function to scale image if too small (improves OCR accuracy)
  const scaleImageIfNeeded = async (fileOrBlob: File | Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = fileOrBlob instanceof File 
        ? URL.createObjectURL(fileOrBlob)
        : URL.createObjectURL(fileOrBlob);
      
      img.onload = () => {
        // If image is small, scale it up for better OCR
        const minDimension = Math.min(img.width, img.height);
        const maxDimension = Math.max(img.width, img.height);
        
        // If image is too small, scale it up
        if (maxDimension < 1000) {
          const scale = 2000 / maxDimension;
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              if (blob) {
                console.log(`📏 Scaled image: ${img.width}x${img.height} → ${canvas.width}x${canvas.height}`);
                resolve(blob);
              } else {
                reject(new Error('Failed to create scaled image'));
              }
            }, 'image/png', 1.0);
          } else {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to get canvas context'));
          }
        } else {
          // Image is large enough, use as-is
          URL.revokeObjectURL(url);
          resolve(fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const processReceiptImage = async (fileOrBlob: File | Blob) => {
    setProcessing(true);
    setError(null);

    try {
      console.log('🔄 Starting OCR processing...');
      console.log('📷 Image size:', fileOrBlob.size, 'bytes, type:', fileOrBlob.type);
      
      // Validate file/blob has content
      if (fileOrBlob.size === 0) {
        setError('Image file is empty. Please try capturing or uploading again.');
        setProcessing(false);
        return;
      }
      
      // Scale image if too small (improves OCR)
      let imageToProcess: Blob;
      try {
        imageToProcess = await scaleImageIfNeeded(fileOrBlob);
      } catch (scaleError) {
        console.warn('⚠️ Image scaling failed, using original:', scaleError);
        imageToProcess = fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]);
      }
      
      // Initialize Tesseract worker
      const worker = await createWorker('eng');
      
      // Try different PSM modes for better receipt recognition
      const psmModes = [4, 6, 11]; // PSM 4: single column, PSM 6: uniform block, PSM 11: sparse text
      let bestResult: { text: string; confidence: number } | null = null;
      
      for (const psmMode of psmModes) {
        try {
          await worker.setParameters({
            tessedit_pageseg_mode: psmMode as any,
            preserve_interword_spaces: '1',
          });
          
          console.log(`🔍 Trying OCR with PSM ${psmMode}...`);
          const result = await worker.recognize(imageToProcess);
          
          if (!bestResult || result.data.confidence > bestResult.confidence) {
            bestResult = {
              text: result.data.text,
              confidence: result.data.confidence
            };
            console.log(`✅ PSM ${psmMode} confidence: ${result.data.confidence.toFixed(1)}%`);
          }
        } catch (err) {
          console.log(`⚠️ PSM ${psmMode} failed:`, err);
        }
      }
      
      // Terminate worker
      await worker.terminate();

      if (!bestResult || !bestResult.text || bestResult.text.trim().length < 10) {
        setError('OCR could not extract readable text from the receipt. Please try:\n• Better lighting\n• Hold camera steady\n• Ensure receipt is flat and in focus\n• Try uploading a higher resolution image');
        setProcessing(false);
        return;
      }

      const { text, confidence } = bestResult;
      console.log('📊 Best OCR confidence:', confidence.toFixed(1), '%');

      // Log raw OCR text for debugging
      console.log('📄 Raw OCR text:', text);
      const lines = text.split('\n').filter(l => l.trim());
      console.log('📄 OCR lines (' + lines.length + '):', lines);

      // Parse the extracted text into items
      const items = parseReceiptText(text);
      
      console.log('📦 Parsed items:', items);
      
      if (items.length === 0) {
        // If no items found, show more detailed error with raw text preview
        if (lines.length < 3) {
          setError(`OCR could not read the receipt clearly (only ${lines.length} lines detected). Please try:\n• Better lighting\n• Hold camera steady\n• Ensure receipt is flat and in focus\n• Try uploading a higher resolution image`);
        } else {
          // Show first few lines of OCR text to help debug
          const preview = lines.slice(0, 5).join('\n');
          setError(`No grocery items found in receipt (confidence: ${Math.round(confidence)}%).\n\nOCR extracted text:\n${preview}${lines.length > 5 ? '\n...' : ''}\n\nYou can add items manually.`);
        }
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
    
    console.log('🔍 Parsing', lines.length, 'lines from OCR');
    
    // Skip common receipt headers and footers - more comprehensive list
    const skipPatterns = [
      /^(TOTAL|SUBTOTAL|SUB TOTAL|TAX|GST|HST|PST|CHANGE|CASH|CARD|RECEIPT|DATE|TIME|STORE|THANK|YOU|APPROVED|RESULT|TERM|SEQUENCE|DEBIT|CREDIT|PAYMENT)/i,
      /^(FARMER|TABLE|ADDRESS|TEL|PHONE|EMAIL|@|\.com|\.ca|\.org|WWW)/i,
      /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/, // Dates
      /^\d{2}:\d{2}(:\d{2})?/, // Times
      /^[A-Z]{2,}\s*\d{4,}$/, // Transaction IDs like "FE010003"
      /^(WE VALUE|PLEASE EMAIL|FEEDBACK|COMMENTS|VISIT|SURVEY)/i,
      /^\$?\d+\.\d{2}$/, // Just a price
      /^\d{5,}$/, // Long number sequences
      /^#?\d{4,}$/, // Order/receipt numbers
      /^(VISA|MASTERCARD|AMEX|INTERAC|CHIP)/i,
    ];
    
    // Skip exact matches (case insensitive)
    const skipExact = new Set([
      'sub total', 'subtotal', 'total', 'tax', 'gst', 'hst', 'pst',
      'cash', 'change', 'thank you', 'thanks', 'approved', 'declined',
      'debit', 'credit', 'visa', 'mastercard', 'amex', 'interac',
    ]);
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Skip empty or very short lines
      if (trimmed.length < 2) {
        continue;
      }
      
      // Skip exact matches
      if (skipExact.has(trimmed.toLowerCase())) {
        console.log('⏭️ Skipping (exact match):', trimmed);
        continue;
      }
      
      // Skip lines matching skip patterns
      if (skipPatterns.some(pattern => pattern.test(trimmed))) {
        console.log('⏭️ Skipping (pattern):', trimmed);
        continue;
      }
      
      // Skip lines that are clearly addresses, phone numbers, or emails
      if (
        trimmed.match(/\d{3,}.*(AVE|ST|RD|BLVD|STREET|AVENUE|DRIVE|DR|LANE|LN)/i) ||
        trimmed.match(/[A-Z]\d[A-Z]\s*\d[A-Z]\d/i) || // Postal codes
        trimmed.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) || // Phone numbers
        trimmed.match(/@.*\.(com|ca|org|net)/i) || // Emails
        trimmed.match(/^Sequence/i) ||
        trimmed.match(/^Result/i) ||
        trimmed.match(/^Term/i)
      ) {
        console.log('⏭️ Skipping (address/phone/email):', trimmed);
        continue;
      }

      // Try to extract item name and quantity
      let itemName = '';
      let quantity = 1;
      let unit = 'units';

      // Remove price at the end (various formats)
      let withoutPrice = trimmed
        .replace(/\s+\$?\d+\.\d{2}\s*[A-Z]?\s*$/, '') // Remove trailing price (with optional letter like "F")
        .replace(/\s+\$\d+\.\d{2}.*$/, '') // Remove $ price and anything after
        .replace(/\s+\d+\.\d{2}\s*$/, '') // Remove trailing decimal price
        .replace(/\s+@\s+\$?\d+\.\d+\/[a-z]+/gi, '') // Remove "@ $X.XX/unit" patterns
        .replace(/\s+\d+@\s+\d+\/\$?\d+\.\d+/gi, '') // Remove "X@ Y/$Z.ZZ" patterns
        .replace(/\s+\d+\/\$?\d+\.\d+/gi, '') // Remove "3/$2.50" patterns
        .trim();
      
      // Extract weight-based quantity patterns like ".370 kg" at the start
      const weightPattern = withoutPrice.match(/^\.?(\d+\.?\d*)\s*(kg|g|lb|lbs|oz)\b\s*(.*)$/i);
      if (weightPattern) {
        quantity = parseFloat(weightPattern[1]);
        unit = weightPattern[2].toLowerCase();
        itemName = weightPattern[3].trim();
        // If itemName is empty, this might be a continuation - skip for now
        if (!itemName) {
          // Check if this is a weight line for previous item
          if (items.length > 0) {
            items[items.length - 1].quantity = quantity;
            items[items.length - 1].unit = unit;
            console.log('📏 Added weight to previous item:', items[items.length - 1].name);
          }
          continue;
        }
      }
      // Pattern: "Item Name .XXX kg" - weight at end
      else {
        const weightEndPattern = withoutPrice.match(/^(.+?)\s+\.?(\d+\.?\d*)\s*(kg|g|lb|lbs|oz)\b/i);
        if (weightEndPattern) {
          itemName = weightEndPattern[1].trim();
          quantity = parseFloat(weightEndPattern[2]);
          unit = weightEndPattern[3].toLowerCase();
        }
        // Pattern: "X Item Name" at the start (but not if X is very large like a product code)
        else {
          const qtyPattern1 = withoutPrice.match(/^(\d{1,2}(?:\.\d+)?)\s+(.+)$/i);
          if (qtyPattern1 && parseFloat(qtyPattern1[1]) <= 50) {
            quantity = parseFloat(qtyPattern1[1]);
            itemName = qtyPattern1[2].trim();
          }
          // Pattern: "Item Name X units" or "Item Name X pcs"
          else {
            const qtyPattern2 = withoutPrice.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(pcs?|units?|lbs?|oz|kg|g|ml|l|pack|packs|box|boxes|bottle|bottles|can|cans)$/i);
            if (qtyPattern2) {
              itemName = qtyPattern2[1].trim();
              quantity = parseFloat(qtyPattern2[2]);
              unit = qtyPattern2[3]?.toLowerCase() || 'units';
            }
            // Pattern: "Item Name x 2"
            else {
              const qtyPattern3 = withoutPrice.match(/^(.+?)\s+x\s*(\d+)$/i);
              if (qtyPattern3) {
                itemName = qtyPattern3[1].trim();
                quantity = parseFloat(qtyPattern3[2]);
              }
              // No quantity found, use the whole line as item name
              else {
                itemName = withoutPrice;
              }
            }
          }
        }
      }

      // Clean up item name (remove common receipt artifacts)
      itemName = itemName
        .replace(/\s+/g, ' ')
        .replace(/^[@#*\-]\s*/, '')
        .replace(/\s*\([^)]*\)\s*$/, '') // Remove trailing parentheses
        .replace(/\s*REGULAR\s*$/i, '')
        .replace(/\s*REG\s*$/i, '')
        .replace(/\s*\d{5,}\s*$/, '') // Remove trailing long numbers
        .replace(/\s*(SOU|KG|LB|OZ|PC|PCS|UNIT|UNITS|EA|EACH)\s*$/i, '')
        .replace(/^\d+\s*@\s*/, '') // Remove leading "1@ " patterns
        .replace(/\s*[A-Z]\s*$/, '') // Remove single trailing letter (often tax indicator)
        .trim();

      // Skip if item name is too short or looks invalid
      if (
        itemName.length < 2 || 
        itemName.match(/^\d+$/) || // Just numbers
        itemName.match(/^\d+\.\d+$/) || // Just decimal number
        itemName.match(/^\$/) || // Starts with $
        itemName.match(/^[A-Z\s]{20,}$/) || // All caps very long strings
        skipExact.has(itemName.toLowerCase()) ||
        skipPatterns.some(pattern => pattern.test(itemName))
      ) {
        console.log('⏭️ Skipping (invalid item name):', itemName);
        continue;
      }

      // Categorize the item
      const category = categorizeItem(itemName);

      console.log('✅ Found item:', itemName, 'qty:', quantity, unit, 'cat:', category);

      items.push({
        id: `receipt-${Date.now()}-${items.length}`,
        name: itemName.charAt(0).toUpperCase() + itemName.slice(1).toLowerCase(), // Proper case
        quantity,
        unit,
        category
      });
    }

    return items;
  };

  const categorizeItem = (itemName: string): string => {
    const name = itemName.toLowerCase();
    
    // Fresh Produce - expanded list
    const produceKeywords = [
      'apple', 'banana', 'orange', 'grape', 'berry', 'fruit', 'lemon', 'lime', 'mango',
      'peach', 'pear', 'plum', 'cherry', 'melon', 'watermelon', 'kiwi', 'avocado',
      'lettuce', 'spinach', 'carrot', 'tomato', 'cucumber', 'pepper', 'onion', 'potato',
      'broccoli', 'celery', 'mushroom', 'zucchini', 'squash', 'cabbage', 'corn', 'bean',
      'pea', 'asparagus', 'garlic', 'ginger', 'herbs', 'basil', 'cilantro', 'parsley',
      'kale', 'arugula', 'radish', 'beet', 'turnip', 'eggplant', 'cauliflower', 'leek',
      'green', 'produce', 'organic', 'fresh', 'salad'
    ];
    if (produceKeywords.some(kw => name.includes(kw))) {
      return 'Fresh Produce';
    }
    
    // Dairy & Eggs - expanded list
    const dairyKeywords = [
      'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg', 'margarine',
      'sour cream', 'cottage', 'ricotta', 'mozzarella', 'cheddar', 'feta', 'parmesan',
      'brie', 'gouda', 'swiss', 'provolone', 'dairy', 'lactose', 'whipping'
    ];
    if (dairyKeywords.some(kw => name.includes(kw))) {
      return 'Dairy & Eggs';
    }
    
    // Meat & Seafood - expanded list
    const meatKeywords = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'meat', 'turkey',
      'bacon', 'ham', 'sausage', 'steak', 'ground', 'lamb', 'veal', 'duck', 'cod',
      'tilapia', 'halibut', 'trout', 'crab', 'lobster', 'scallop', 'clam', 'mussel',
      'prawn', 'seafood', 'deli', 'roast', 'breast', 'thigh', 'wing', 'drumstick'
    ];
    if (meatKeywords.some(kw => name.includes(kw))) {
      return 'Meat & Seafood';
    }
    
    // Pantry Staples - expanded list
    const pantryKeywords = [
      'rice', 'pasta', 'flour', 'sugar', 'salt', 'oil', 'vinegar', 'sauce', 'spice',
      'olive', 'vegetable oil', 'canola', 'coconut', 'noodle', 'spaghetti', 'penne',
      'cereal', 'oat', 'oatmeal', 'granola', 'honey', 'syrup', 'jam', 'jelly', 'peanut',
      'almond', 'canned', 'beans', 'lentil', 'chickpea', 'tomato sauce', 'soup', 'broth',
      'stock', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'dressing', 'soy sauce',
      'seasoning', 'pepper', 'cinnamon', 'paprika', 'cumin', 'oregano', 'thyme',
      'baking', 'yeast', 'cornstarch', 'vanilla', 'cocoa', 'quick'
    ];
    if (pantryKeywords.some(kw => name.includes(kw))) {
      return 'Pantry Staples';
    }
    
    // Bakery - expanded list
    const bakeryKeywords = [
      'bread', 'bagel', 'muffin', 'croissant', 'cake', 'cookie', 'donut', 'doughnut',
      'pastry', 'bun', 'roll', 'loaf', 'tortilla', 'pita', 'naan', 'flatbread',
      'baguette', 'sourdough', 'rye', 'whole wheat', 'multigrain', 'danish', 'scone',
      'pie', 'tart', 'brownie', 'cupcake'
    ];
    if (bakeryKeywords.some(kw => name.includes(kw))) {
      return 'Bakery';
    }
    
    // Beverages - expanded list
    const beverageKeywords = [
      'juice', 'soda', 'water', 'coffee', 'tea', 'beer', 'wine', 'drink', 'pop',
      'cola', 'sprite', 'fanta', 'ginger ale', 'tonic', 'sparkling', 'mineral',
      'energy', 'sports', 'smoothie', 'lemonade', 'iced tea', 'kombucha', 'milk alt',
      'almond milk', 'oat milk', 'soy milk', 'coconut water'
    ];
    if (beverageKeywords.some(kw => name.includes(kw))) {
      return 'Beverages';
    }
    
    // Frozen Foods - expanded list
    const frozenKeywords = [
      'frozen', 'ice cream', 'pizza', 'fries', 'nugget', 'popsicle', 'gelato',
      'sorbet', 'frozen veg', 'frozen fruit', 'freezer', 'ice'
    ];
    if (frozenKeywords.some(kw => name.includes(kw))) {
      return 'Frozen Foods';
    }
    
    // Snacks - expanded list
    const snackKeywords = [
      'chip', 'chips', 'cracker', 'nut', 'candy', 'chocolate', 'pretzel', 'popcorn',
      'trail mix', 'granola bar', 'protein bar', 'gummy', 'licorice', 'snack',
      'tortilla chip', 'nacho', 'salsa', 'dip', 'hummus'
    ];
    if (snackKeywords.some(kw => name.includes(kw))) {
      return 'Snacks';
    }
    
    return 'Pantry Staples'; // Default to pantry staples instead of "Other"
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
