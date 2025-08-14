# Milk POS Management Application by TM_Cybertech

A comprehensive local milk point-of-sale management system built with React.js frontend and FastAPI backend.

## Features

- **Farmer Management**: Complete CRUD operations for farmers and their cows
- **Milk Collection**: Daily milk collection tracking with automatic calculations
- **Expense Management**: Track veterinary and feed expenses
- **Advance Management**: Handle farmer advances with automatic deductions
- **Reports**: Comprehensive reporting with charts and export functionality
- **Bilingual Support**: English and Tamil language switching
- **SMS Integration**: Generate SMS text for manual sending
- **Accessibility**: ARIA labels, keyboard navigation, high contrast design

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB (v4.4 or higher)

## Installation & Setup

### 1. Install Dependencies

#### Backend Dependencies
```bash
pip install fastapi uvicorn pymongo python-multipart python-dotenv
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Start MongoDB
Ensure MongoDB is running on `mongodb://localhost:27017/mpms_db`

```bash
# Start MongoDB service (varies by OS)
# Windows: net start MongoDB
# macOS: brew services start mongodb/brew/mongodb-community
# Linux: sudo systemctl start mongod
```

### 3. Start the Application

#### Start Backend (Terminal 1)
```bash
cd backend
python app.py
```
Backend will run on `http://localhost:8000`

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the sidebar to navigate between different modules
3. Switch between English and Tamil using the language toggle in the header
4. Add farmers, record milk collections, manage expenses and advances
5. View comprehensive reports with charts and export data

## Tech Stack

- **Frontend**: React.js, Material-UI, i18next, Recharts, Axios
- **Backend**: FastAPI, Python, PyMongo
- **Database**: MongoDB
- **Styling**: Material-UI with custom royal yellow theme

## Support

For technical support, contact TM_Cybertech.