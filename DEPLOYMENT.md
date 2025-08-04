# 🚀 Deployment Guide for Render

This guide will help you deploy your Mom's Grocery Dashboard to Render.com.

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub (✅ Done!)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Google Service Account**: Have your `credentials.json` ready

## 🔧 Render Deployment Steps

### 1. Create New Blueprint

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository: `neweraintelligence/Grocery-Console`
4. Render will automatically detect the `render.yaml` file

### 2. Configure Environment Variables

After the blueprint is created, you'll need to set these environment variables for the **API service**:

#### Required Variables:
```bash
# Google Sheets Configuration
GOOGLE_SHEET_ID=1HtJ5n9WkxkQbtRlaMYxQ9xv_ZISN9lEqoGtgf-7bPO4

# Google Service Account (Important: This should be the ENTIRE JSON as a single line string)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project"...}
```

#### How to Set Environment Variables:
1. Go to your API service in Render dashboard
2. Click **"Environment"** tab
3. Add the variables above
4. Click **"Save Changes"**

### 3. Convert credentials.json to String

To convert your `credentials.json` file to a single-line string for `GOOGLE_SERVICE_ACCOUNT_KEY`:

**Option A - Using PowerShell:**
```powershell
$json = Get-Content credentials.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
Write-Host $json
```

**Option B - Using online tool:**
1. Copy your `credentials.json` content
2. Use a JSON minifier tool to convert to single line
3. Copy the result to Render

### 4. Update Google Sheets Permissions

Make sure your Google Sheet is shared with the service account email from your credentials file.

## 🌐 Service URLs

After deployment, your services will be available at:

- **Frontend**: `https://grocery-dashboard.onrender.com`
- **API**: `https://grocery-api.onrender.com`
- **Health Check**: `https://grocery-api.onrender.com/api/health`

## 🔒 Security Notes

- Never commit credentials to GitHub
- Use Render's environment variables for all secrets
- Your Google Sheet should only be shared with the service account
- The Render free tier may have cold starts (15-30 seconds to wake up)

## 🐛 Troubleshooting

### Service Won't Start
1. Check the build logs in Render dashboard
2. Verify environment variables are set correctly
3. Ensure `GOOGLE_SERVICE_ACCOUNT_KEY` is valid JSON

### Google Sheets Connection Failed
1. Verify the service account email has access to your sheet
2. Check that the `GOOGLE_SHEET_ID` is correct
3. Ensure the Google Sheets API is enabled in your Google Cloud project

### Frontend Can't Connect to API
1. Check that the API service is running
2. Verify the `VITE_API_URL` environment variable is set correctly
3. Check CORS settings in the backend

## 📊 Performance Tips

- **Free Tier**: Services sleep after 15 minutes of inactivity
- **Paid Tier**: Always-on services with better performance
- **CDN**: Static assets are automatically served via CDN

## 🔄 Auto-Deploy

Once set up, any push to the `main` branch will automatically trigger a new deployment.

## 📞 Support

If you encounter issues:
1. Check Render's build and deploy logs
2. Verify all environment variables
3. Test your Google Sheets connection locally first
4. Check the [Render documentation](https://docs.render.com)

---

**🎉 Your grocery dashboard will be live and accessible worldwide!**