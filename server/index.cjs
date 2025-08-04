const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5178',
    'http://localhost:5173',
    'http://localhost:5183',
    'https://grocery-dashboard-frontend.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let sheets = null;
let auth = null;

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

// API Routes

// Get pantry items (current inventory)
app.get('/api/pantry', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A2:H', // Skip header row
    });

    const rows = response.data.values || [];
    const pantryItems = rows.map((row, index) => ({
      id: (index + 2).toString(), // Row number as ID
      name: row[0] || '',
      category: row[1] || '',
      currentCount: parseInt(row[2]) || 0,
      minCount: parseInt(row[3]) || 0,
      unit: row[4] || '',
      lastUpdated: row[5] || '',
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
    const groceries = rows.map((row, index) => ({
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
    const lastUpdated = new Date().toISOString().split('T')[0];

    const values = [[name, category, currentCount, minCount, unit, lastUpdated, notes || '']];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Pantry item added successfully' });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

// Add new grocery list item
app.post('/api/groceries', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const { name, category, quantity, unit, priority, notes } = req.body;
    const addedDate = new Date().toISOString().split('T')[0];

    const values = [[name, category || '', quantity || 1, unit || '', priority || 'Medium', notes || '', addedDate, false]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.json({ message: 'Grocery list item added successfully' });
  } catch (error) {
    console.error('Error adding grocery item:', error);
    res.status(500).json({ error: 'Failed to add grocery item' });
  }
});

// Update pantry item quantity
app.put('/api/pantry/:id', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const rowId = req.params.id;
    const { currentCount } = req.body;
    const lastUpdated = new Date().toISOString().split('T')[0];

    // First get the existing row data
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Pantry!A${rowId}:G${rowId}`,
    });

    if (!getResponse.data.values || getResponse.data.values.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const existingRow = getResponse.data.values[0];
    
    // Update only the current count and last updated date
    const updatedRow = [
      existingRow[0], // name
      existingRow[1], // category  
      currentCount,   // updated current count
      existingRow[3], // minCount
      existingRow[4], // unit
      lastUpdated,    // updated lastUpdated
      existingRow[6] || '' // notes
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Pantry!A${rowId}:G${rowId}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [updatedRow] }
    });

    res.json({ message: 'Item quantity updated successfully' });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ error: 'Failed to update item quantity' });
  }
});

// Get shopping list (combines low pantry items + grocery list)
app.get('/api/shopping-list', async (req, res) => {
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Get low pantry items
    const pantryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A2:H',
    });

    const pantryRows = pantryResponse.data.values || [];
    const lowPantryItems = pantryRows
      .map((row, index) => ({
        id: `pantry-${index + 2}`,
        name: row[0] || '',
        category: row[1] || '',
        currentCount: parseInt(row[2]) || 0,
        minCount: parseInt(row[3]) || 0,
        unit: row[4] || '',
        needed: Math.max(0, (parseInt(row[3]) || 0) - (parseInt(row[2]) || 0)),
        source: 'pantry'
      }))
      .filter(item => item.currentCount <= item.minCount);

    // Get grocery list items (not completed)
    const groceryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A2:H',
    });

    const groceryRows = groceryResponse.data.values || [];
    const groceryListItems = groceryRows
      .map((row, index) => ({
        id: `grocery-${index + 2}`,
        name: row[0] || '',
        category: row[1] || '',
        quantity: parseInt(row[2]) || 1,
        unit: row[3] || '',
        priority: row[4] || 'Medium',
        notes: row[5] || '',
        addedDate: row[6] || '',
        completed: row[7] === 'TRUE' || row[7] === true,
        source: 'grocery-list'
      }))
      .filter(item => !item.completed);

    // Combine both lists
    const shoppingList = [...lowPantryItems, ...groceryListItems];

    res.json(shoppingList);
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
  }
});

// Root route - helpful info page
app.get('/', (req, res) => {
  res.json({
    name: 'Mom\'s Grocery Dashboard API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      pantry: '/api/pantry',
      groceries: '/api/groceries',
      shoppingList: '/api/shopping-list'
    },
    message: 'API is running! Visit /api/health to check system status.',
    timestamp: new Date().toISOString()
  });
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