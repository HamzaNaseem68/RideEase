# RideEase — AI-Powered Car & Bike Rental App

RideEase is a premium full-stack mobile application that allows users to rent cars and bikes. It combines core vehicle rental features (listings, booking calendar math, document upload gates, pricing calculations, GPS location tracking) with advanced features (in-app digital wallets, post-trip damage logs) and a **smart AI-Powered Vehicle Advisor** that recommends the best vehicle based on trip parameters.

This project delivers:
1. A **Node.js Express + MongoDB** backend API (equipped with an automatic offline JSON DB fallback).
2. A **High-Fidelity Mobile Web Simulator** running at `http://localhost:5000` for instant browser testing and a jaw-dropping visual demonstration.
3. A complete, modular **React Native Expo** mobile client codebase matching the simulator screen-for-screen.

---

## 🎨 Tech Stack & UI Decisions

- **Mobile Client:** React Native + Expo (v50), React Navigation, SecureStore, and Expo Location.
- **Backend Service:** Node.js + Express, JWT authentication, and bcrypt secure hashing.
- **Database Layer:** MongoDB + Mongoose (with transparent local `local_db.json` database fallback if MongoDB is not connected).
- **Aesthetic System:** High-end dark/light theme toggle, custom glassmorphism, dynamic transitions, and a curated **Deep Navy (`#0A0F1D`) + Amber Accent (`#F59E0B`)** color palette.

---

## 🚀 Key Features Built

### 1. Interactive Vehicle Listings
- Complete list of cars (Toyota Fortuner, Honda Civic, Suzuki Alto, Changan Alsvin, MG HS) and motorcycles (Yamaha YBR 125, Suzuki GS 150, Honda CG 125, Vlektra Retro Electric) in Pakistan.
- Specs: Seating capacity, fuel type (Petrol, Diesel, Hybrid, Electric), transmission, description, and status badges.

### 2. Booking Calendar & Dynamic Price Calculator
- Automated calculation of rental duration (days).
- Recalculates bills live as you toggle Collision Damage Coverage (PKR 1,500/day) and Doorstep Home Delivery (PKR 2,000 flat).

### 3. Verification Upload Security Lock
- Identity verification is strictly enforced. Bookings are disabled until the user uploads their CNIC and Driver License photos (image or PDF file previews supported).

### 4. Digital In-App Wallet
- Integrated digital ledger tracking deposits, booking payments, and cancelled rental refunds.
- Top-up chips (+5,000, +10,000, +25,000) for instant testing.
- *Welcome Bonus:* Users receive **PKR 10,000** automatically on sign-up to test checkout flows immediately!

### 5. AI Vehicle Recommendation Engine
- Analyzes budget, pasajeros, duration, daily mileage, fuel preference, and trip types together.
- Injects a professional prompt advising the best vehicle from the catalog with contextual reasoning.
- **OpenAI Live & Local Fallback:** Queries GPT-4o-mini if `OPENAI_API_KEY` is provided, otherwise falls back to a custom deterministic parser (works offline without any API keys).

### 6. Proximity GPS Maps
- Displays vehicle placements (Gulberg, DHA, Lahore coordinates) on an interactive nearby map relative to the user's pulse location.

### 7. Completed Trip Damage Reporting
- Post-trip damage logging module accepting descriptions and file uploads, flagging reports for administrative inspections.

---

## 📂 Project Structure

```
RideEase/
├── backend/
│   ├── server.js              # Express app entry
│   ├── package.json           # Backend dependencies
│   ├── database/
│   │   ├── db.js              # DB switchboard (MongoDB <-> JSON Local DB)
│   │   ├── localDb.js         # JSON fallback database engine
│   │   └── models/            # Mongoose schemas (User, Vehicle, Booking...)
│   ├── routes/                # REST API Routes (Auth, Vehicles, AI...)
│   ├── seed/
│   │   └── seedData.js        # Seeds 10 cars and bikes into the DB
│   └── public/
│       └── index.html         # High-Fidelity Mobile Web Simulator
│
└── mobile/                    # React Native Expo Mobile App
    ├── App.js                 # Entry point & contexts wrapper
    ├── app.json               # Expo settings
    ├── package.json           # Native dependencies
    └── src/
        ├── constants/         # COLORS design tokens
        ├── context/           # ThemeContext, AuthContext
        ├── navigation/        # AuthNavigator, TabNavigator, AppNavigator
        ├── services/          # API endpoint triggers
        └── screens/           # All native app views (Home, AI, Wallet...)
```

---

## ⚙️ Quick Installation & Setup

Follow these simple commands to start up the backend API and open the browser simulator:

### Step 1: Run the Backend & Seeder

Open your terminal in the `backend/` directory:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Seed the database catalog:**
   ```bash
   node seed/seedData.js
   ```
   *(This cleanly cleans and populates either your MongoDB or creates the `local_db.json` with 10 vehicles!)*

3. **Start the API Server:**
   ```bash
   npm start
   ```
   *(Or run `npm run dev` to watch changes).*

### Step 2: Open the Mobile Simulator

Once the backend starts, open your browser and go to:
👉 **[http://localhost:5000](http://localhost:5000)**

You will see an elegant smartphone device mockup centered on the page. 
- Click **Sign Up** to create an account and grab your **PKR 10,000** top-up.
- Go to the **History Tab**, upload mock files to verify your license, and unlock booking checkout locks.
- Navigate to the **AI Match Tab**, fill in details, and inspect custom vehicle recommendations!

---

## 📱 Running the Native Mobile Client

If you want to run the native Expo application:

1. Open a new terminal in the `mobile/` directory:
   ```bash
   cd mobile
   ```

2. Install Expo libraries:
   ```bash
   npm install
   ```

3. Configure your API endpoint:
   - By default, `mobile/src/services/api.js` points to `http://localhost:5000` (which works inside iOS / Android Simulators or Expo Web).
   - If running on a **physical phone** via the Expo Go app, open `mobile/src/services/api.js` and update `DEFAULT_API_URL` to your computer's local LAN IP (e.g. `http://192.168.10.5:5000`) so your phone can talk to the server on the same Wi-Fi.

4. Start Expo:
   ```bash
   npm start
   ```
   - Press `w` to open in browser (Expo Web).
   - Press `a` to run on Android emulator.
   - Scan the QR code with your phone camera (iOS) or Expo Go app (Android) to test on physical hardware!

---

## 🔑 Customizing environment variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_token_key_here

# (Optional) Live MongoDB connection. If blank, RideEase automatically falls back to local file storage!
MONGO_URI=mongodb://localhost:27017/rideease

# (Optional) Live AI Engine. If blank, RideEase runs a built-in rules-based recommendation engine!
OPENAI_API_KEY=your_openai_api_key_here
```
