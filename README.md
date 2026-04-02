# FieldOG PWA

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


### 4. Usage steps

1. Open the app and login/signup (token saved in localStorage).
2. Create a report: switch to "New" in bottom nav -> fill out fields -> Save.
3. Camera & QR scan: click camera icon to open camera; capture photo or scan QR (added try/catch for camera errors).
4. Offline and sync:
   - Local data saved in localStorage + IndexedDB.
   - Sync panel can upload/download data (currently local simulation).
   - `pendingOps` syncs via `syncUpload()` when online.
5. Delete/update: operate in list view, actions generate pending ops and trigger `syncUpload()`.


### 5. GitHub repository link

- GitHub Repo: https://github.com/zsy-sk/fiedogpwa


## Key fixes applied

- `src/App.jsx`
  - `syncUpload` 已修复旧状态读取问题；`hydrateFromIndexedDb` 兼容空数组场景。
- `src/main.jsx`, `public/sw.js`, `public/manifest.webmanifest`
  - 各种路径调整，支持 GitHub Pages 子路径部署。
- `src/components/ReportEditor.jsx`
  - `openCamera` 不可用时捕捉异常并提示。


## 已确认可用性验证

- `npm run build` 通过，`vite build` 成功。


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
