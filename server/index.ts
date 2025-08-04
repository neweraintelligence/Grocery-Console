import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import path from 'path';

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

    // Add to Grocery List sheet with the structure: Name, Category, Quantity, Priority
    const values = [[name, category || '', currentCount || 0, 'Medium']];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A:D',
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
    const { currentCount } = req.body;

    // Update only the quantity (column C) in the Grocery List sheet
    const values = [[currentCount || 0]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Grocery List!C${rowId}:C${rowId}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

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
    
    // Filter for items with names AND where "On List" column (F) is TRUE
    const shoppingItems = rows
      .filter((row: any[]) => {
        const hasName = row[0] && row[0].trim();
        const onListValue = row[5]; // Column F (index 5)
        
        // Check for TRUE, true, 1, "1", or any checkbox-like value
        const onList = onListValue && (
          onListValue.toString().toUpperCase() === 'TRUE' || 
          onListValue === true || 
          onListValue === 1 ||
          onListValue === '1' ||
          onListValue.toString().toLowerCase() === 'yes'
        );
        
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