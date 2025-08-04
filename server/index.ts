import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5178',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let sheets: any = null;
let auth: any = null;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Use service account (production)
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } else if (process.env.GOOGLE_CREDENTIALS_PATH) {
      // Use credentials file (development)
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
        scopes: SCOPES,
      });
    } else {
      console.warn('No Google credentials found. Please set up authentication.');
      return;
    }

    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Google Sheets API:', error);
  }
}

// Grocery item interface
interface GroceryItem {
  id?: string;
  name: string;
  category: string;
  currentCount: number;
  minCount: number;
  unit: string;
  lastUpdated?: string;
  notes?: string;
}

// API Routes

// Get pantry items (current inventory)
app.get('/api/pantry', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Try to read from "Pantry" sheet specifically for pantry items
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry!A2:Z', // Skip header row, get all columns
      });
    } catch (error) {
      // If no Pantry sheet exists, return empty array since grocery list items are not pantry items
      console.log('No Pantry sheet found, returning empty pantry');
      res.json([]);
      return;
    }

    const rows = response.data.values || [];
    const pantryItems: GroceryItem[] = rows
      .filter((row: any[]) => row[0] && row[0].trim()) // Only include rows with names
      .map((row: any[], index: number) => ({
        id: (index + 2).toString(), // Row number as ID
        name: row[0] || '',
        category: row[1] || '',
        currentCount: parseInt(row[2]) || 0,
        minCount: parseInt(row[3]) || 1,
        unit: row[4] || 'units',
        lastUpdated: row[5] || new Date().toLocaleDateString(),
        notes: row[6] || ''
      }));

    res.json(pantryItems);
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

// Get grocery list (shopping items)
app.get('/api/groceries', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A2:H', // Skip header row
    });

    const rows = response.data.values || [];
    const groceries = rows.map((row: any[], index: number) => ({
      id: (index + 2).toString(), // Row number as ID
      name: row[0] || '',
      category: row[1] || '',
      quantity: parseInt(row[2]) || 1,
      unit: row[3] || '',
      priority: row[4] || 'Medium',
      notes: row[5] || '',
      addedDate: row[6] || '',
      completed: row[7] === 'TRUE' || row[7] === true
    }));

    res.json(groceries);
  } catch (error) {
    console.error('Error fetching grocery list:', error);
    res.status(500).json({ error: 'Failed to fetch grocery list' });
  }
});

// Add new pantry item
app.post('/api/pantry', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { name, category, currentCount, minCount, unit, notes } = req.body;

    // Add to Grocery List sheet with full structure: Name, Category, Current Count, Min Count, Unit, On List (TRUE), Notes
    const values = [[
      name, 
      category || '', 
      currentCount || 0, 
      minCount || 1, 
      unit || 'units', 
      'TRUE', // Set On List to TRUE so it shows up on shopping list
      notes || ''
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Pantry item added successfully' });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

// Add new grocery item
app.post('/api/groceries', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { name, category, currentCount, minCount, unit, notes } = req.body;
    const lastUpdated = new Date().toISOString().split('T')[0];

    const values = [[name, category, currentCount, minCount, unit, lastUpdated, notes || '']];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Grocery item added successfully' });
  } catch (error) {
    console.error('Error adding grocery:', error);
    res.status(500).json({ error: 'Failed to add grocery item' });
  }
});

// Update pantry item
app.put('/api/pantry/:id', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const rowId = req.params.id;
    const { currentCount, minCount } = req.body;

    // Update current count (column C) and/or min count (column D) in the Grocery List sheet
    if (currentCount !== undefined && minCount !== undefined) {
      // Update both current and min count
      const values = [[currentCount || 0, minCount || 1]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Grocery List!C${rowId}:D${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
    } else if (currentCount !== undefined) {
      // Update only current count
      const values = [[currentCount || 0]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Grocery List!C${rowId}:C${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
    } else if (minCount !== undefined) {
      // Update only min count
      const values = [[minCount || 1]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Grocery List!D${rowId}:D${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
    }

    res.json({ message: 'Pantry item updated successfully' });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ error: 'Failed to update pantry item' });
  }
});

// Update grocery item
app.put('/api/groceries/:id', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const rowId = req.params.id;
    const { name, category, currentCount, minCount, unit, notes } = req.body;
    const lastUpdated = new Date().toISOString().split('T')[0];

    const values = [[name, category, currentCount, minCount, unit, lastUpdated, notes || '']];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Grocery List!A${rowId}:G${rowId}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Grocery item updated successfully' });
  } catch (error) {
    console.error('Error updating grocery:', error);
    res.status(500).json({ error: 'Failed to update grocery item' });
  }
});

// Delete grocery item
app.delete('/api/groceries/:id', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const rowId = parseInt(req.params.id);

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Assuming first sheet
              dimension: 'ROWS',
              startIndex: rowId - 1, // 0-based index
              endIndex: rowId
            }
          }
        }]
      }
    });

    res.json({ message: 'Grocery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery:', error);
    res.status(500).json({ error: 'Failed to delete grocery item' });
  }
});

