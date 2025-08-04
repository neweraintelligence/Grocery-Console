# 🍳 Mom's Grocery Dashboard

A beautiful, real-time grocery inventory management system that syncs with Google Sheets. Track your pantry items, get low stock alerts, and manage your shopping list with an intuitive dashboard.

![Grocery Dashboard](https://img.shields.io/badge/Status-Ready-green)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-Integrated-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green)

## ✨ Features

- **📊 Real-time Inventory**: Track grocery items with current stock and minimum requirements
- **🛒 Smart Shopping List**: Automatically generates shopping list for items running low
- **📈 Quick Stats**: Overview of total items, categories, and available recipes
- **🎨 Beautiful UI**: Dark theme with forest green accents and glassmorphism effects
- **☁️ Google Sheets Sync**: All data synced in real-time with your Google Sheet
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Google Cloud Console access
- Google Sheets API enabled

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/neweraintelligence/Grocery-Console.git
cd Grocery-Console
npm install
\`\`\`

### 2. Google Sheets Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download credentials as \`credentials.json\`
6. Place \`credentials.json\` in the project root
7. Share your Google Sheet with the service account email

### 3. Environment Configuration
Create a \`.env\` file in the root directory:
\`\`\`env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5178

# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id_here

# Google Credentials
GOOGLE_CREDENTIALS_PATH=./credentials.json

# Development flag
NODE_ENV=development
\`\`\`

### 4. Initialize Google Sheet
Run the setup script to create proper headers and sample data:
\`\`\`bash
npm run setup:sheets
\`\`\`

### 5. Start the Application
\`\`\`bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:client  # Frontend only (port 5178)
npm run dev:server  # Backend only (port 3001)
\`\`\`

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/health\` | Server status and Google Sheets connection |
| GET | \`/api/groceries\` | Get all grocery items |
| POST | \`/api/groceries\` | Add new grocery item |
| PUT | \`/api/groceries/:id\` | Update grocery item |
| DELETE | \`/api/groceries/:id\` | Delete grocery item |
| GET | \`/api/shopping-list\` | Get items running low |

## 🏗️ Project Structure
\`\`\`
grocery-dashboard/
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── services/        # API services
│   └── App.tsx         # Main app component
├── server/             # Node.js backend
│   ├── index.cjs       # Main server file
│   └── setup-sheets.ts # Google Sheets initialization
├── public/             # Static assets
└── package.json        # Dependencies and scripts
\`\`\`

## 🎨 Design Features

- **Dark Theme**: Elegant dark background with vibrant accents
- **Glassmorphism**: Modern frosted glass effects with backdrop blur
- **Gradient Animations**: Smooth hover effects and transitions
- **Responsive Grid**: Adapts to different screen sizes
- **Status Indicators**: Color-coded badges for stock levels

## 🔧 Development

### Available Scripts
\`\`\`bash
npm run dev          # Start both frontend and backend
npm run dev:client   # Start frontend development server
npm run dev:server   # Start backend development server
npm run setup:sheets # Initialize Google Sheet structure
npm run build        # Build for production
npm run preview      # Preview production build
\`\`\`

### Google Sheets Structure
The system uses **two sheets** in your Google Spreadsheet:

#### Sheet 1: "Pantry" (Inventory Management)
Tracks what you currently have at home:
- **Name**: Item name (e.g., "Organic Milk")
- **Category**: Item category (e.g., "Dairy")
- **Current Count**: Items currently in stock
- **Min Count**: Minimum required stock
- **Unit**: Unit of measurement (e.g., "cartons")
- **Last Updated**: Last modification date
- **Notes**: Additional notes

#### Sheet 2: "Grocery List" (Shopping List)
Tracks what you need to buy:
- **Name**: Item name (e.g., "Organic Apples")
- **Category**: Item category (e.g., "Produce")
- **Quantity**: How many to buy
- **Unit**: Unit of measurement (e.g., "bags")
- **Priority**: High/Medium/Low priority
- **Notes**: Additional notes
- **Added Date**: When item was added
- **Completed**: TRUE/FALSE if purchased

## 🔒 Security Notes

- Never commit \`credentials.json\` or \`.env\` files
- Keep Google Service Account credentials secure
- Share Google Sheets only with necessary service accounts
- Use environment variables for all sensitive configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- [ ] Recipe suggestions based on available ingredients
- [ ] Barcode scanning for easy item addition
- [ ] Expiration date tracking
- [ ] Price tracking and budget management
- [ ] Mobile app version
- [ ] Multi-user support

---

**Made with ❤️ for better grocery management**