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

    // Create headers
    const headers = [
      'Name', 'Category', 'Current Count', 'Min Count', 'Unit', 'Last Updated', 'Notes'
    ];

    // Add headers to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Groceries!A1:G1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [headers]
      }
    });

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
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

    // Add some sample data
    const sampleData = [
      ['Milk', 'Dairy', 1, 2, 'cartons', new Date().toISOString().split('T')[0], 'Always need backup'],
      ['Bread', 'Bakery', 0, 1, 'loaves', new Date().toISOString().split('T')[0], 'Running low!'],
      ['Bananas', 'Produce', 3, 5, 'bunches', new Date().toISOString().split('T')[0], ''],
      ['Eggs', 'Dairy', 2, 1, 'dozens', new Date().toISOString().split('T')[0], 'Good stock'],
      ['Rice', 'Pantry', 0, 1, 'bags', new Date().toISOString().split('T')[0], 'Need to buy']
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Groceries!A2:G',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: sampleData
      }
    });

    console.log('✅ Google Sheet setup complete!');
    console.log(`📊 Sheet ID: ${SHEET_ID}`);
    console.log('🥫 Sample grocery data added');
    console.log('🎯 Headers formatted and ready to use');

  } catch (error) {
    console.error('❌ Error setting up Google Sheet:', error);
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGoogleSheet();
}

export { setupGoogleSheet };