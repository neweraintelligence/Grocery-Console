import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to set up the Google Sheet with proper headers
 * Run this once to initialize your grocery sheet
 */
async function setupGoogleSheet() {
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

    // Create Pantry sheet headers
    const pantryHeaders = [
      'Name', 'Category', 'Current Count', 'Min Count', 'Unit', 'Last Updated', 'Notes'
    ];

    // Create Grocery List sheet headers  
    const groceryHeaders = [
      'Name', 'Category', 'Quantity', 'Unit', 'Priority', 'Notes', 'Added Date', 'Completed'
    ];

    // Add headers to both sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Pantry!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [pantryHeaders]
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Grocery List!A1:H1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [groceryHeaders]
      }
    });

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 7
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.2 },
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }
        ]
      }
    });

    // Clear any existing data (keep only headers)
    // Note: No sample data added - user will add their own real data

    console.log('✅ Google Sheet setup complete!');
    console.log(`📊 Sheet ID: ${SHEET_ID}`);
    console.log('🏠 Pantry sheet created with headers (no sample data)');
    console.log('🛒 Grocery List sheet created with headers (no sample data)');
    console.log('🎯 Ready for your real data!');

  } catch (error) {
    console.error('❌ Error setting up Google Sheet:', error);
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGoogleSheet();
}

export { setupGoogleSheet };