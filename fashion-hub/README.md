# Fashion Hub — React + Python Flask

A beginner-friendly fashion storefront with product filtering/search, a working cart, quantity controls, checkout form, and SQLite order storage.

## Requirements
- Node.js (LTS) and npm
- Python 3.10 or newer
- VS Code (recommended)

## 1. Open the project
Extract `fashion-hub.zip`, then open the extracted `fashion-hub` folder in VS Code.

## 2. Start the Python backend
Open a terminal in VS Code:

**Windows PowerShell**
```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

If `py` is not available, use `python` instead. If PowerShell blocks activation, open Command Prompt and use:
```bat
venv\Scripts\activate.bat
```
Or run the environment's Python directly without activating:
```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe app.py
```

Keep this terminal open. Check the API at http://127.0.0.1:5000/api/health

## 3. Start the React website
Open a **second terminal** at the project root (`fashion-hub`, not the backend folder):
```bash
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173

## Features
- Product data is served by Flask from SQLite.
- Search and category filters.
- Add to bag, adjust quantities, and remove items.
- Shipping is free on orders of ₹2,500 or more; otherwise demo shipping is ₹99.
- Checkout sends the order to Flask; the server recalculates prices and saves the order to `backend/fashion.db`.
- Check saved local demo orders at http://127.0.0.1:5000/api/orders

## Troubleshooting
- **`python` or `py` not found:** install Python from https://www.python.org/downloads/ and select “Add Python to PATH”, then restart VS Code.
- **`npm` not found:** install Node.js LTS from https://nodejs.org/ and restart VS Code.
- **Products appear but checkout fails:** make sure the backend terminal is running and visit `/api/health`.
- **Images do not load:** image URLs require internet; the store layout and cart still work.
- **PowerShell says scripts are disabled:** use Command Prompt activation above, or run `.\venv\Scripts\python.exe app.py` after installing packages with that Python.

## Important
This is a local learning/demo project. Checkout does not take real payments. Before deploying publicly, add authentication/admin authorization, CSRF/security protections, rate limiting, privacy handling, and restrict or remove the demo orders endpoint. Do not collect real customer information on a public deployment without appropriate safeguards.
