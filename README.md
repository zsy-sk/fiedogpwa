# FieldOG PWA
FieldOG is a Progressive Web Application (PWA) purpose-built for field data collection, which integrates device camera, QR code scanning, geolocation, and local storage to support an offline-first workflow. By leveraging multiple hardware APIs, the application provides a robust, installable solution that guarantees uninterrupted data capture and persistence in challenging network conditions.

## Part A: User Guide

### 1. Installation

1. Clone repository
   - `git clone https://github.com/zsy-sk/fiedogpwa.git`
   - `cd fiedogpwa-main`

2. Install dependencies
   - `npm install`

3. Main dependencies
   - `react`, `react-dom`, `react-scripts`, `vite`
   - `react-leaflet`, `leaflet`, `jsqr`, `@testing-library/*`, etc.
4.quick start
1.nmp i
2. Run `npm run dev`
3. Open browser at `http://localhost:5173`、
4. Sign up or log in
5. Start creating reports


### 2. Run instructions

- Development mode
  - `npm run dev`
  - Open URL from terminal (e.g. `http://localhost:5173`).
- Production build
  - `npm run build`
  - `npm run preview` (preview built app locally)


### 3. Dependencies and configuration

- `package.json` contains project dependencies.
- `vite.config.js` handles build config (base path, aliases, env vars).
- `src/main.jsx` mounts React app and registers service worker (production & https/localhost only).
- `public/manifest.webmanifest` startup config:
  - `start_url` set to `./` for GitHub Pages path compatibility.
## Prerequisites

- Node.js (v16 or above recommended)
- npm or yarn
- Modern browser (Chrome recommended for PWA features)

### 4. Usage steps

1. Open the app and login/signup (token saved in localStorage).
2. Create a report: switch to "New" in bottom nav -> fill out fields -> Save.
3. Camera & QR scan: click camera icon to open camera; capture photo or scan QR (added try/catch for camera errors).
4. Offline and sync:
   - Local data saved in localStorage + IndexedDB.
   - Sync panel can upload/download data (currently local simulation).
   - `pendingOps` syncs via `syncUpload()` when online.
5. Delete/update: operate in list view, actions generate pending ops and trigger `syncUpload()`.
6.Permissions Required
Location Access: Enables real-time route tracking and geotagging for collected field data.
Camera Access: Facilitates on-site image capture and visual documentation of field reports.

### 5. GitHub repository link

- GitHub Repo: https://github.com/zsy-sk/fiedogpwa

### 6.Live App
- Access the live app here:https://fiedogpwa.vercel.app

### 7.To install the PWA:

On desktop: Click the "Install App" button in the browser address bar.
On mobile: Open the browser menu and select Add to Home Screen.

### 8.Limitations
Requires browser support for hardware APIs
Camera access depends on user permission
Performance may vary across devices

### 9.Future Improvements
Cloud synchronization
Enhanced UI/UX
Performance optimization

 
