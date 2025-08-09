import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


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
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
  exposedHeaders: ['Content-Length','X-Kuma-Revision']
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
  expiryDate?: string;
}

// Purchase history interface
interface PurchaseHistoryItem {
  id?: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  price?: number;
  store?: string;
  purchaseDate: string;
  notes?: string;
}

// Pantry history interface for consumption tracking
interface PantryHistoryItem {
  id?: string;
  itemId: string;
  itemName: string;
  previousCount: number;
  currentCount: number;
  changeReason: 'consumption' | 'purchase' | 'adjustment' | 'spoilage';
  date: string;
  notes?: string;
}

// API Routes

// Get pantry items (current inventory)
app.get('/api/pantry', async (req, res) => {
  try {
    // Disable caching of pantry reads to ensure UI reflects latest writes
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
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
        name: cleanTextData(row[0] || ''),
        category: cleanTextData(row[1] || ''),
        currentCount: parseFloat(row[2]) || 0,
        minCount: parseFloat(row[3]) || 1,
        unit: cleanTextData(row[4] || 'units'),
        lastUpdated: row[5] || new Date().toLocaleDateString(),
        notes: cleanTextData(row[6] || ''),
        expiryDate: row[7] || '' // Column H (index 7) is Expiry Date
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
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A2:I', // Skip header row, include all columns
    });

    const rows = response.data.values || [];
    const groceries = rows.map((row: any[], index: number) => ({
      id: (index + 2).toString(), // Row number as ID
      name: cleanTextData(row[0] || ''),
      category: cleanTextData(row[1] || ''),
      quantity: parseInt(row[2]) || 1,
      minCount: parseInt(row[3]) || 1,
      unit: cleanTextData(row[4] || ''),
      onList: row[5] === 'TRUE' || row[5] === true,
      notes: cleanTextData(row[6] || ''),
      addedDate: row[7] || '',
      completed: row[8] === 'TRUE' || row[8] === true
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

    const { name, category, currentCount, minCount, unit, notes, expiryDate } = req.body;
    
    console.log('📦 Received pantry item data:', req.body);
    console.log('📅 Expiry date received:', expiryDate);
    console.log('📅 Expiry date type:', typeof expiryDate);

    // Add to Pantry sheet with full structure: Name, Category, Current Count, Min Count, Unit, Last Updated, Notes, Expiry Date
    const lastUpdated = new Date().toISOString().split('T')[0];
    const values = [[
      name, 
      category || '', 
      currentCount || 0, 
      minCount || 1, 
      unit || 'units', 
      lastUpdated, // Last Updated
      notes || '', // Notes
      expiryDate || '' // Expiry Date
    ]];
    
    console.log('📝 Values being written to Google Sheets:', values);
    console.log('📝 First row structure:', values[0]);
    console.log('📝 Column mapping: A=%s, B=%s, C=%s, D=%s, E=%s, F=%s, G=%s, H=%s', 
      values[0][0], values[0][1], values[0][2], values[0][3], values[0][4], values[0][5], values[0][6], values[0][7]);

    console.log('📝 Ensuring Pantry sheet exists and locating next empty row in column A');

    // Ensure Pantry sheet exists; if missing, create header row first
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry!A1:A1',
      });
    } catch (sheetMissingErr) {
      console.log('ℹ️ Pantry sheet not found. Creating with headers...');
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry!A1:H1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            'Name', 'Category', 'Current Count', 'Min Count', 'Unit', 'Last Updated', 'Notes', 'Expiry Date'
          ]]
        }
      });
    }

    // Find next empty row in column A
    const colAResp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A:A',
    });
    const colAValues: any[] = colAResp.data.values || [];
    let lastNonEmpty = 1; // header at row 1
    colAValues.forEach((row: any[], idx: number) => {
      if (row && row[0] && String(row[0]).trim()) lastNonEmpty = idx + 1;
    });
    const nextRow = lastNonEmpty + 1;
    const targetRange = `Pantry!A${nextRow}:H${nextRow}`;
    console.log('🧭 Next empty row in column A:', nextRow, 'Target range:', targetRange);

    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
    
    console.log('✅ Successfully wrote to Pantry sheet:', result.status);
    console.log('📊 Updated range:', result.data.updates?.updatedRange);
    console.log('📊 Updated rows:', result.data.updates?.updatedRows);

    res.json({ message: 'Pantry item added successfully' });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