// Get shopping list (items running low)
app.get('/api/shopping-list', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Try to read from "Grocery List" sheet
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Grocery List!A2:Z',
      });
    } catch (error) {
      // Fallback to Groceries sheet
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Groceries!A2:Z',
      });
    }

    const rows = response.data.values || [];
    
    // Filter for items with names AND where "On List" column is TRUE
    const shoppingItems = rows
      .filter((row: any[]) => {
        const hasName = row[0] && row[0].trim();
        
        // Check multiple possible positions for "On List" column
        // It could be in column F (index 5) or G (index 6) depending on spreadsheet structure
        let onListValue = null;
        
        // Try index 5 (column F) first
        if (row[5] !== undefined && row[5] !== null && row[5] !== '') {
          onListValue = row[5];
        }
        // If nothing in column F, try column G (index 6)
        else if (row[6] !== undefined && row[6] !== null && row[6] !== '') {
          onListValue = row[6];
        }
        
        console.log(`Item: ${row[0]}, OnList Value (F): ${row[5]}, OnList Value (G): ${row[6]}, Selected: ${onListValue}`);
        
        // Check for TRUE, true, 1, "1", or any checkbox-like value
        const onList = onListValue && (
          onListValue.toString().toUpperCase() === 'TRUE' || 
          onListValue === true || 
          onListValue === 1 ||
          onListValue === '1' ||
          onListValue.toString().toLowerCase() === 'yes'
        );
        
        console.log(`Item: ${row[0]}, OnList: ${onList}`);
        
        return hasName && onList;
      })
      .map((row: any[], index: number) => ({
        id: (index + 2).toString(),
        name: row[0] || '',
        category: row[1] || 'General',
        source: 'grocery' as const,
        quantity: parseInt(row[2]) || 1,
        unit: row[4] || 'units', // Column E is Unit
        priority: 'Medium',
        needed: parseInt(row[2]) || 1
      }));

    res.json(shoppingItems);
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
  }
});

// Analyze photo for pantry items using computer vision
app.post('/api/analyze-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const imagePath = req.file.path;
    
    // Convert image to base64 for API call
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Use a simple food detection approach
    // In a real implementation, you'd use services like:
    // - Google Vision API
    // - AWS Rekognition 
    // - Azure Computer Vision
    // - Open source models like YOLO
    
    // For now, we'll simulate computer vision analysis with common food items
    const detectedItems = await analyzeImageForFoodItems(base64Image);
    
    // Clean up uploaded file
    fs.unlinkSync(imagePath);
    
    res.json({ 
      success: true, 
      detectedItems,
      message: `Detected ${detectedItems.length} items in the photo`
    });
    
  } catch (error) {
    console.error('Error analyzing photo:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to analyze photo' });
  }
});

// Helper function to analyze image for food items
async function analyzeImageForFoodItems(base64Image: string) {
  // This is a simplified implementation
  // In production, you would integrate with a real computer vision service
  
  // Simulate detection with common pantry items
  const commonItems = [
    { name: 'Bananas', category: 'Produce', confidence: 0.95, estimatedCount: 3, unit: 'pieces' },
    { name: 'Milk', category: 'Dairy', confidence: 0.87, estimatedCount: 1, unit: 'bottle' },
    { name: 'Bread', category: 'Bakery', confidence: 0.92, estimatedCount: 1, unit: 'loaf' },
    { name: 'Eggs', category: 'Dairy', confidence: 0.89, estimatedCount: 12, unit: 'pieces' },
    { name: 'Tomatoes', category: 'Produce', confidence: 0.83, estimatedCount: 4, unit: 'pieces' },
    { name: 'Chicken', category: 'Meat', confidence: 0.78, estimatedCount: 1, unit: 'package' },
    { name: 'Rice', category: 'Pantry', confidence: 0.85, estimatedCount: 1, unit: 'bag' },
    { name: 'Pasta', category: 'Pantry', confidence: 0.90, estimatedCount: 2, unit: 'boxes' }
  ];
  
  // Randomly select 3-6 items to simulate detection
  const numItems = Math.floor(Math.random() * 4) + 3; // 3-6 items
  const shuffled = commonItems.sort(() => 0.5 - Math.random());
  const detected = shuffled.slice(0, numItems);
  
  // Add some randomness to confidence and counts
  return detected.map(item => ({
    ...item,
    confidence: Math.max(0.6, item.confidence + (Math.random() - 0.5) * 0.2),
    estimatedCount: Math.max(1, item.estimatedCount + Math.floor((Math.random() - 0.5) * 3))
  }));
}

