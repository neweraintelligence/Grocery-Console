const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

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
    'https://grocery-dashboard-frontend.onrender.com',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
  exposedHeaders: ['Content-Length','X-Kuma-Revision']
}));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://grocery-dashboard-frontend.onrender.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
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
  console.log('🔍 Pantry GET endpoint called');
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  const maskedIdGet = (process.env.GOOGLE_SHEET_ID || '').slice(-6);
  if (maskedIdGet) console.log(`📄 Using GOOGLE_SHEET_ID (...${maskedIdGet}) for GET`);
  try {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      console.log('❌ Google Sheets not configured');
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Read from "Pantry" sheet (user-curated pantry items only)
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry!A2:Z', // Skip header row, get all columns
      });
    } catch (error) {
      console.log('No Pantry sheet found, returning empty pantry');
      res.json([]);
      return;
    }

    const rows = response.data.values || [];
    console.log(`Pantry GET: Found ${rows.length} rows in Pantry sheet`);
    if (rows.length > 0) {
      console.log('Pantry GET: first row:', rows[0]);
      console.log('Pantry GET: last row:', rows[rows.length - 1]);
    }
    
    // Map pantry items directly (no filtering needed since this is the dedicated pantry sheet)
    const pantryItems = rows
      .filter((row) => row[0] && row[0].trim()) // Only include rows with names
      .map((row, index) => ({
        id: (rows.indexOf(row) + 2).toString(), // Use actual row number as ID
        name: row[0] || '',
        category: row[1] || '',
        currentCount: parseInt(row[2]) || 0,
        minCount: parseInt(row[3]) || 1,
        unit: row[4] || 'units',
        lastUpdated: row[5] || new Date().toLocaleDateString(), // Column F is Last Updated
        notes: row[6] || '' // Column G is Notes
      }));

    console.log(`Pantry GET: Returning ${pantryItems.length} items:`, pantryItems);
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
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    });
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Grocery List!A2:H', // Skip header row, include all columns
    });

    const rows = response.data.values || [];
    const groceries = rows.map((row, index) => ({
      id: (index + 2).toString(), // Row number as ID
      name: row[0] || '',
      category: row[1] || '',
      quantity: parseInt(row[2]) || 1,
      priority: row[3] || 'Medium',
      notes: row[4] || '', // Contains units
      addedDate: row[5] || '',
      completed: row[6] === 'TRUE' || row[6] === true,
      onList: row[7] === 'TRUE' || row[7] === true
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
    const maskedIdPost = (process.env.GOOGLE_SHEET_ID || '').slice(-6);
    if (maskedIdPost) console.log(`📄 Using GOOGLE_SHEET_ID (...${maskedIdPost}) for POST`);
    console.log(`Adding pantry item:`, { name, category, currentCount, minCount, unit, notes, expiryDate });

    // Ensure Pantry sheet exists; if missing, create with headers
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Pantry!A1:A1',
      });
    } catch (sheetMissingErr) {
      console.log('Pantry sheet not found. Creating header row...');
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

    // Add to Pantry sheet: Name, Category, Current Count, Min Count, Unit, Last Updated, Notes, Expiry Date
    const lastUpdated = new Date().toISOString().split('T')[0];
    const values = [[
      name,
      category || '',
      currentCount || 0,
      minCount || 1,
      unit || 'units',
      lastUpdated,
      notes || '',
      expiryDate || ''
    ]];

    // Find next empty row in column A and write exactly there
    const colAResp = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A:A',
    });
    const colAValues = colAResp.data.values || [];
    let lastNonEmpty = 1; // header
    colAValues.forEach((row, idx) => {
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

    console.log(`✅ Successfully added pantry item: ${name}`);
    console.log('📊 Append updatedRange:', result.data && result.data.updates && result.data.updates.updatedRange);
    console.log('📊 Append updatedRows:', result.data && result.data.updates && result.data.updates.updatedRows);

    // Verify by reading back the sheet
    const verify = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pantry!A2:H',
    });
    const verifyRows = verify.data.values || [];
    console.log(`🔎 Verify after append: rows=${verifyRows.length}`);
    if (verifyRows.length > 0) {
      console.log('🔎 Last row:', verifyRows[verifyRows.length - 1]);
    }
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

    const values = [[
      name, // Column A: Name
      category || '', // Column B: Category
      currentCount || 0, // Column C: Quantity
      'Medium', // Column D: Priority (default to Medium)
      unit || 'units', // Column E: Notes (contains units)
      lastUpdated, // Column F: Added Date
      'FALSE', // Column G: Completed
      'TRUE' // Column H: On List (set to TRUE so it shows up on shopping list)
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
    const { name, category, currentCount, priority, notes, addedDate, onList, completed } = req.body;
    const lastUpdated = new Date().toISOString().split('T')[0];
    
    console.log(`Updating grocery item ${rowId}:`, { name, category, currentCount, priority, notes, addedDate, onList, completed });
    console.log(`Setting onList to: ${onList} (will be converted to: ${onList !== undefined ? (onList ? 'TRUE' : 'FALSE') : 'TRUE'})`);

    // Complete row update: A=Name, B=Category, C=Quantity, D=Priority, E=Notes, F=Added Date, G=Completed, H=On List
    const values = [[
      name, 
      category, 
      currentCount, 
      priority || 'Medium', // Column D - Priority
      notes || '', // Column E - Notes (contains units)
      addedDate || lastUpdated, // Column F - Added Date (use provided date or current)
      completed !== undefined ? (completed ? 'TRUE' : 'FALSE') : 'FALSE', // Column G - Completed
      onList !== undefined ? (onList ? 'TRUE' : 'FALSE') : 'TRUE' // Column H - On List
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Grocery List!A${rowId}:H${rowId}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    console.log(`Successfully updated grocery item ${rowId} with onList=${onList}`);
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
      'Pragma': 'no-cache',
      'Expires': '0',
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
      .map((row, index) => {
        const hasName = row[0] && row[0].trim();
        
        // Get the value from the correct "On List" column
        let onListValue = null;
        if (onListColumnIndex >= 0 && onListColumnIndex < row.length) {
          onListValue = row[onListColumnIndex];
        }
        
        console.log(`Item: ${row[0]}, OnList Value at column ${onListColumnIndex}: ${onListValue}, Row length: ${row.length}`);
        console.log(`Full row data: ${JSON.stringify(row)}`);
        
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
            name: row[0] || '',
            category: row[1] || 'General',
            source: 'grocery',
            quantity: parseInt(row[2]) || 1,
            unit: row[4] || '', // Column E is Notes (used for UOM)
            priority: 'Medium',
            needed: parseInt(row[2]) || 1
          }
        };
      })
      .filter((item) => {
        const shouldInclude = item.hasName && item.onList;
        console.log(`Item ${item.data.name}: hasName=${item.hasName}, onList=${item.onList}, shouldInclude=${shouldInclude}`);
        return shouldInclude;
      })
      .map((item) => item.data);
    
    console.log(`Total rows processed: ${rows.length}, Items with names: ${rows.filter((row) => row[0] && row[0].trim()).length}, Items on list: ${shoppingItems.length}`);

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
      .filter((row) => row[0] && row[0].trim() && parseInt(row[2]) > 0) // Items with stock > 0
      .map((row) => row[0].toLowerCase().trim());

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
          availableItems.some((item) => 
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