# NEET 2026 Answer Key Portal

Minimal React + Vite site for showing NEET 2026 answer key download links from multiple institutes in one place, with lead capture before download.

## Features

- Clean UI that shows only institute names and paper-code download actions
- Paper Code 11, 12, 13, and 14 download buttons
- Name and phone number capture before download
- Google Sheets as the source for institute links
- Google Apps Script as the backend layer for reading sheet data and logging downloads
- Vercel API proxy to avoid browser-to-Apps-Script CORS issues
- Vercel-ready frontend deployment

## Google Sheet Columns

The source sheet must include these exact headers:

- `instituteName`
- `code11Link`
- `code12Link`
- `code13Link`
- `code14Link`

Recommended leads sheet columns:

- `timestamp`
- `name`
- `phoneNumber`
- `instituteName`
- `requestedCode`
- `fileUrl`
- `directDownloadUrl`

## Google Apps Script Setup

1. Create a Google Sheet with one sheet named `institutes`
2. Add these exact headers in row 1:
   - `instituteName`
   - `code11Link`
   - `code12Link`
   - `code13Link`
   - `code14Link`
3. Create another sheet named `leads`
4. Open [google-apps-script/Code.gs](D:\Answer_key_site\google-apps-script\Code.gs) and paste it into a new Apps Script project
5. Set `SPREADSHEET_ID` in the script
6. Deploy the script as a Web App with access for `Anyone`
7. Copy the deployed `/exec` URL

## Local Development

1. Copy `.env.example` to `.env.local`
2. Add your deployed Apps Script URL
3. Install dependencies:
   - `npm install`
4. Start the frontend:
   - `npm run dev`
5. For the full proxy flow locally, run the app through `vercel dev`

## Vercel Deployment

1. Create a new Vercel project from this folder
2. Add `GOOGLE_SCRIPT_URL` in the Vercel dashboard
3. `VITE_GOOGLE_SCRIPT_URL` is optional and only useful for local fallback compatibility
3. Deploy the project

## Notes

- If `GOOGLE_SCRIPT_URL` is not configured, the Vercel API falls back to sample data for institute listing.
- `instituteCode` is not required anymore.