// Add detected items to pantry
app.post('/api/add-detected-items', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Prepare data for batch insert
    const values = items.map((item: any) => [
      item.name,
      item.category || 'General',
      item.estimatedCount || 1,
      1, // Default min count
      item.unit || 'units',
      'TRUE', // Set On List to TRUE
      `Added via photo analysis (${Math.round(item.confidence * 100)}% confidence)`
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ 
      success: true, 
      message: `Added ${items.length} items to pantry`,
      addedItems: items.length
    });
  } catch (error) {
    console.error('Error adding detected items:', error);
    res.status(500).json({ error: 'Failed to add detected items' });
  }
});

// Get recipe suggestions based on pantry items
app.get('/api/recipes', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Get pantry items first
    let pantryResponse;
    try {
      pantryResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Grocery List!A2:Z',
      });
    } catch (error) {
      console.log('No pantry items found');
      res.json([]);
      return;
    }

    const rows = pantryResponse.data.values || [];
    const availableItems = rows
      .filter((row: any[]) => row[0] && row[0].trim() && parseInt(row[2]) > 0) // Items with stock > 0
      .map((row: any[]) => row[0].toLowerCase().trim());

    if (availableItems.length === 0) {
      res.json([]);
      return;
    }

    // Simple recipe database - in a real app, this would be from an external API
    const recipeDatabase = [
      {
        id: '1',
        name: 'Banana Smoothie',
        ingredients: ['bananas', 'milk', 'honey', 'yogurt'],
        instructions: 'Blend bananas, milk, honey, and yogurt until smooth. Serve chilled.',
        cookTime: '5 minutes',
        difficulty: 'Easy'
      },
      {
        id: '2',
        name: 'Banana Bread',
        ingredients: ['bananas', 'flour', 'sugar', 'eggs', 'butter'],
        instructions: 'Mix mashed bananas with flour, sugar, eggs, and butter. Bake at 350°F for 60 minutes.',
        cookTime: '75 minutes',
        difficulty: 'Medium'
      },
      {
        id: '3',
        name: 'Pasta with Tomato Sauce',
        ingredients: ['pasta', 'tomatoes', 'olive oil', 'garlic', 'basil'],
        instructions: 'Cook pasta. Sauté garlic in olive oil, add tomatoes and basil. Combine with pasta.',
        cookTime: '20 minutes',
        difficulty: 'Easy'
      },
      {
        id: '4',
        name: 'Scrambled Eggs',
        ingredients: ['eggs', 'milk', 'butter', 'salt', 'pepper'],
        instructions: 'Beat eggs with milk. Cook in butter over low heat, stirring frequently.',
        cookTime: '10 minutes',
        difficulty: 'Easy'
      },
      {
        id: '5',
        name: 'Rice Bowl',
        ingredients: ['rice', 'vegetables', 'soy sauce', 'sesame oil'],
        instructions: 'Cook rice. Stir-fry vegetables, season with soy sauce and sesame oil. Serve over rice.',
        cookTime: '25 minutes',
        difficulty: 'Easy'
      },
      {
        id: '6',
        name: 'Chicken Stir Fry',
        ingredients: ['chicken', 'vegetables', 'soy sauce', 'garlic', 'ginger'],
        instructions: 'Cut chicken into strips. Stir-fry with vegetables, garlic, and ginger. Season with soy sauce.',
        cookTime: '15 minutes',
        difficulty: 'Medium'
      },
      {
        id: '7',
        name: 'Vegetable Soup',
        ingredients: ['vegetables', 'broth', 'onion', 'garlic', 'herbs'],
        instructions: 'Sauté onion and garlic. Add vegetables and broth. Simmer until tender. Season with herbs.',
        cookTime: '30 minutes',
        difficulty: 'Easy'
      }
    ];

    // Find recipes that can be made with available ingredients
    const suggestedRecipes = recipeDatabase
      .map(recipe => {
        const matchingIngredients = recipe.ingredients.filter(ingredient => 
          availableItems.some((item: string) => 
            item.includes(ingredient.toLowerCase()) || 
            ingredient.toLowerCase().includes(item)
          )
        );
        
        return {
          ...recipe,
          matchingIngredients,
          matchPercentage: Math.round((matchingIngredients.length / recipe.ingredients.length) * 100),
          canMake: matchingIngredients.length >= Math.ceil(recipe.ingredients.length * 0.6) // Can make if 60% of ingredients available
        };
      })
      .filter(recipe => recipe.matchingIngredients.length > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5); // Return top 5 recipes

    res.json(suggestedRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    googleSheetsConnected: !!sheets
  });
});

// Initialize and start server
async function startServer() {
  await initializeGoogleSheets();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:5178`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
  });
}

startServer();