// Helper function to clean text data
function cleanTextData(text: string): string {
  if (!text) return '';
  return text
    .replace(/[Ø=ßá]/g, '') // Remove specific strange symbols
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Add new grocery item
app.post('/api/groceries', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { name, category, currentCount, quantity, minCount, unit, notes } = req.body;
    const lastUpdated = new Date().toISOString().split('T')[0];

    const values = [[
      name, 
      category || '', 
      currentCount || quantity || 0, 
      minCount || 1, 
      unit || 'units', 
      'TRUE', // Set On List to TRUE so it shows up on shopping list
      notes || '', // Notes column (will be used for UOM)
      lastUpdated, // Added Date
      'FALSE' // Completed
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A:I',
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

    // Update current count (column C) and/or min count (column D) in the Pantry sheet
    if (currentCount !== undefined && minCount !== undefined) {
      // Update both current and min count
      const values = [[currentCount || 0, minCount || 1]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Pantry!C${rowId}:D${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
    } else if (currentCount !== undefined) {
      // Update only current count
      const values = [[currentCount || 0]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Pantry!C${rowId}:C${rowId}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
    } else if (minCount !== undefined) {
      // Update only min count
      const values = [[minCount || 1]];
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Pantry!D${rowId}:D${rowId}`,
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
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
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
    
    // Get the header row first to find the "On List" column position
    let headerResponse;
    try {
      headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Grocery List!A1:Z1',
      });
    } catch (error) {
      // Fallback to Groceries sheet
      headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Groceries!A1:Z1',
      });
    }
    
    const headers = headerResponse.data.values?.[0] || [];
    console.log('Headers found:', headers);
    
    // Find the "On List" column index
    let onListColumnIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.toString().toLowerCase().trim();
      if (header.includes('on list') || header.includes('onlist')) {
        onListColumnIndex = i;
        break;
      }
    }
    
    console.log(`"On List" column found at index: ${onListColumnIndex}`);
    
    // Filter for items with names AND where "On List" column is TRUE
    const shoppingItems = rows
      .map((row: any[], index: number) => {
        const hasName = row[0] && row[0].trim();
        
        // Get the value from the correct "On List" column
        let onListValue = null;
        if (onListColumnIndex >= 0 && onListColumnIndex < row.length) {
          onListValue = row[onListColumnIndex];
        }
        
        console.log(`Item: ${row[0]}, OnList Value at column ${onListColumnIndex}: ${onListValue}`);
        
        // Check for TRUE, true, 1, "1", or any checkbox-like value
        const onList = onListValue && (
          onListValue.toString().toUpperCase() === 'TRUE' || 
          onListValue === true || 
          onListValue === 1 ||
          onListValue === '1' ||
          onListValue.toString().toLowerCase() === 'yes'
        );
        
        console.log(`Item: ${row[0]}, OnList: ${onList}`);
        
        return {
          hasName,
          onList,
          originalRowIndex: index + 2, // +2 because spreadsheet rows are 1-indexed and we skip header
          data: {
            id: (index + 2).toString(), // Use original row number as ID
            name: cleanTextData(row[0] || ''),
            category: cleanTextData(row[1] || 'General'),
            source: 'grocery' as const,
            quantity: parseInt(row[2]) || 1,
            unit: cleanTextData(row[6] || ''), // Column G is Notes (used for UOM)
            priority: 'Medium',
            needed: parseInt(row[2]) || 1
          }
        };
      })
      .filter((item: any) => {
        const shouldInclude = item.hasName && item.onList;
        console.log(`Item ${item.data.name}: hasName=${item.hasName}, onList=${item.onList}, shouldInclude=${shouldInclude}`);
        return shouldInclude;
      })
      .map((item: any) => item.data);
    
    console.log(`Total rows processed: ${rows.length}, Items with names: ${rows.filter((row: any[]) => row[0] && row[0].trim()).length}, Items on list: ${shoppingItems.length}`);

    res.json(shoppingItems);
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
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

// Purchase History API Endpoints

// Get purchase history
app.get('/api/purchase-history', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Read from "Purchase History" sheet
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Purchase History!A2:Z',
      });
    } catch (error) {
      console.log('No Purchase History sheet found, returning empty array');
      res.json([]);
      return;
    }

    const rows = response.data.values || [];
    const purchaseHistory: PurchaseHistoryItem[] = rows
      .filter((row: any[]) => row[0] && row[0].trim())
      .map((row: any[], index: number) => ({
        id: (index + 2).toString(),
        itemId: row[0] || '',
        itemName: row[1] || '',
        category: row[2] || '',
        quantity: parseInt(row[3]) || 0,
        price: parseFloat(row[4]) || 0,
        store: row[5] || '',
        purchaseDate: row[6] || '',
        notes: row[7] || ''
      }));

    res.json(purchaseHistory);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

// Add purchase history entry
app.post('/api/purchase-history', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { itemId, itemName, category, quantity, price, store, notes } = req.body;
    const purchaseDate = new Date().toISOString().split('T')[0];

    // Ensure Purchase History sheet exists or create it
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Purchase History!A1:A1',
      });
    } catch (error) {
      // Create Purchase History sheet with headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Purchase History!A1:H1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Item ID', 'Item Name', 'Category', 'Quantity', 'Price', 'Store', 'Purchase Date', 'Notes']]
        }
      });
    }

    const values = [[
      itemId || '',
      itemName || '',
      category || '',
      quantity || 0,
      price || 0,
      store || '',
      purchaseDate,
      notes || ''
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Purchase History!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Purchase history entry added successfully' });
  } catch (error) {
    console.error('Error adding purchase history:', error);
    res.status(500).json({ error: 'Failed to add purchase history' });
  }
});

// Pantry History API Endpoints

// Get pantry history (for consumption tracking)
app.get('/api/pantry-history', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Read from "Pantry History" sheet
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry History!A2:Z',
      });
    } catch (error) {
      console.log('No Pantry History sheet found, returning empty array');
      res.json([]);
      return;
    }

    const rows = response.data.values || [];
    const pantryHistory: PantryHistoryItem[] = rows
      .filter((row: any[]) => row[0] && row[0].trim())
      .map((row: any[], index: number) => ({
        id: (index + 2).toString(),
        itemId: row[0] || '',
        itemName: row[1] || '',
        previousCount: parseInt(row[2]) || 0,
        currentCount: parseInt(row[3]) || 0,
        changeReason: row[4] || 'adjustment',
        date: row[5] || '',
        notes: row[6] || ''
      }));

    res.json(pantryHistory);
  } catch (error) {
    console.error('Error fetching pantry history:', error);
    res.status(500).json({ error: 'Failed to fetch pantry history' });
  }
});

// Add pantry history entry (automatically called when pantry items are updated)
app.post('/api/pantry-history', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { itemId, itemName, previousCount, currentCount, changeReason, notes } = req.body;
    const date = new Date().toISOString().split('T')[0];

    // Ensure Pantry History sheet exists or create it
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry History!A1:A1',
      });
    } catch (error) {
      // Create Pantry History sheet with headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry History!A1:G1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['Item ID', 'Item Name', 'Previous Count', 'Current Count', 'Change Reason', 'Date', 'Notes']]
        }
      });
    }

    const values = [[
      itemId || '',
      itemName || '',
      previousCount || 0,
      currentCount || 0,
      changeReason || 'adjustment',
      date,
      notes || ''
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry History!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Pantry history entry added successfully' });
  } catch (error) {
    console.error('Error adding pantry history:', error);
    res.status(500).json({ error: 'Failed to add pantry history' });
  }
});

// Predictive Restock API Endpoints

// Get predictive restock recommendations
app.get('/api/predictive-restock', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Get pantry items
    const pantryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A2:Z',
    });

    const pantryRows = pantryResponse.data.values || [];
    const pantryItems = pantryRows
      .filter((row: any[]) => row[0] && row[0].trim())
      .map((row: any[], index: number) => ({
        id: (index + 2).toString(),
        name: row[0] || '',
        category: row[1] || '',
        currentCount: parseInt(row[2]) || 0,
        minCount: parseInt(row[3]) || 1,
        unit: row[4] || 'units',
        lastUpdated: row[5] || '',
        notes: row[6] || ''
      }));

    // Get purchase history for analysis
    let purchaseHistoryResponse;
    try {
      purchaseHistoryResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Purchase History!A2:Z',
      });
    } catch (error) {
      purchaseHistoryResponse = { data: { values: [] } };
    }

    const purchaseHistory = purchaseHistoryResponse.data.values || [];

    // Get pantry history for consumption tracking
    let pantryHistoryResponse;
    try {
      pantryHistoryResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry History!A2:Z',
      });
    } catch (error) {
      pantryHistoryResponse = { data: { values: [] } };
    }

    const pantryHistoryData = pantryHistoryResponse.data.values || [];

    // Simple predictive algorithm (could be enhanced with the predictive service)
    const predictions = pantryItems.map((item: any) => {
      const isLowStock = item.currentCount <= item.minCount;
      const isCritical = item.currentCount === 0;
      
      const urgency = isCritical ? 'critical' : 
                     isLowStock ? 'high' : 
                     item.currentCount <= item.minCount * 1.5 ? 'medium' : 'low';

      const runOutDays = Math.max(1, item.currentCount || 1);
      const predictedRunOutDate = new Date();
      predictedRunOutDate.setDate(predictedRunOutDate.getDate() + runOutDays);

      const restockDate = new Date();
      restockDate.setDate(restockDate.getDate() + Math.max(0, runOutDays - 2));

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        currentStock: item.currentCount,
        predictedRunOutDate: predictedRunOutDate.toISOString(),
        recommendedRestockDate: restockDate.toISOString(),
        recommendedQuantity: Math.max(item.minCount * 2, 5),
        confidence: 0.7, // Default confidence
        urgency,
        estimatedCost: 15, // Default estimate
        bestStore: 'Grocery Store',
        reasoning: [
          `Current stock: ${item.currentCount}`,
          `Minimum required: ${item.minCount}`,
          urgency === 'critical' ? 'OUT OF STOCK - Immediate restocking needed!' : 
          urgency === 'high' ? 'Below minimum threshold' : 
          'Preventive restocking recommended'
        ]
      };
    }).filter((prediction: any) => prediction.urgency !== 'low' || prediction.currentStock <= prediction.recommendedQuantity * 0.5);

    res.json(predictions);
  } catch (error) {
    console.error('Error generating predictive restock:', error);
    res.status(500).json({ error: 'Failed to generate predictive restock recommendations' });
  }
});

// GPT-powered recipes
app.post('/api/recipes/gpt', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const { pantry } = req.body as { pantry: Array<{ name: string; quantity?: number; unit?: string; category?: string }>; };
    const items = (pantry || []).map(i => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit || ''})` : ''}${i.category ? ` – ${i.category}` : ''}`);

    const system = 'You are a professional chef. Create approachable, delicious recipes from the provided pantry. Use only common techniques; avoid exotic ingredients not provided unless trivial (salt, pepper, oil, water).';
    const user = `Pantry items:\n${items.join('\n')}\n\nTask: Propose exactly four recipes: one breakfast, one lunch, one dinner, and one dessert. For each, include: title, mealType (breakfast|lunch|dinner|dessert), shortDescription, ingredientsUsed (subset of pantry names), optionalMissing (short list), steps (5-8 numbered steps), cookTime (e.g., 20 minutes), servings (integer). Return strict JSON: { recipes: Recipe[] }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenAI error:', text);
      return res.status(500).json({ error: 'OpenAI request failed' });
    }

    const data: any = await response.json();
    const content = (data as any).choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = { recipes: [] }; }
    res.json(parsed);
  } catch (err) {
    console.error('GPT recipes error:', err);
    res.status(500).json({ error: 'Failed to generate recipes' });
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