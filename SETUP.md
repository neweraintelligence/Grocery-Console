# 🍳 Mom's Grocery Dashboard - Setup Guide

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Google Account** with access to Google Sheets
4. **Google Cloud Console** access for API setup

## 🔧 Backend Setup

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - **Name**: `grocery-dashboard-service`
   - **Description**: `Service account for Grocery Dashboard`
4. Click "Create and Continue"
5. Skip roles for now, click "Continue"
6. Click "Done"

### Step 3: Generate Service Account Key

1. Find your service account in the list
2. Click on it to open details
3. Go to "Keys" tab
4. Click "Add Key" → "Create New Key"
5. Choose **JSON** format
6. Download the key file
7. **Keep this file secure!**

### Step 4: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new sheet
3. Name it something like "Mom's Grocery Inventory"
4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
5. Share the sheet with your service account email:
   - Click "Share" button
   - Add the service account email (found in your JSON key file)
   - Give "Editor" permissions

## 🔐 Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your details:
   ```env
   # Google Sheets Configuration
   GOOGLE_SHEET_ID=your_sheet_id_here
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
   
   # OR (for development - place JSON file in ./credentials/)
   GOOGLE_CREDENTIALS_PATH=./credentials/service-account-key.json
   
   # Server Configuration
   PORT=3001
   FRONTEND_URL=http://localhost:5178
   NODE_ENV=development
   ```

## 🚀 Installation & Running

### Install Dependencies
```bash
npm install
```

### Set Up Google Sheet (First Time Only)
```bash
npm run setup:sheets
```
This will:
- Create proper headers in your Google Sheet
- Add sample grocery data
- Format the sheet nicely

### Start Development Server
```bash
npm run dev
```
This starts both:
- **Frontend**: http://localhost:5178
- **Backend API**: http://localhost:3001

### Individual Commands
```bash
# Frontend only
npm run dev:client

# Backend only  
npm run dev:server

# Build for production
npm run build
npm run build:server
npm start
```

## 📊 Google Sheet Structure

Your sheet will have these columns:

| Name | Category | Current Count | Min Count | Unit | Last Updated | Notes |
|------|----------|---------------|-----------|------|--------------|-------|
| Milk | Dairy | 1 | 2 | cartons | 2025-01-03 | Always need backup |
| Bread | Bakery | 0 | 1 | loaves | 2025-01-03 | Running low! |

## 🔧 API Endpoints

- `GET /api/groceries` - Get all grocery items
- `POST /api/groceries` - Add new item
- `PUT /api/groceries/:id` - Update item
- `DELETE /api/groceries/:id` - Delete item
- `GET /api/shopping-list` - Get items running low
- `GET /api/health` - Health check

## 🎯 Features

- ✅ **Real-time sync** with Google Sheets
- ✅ **Beautiful modern UI** with animations
- ✅ **Shopping list** auto-generation
- ✅ **Mobile responsive** design
- ✅ **Category organization**
- ✅ **Low stock alerts**

## 🤝 For Mom

Once set up, Mom can:
1. **Use the beautiful dashboard** to view everything
2. **Edit directly in Google Sheets** if she prefers
3. **Both stay in sync** automatically!

The dashboard shows:
- 🥫 Current inventory with pretty cards
- 📝 Shopping list of items running low  
- 👩‍🍳 Recipe suggestions (coming soon)
- 📊 Quick stats and metrics

## 🔒 Security Notes

- Keep your service account key file secure
- Don't commit credentials to git
- Use environment variables for sensitive data
- The sheet is private and only accessible to you and the service account

## 🐛 Troubleshooting

### "Google Sheets not configured" error:
- Check your `.env` file has correct values
- Verify the service account has access to the sheet
- Make sure the Sheet ID is correct

### Can't connect to backend:
- Check if backend is running on port 3001
- Verify CORS settings allow your frontend URL
- Check console for detailed error messages

### Sheet permissions error:
- Make sure you shared the sheet with the service account email
- Give "Editor" permissions, not just "Viewer"

---

**Happy grocery tracking! 🎉**