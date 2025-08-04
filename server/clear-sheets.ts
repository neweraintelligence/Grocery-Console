import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to clear existing data from Google Sheets (keeps headers)
 * Run this to remove all dummy data and start fresh
 */
async function clearGoogleSheets() {
  try {
    let auth;
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (process.env.GOOGLE_CREDENTIALS_PATH) {
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      throw new Error('No Google credentials found');
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    if (!SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID not found in environment variables');
    }

    console.log('🧹 Clearing existing data from both sheets...');

    // Clear Pantry data (everything except header row)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'Pantry!A2:H'
    });

    // Clear Grocery List data (everything except header row)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'Grocery List!A2:I'
    });

    console.log('✅ All dummy data cleared!');
    console.log('🏠 Pantry sheet: Headers only (ready for your data)');
    console.log('🛒 Grocery List sheet: Headers only (ready for your data)');
    console.log('');
    console.log('🍌 You can now add bananas to the pantry');
    console.log('🥥 You can now add coconuts to the grocery list');
    console.log('💡 Use the Quick Add button in the dashboard!');

  } catch (error) {
    console.error('❌ Error clearing Google Sheets:', error);
  }
}

// Run the clear if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearGoogleSheets();
}

export { clearGoogleSheets };