# BevTracker: FGCM Business Manager

A comprehensive full-stack inventory and sales management system designed for wholesale beverage and provision shops. It tracks stock, sales, profits, and expenses, featuring intelligent insights, a modern storefront UI, and robust Firebase integration for secure data synchronization.

## Features & Components

This modern single-page application is built using React, TypeScript, and Tailwind CSS. It serves as a unified Point of Sale (POS), digital storefront, and back-office management tool.

### Core Modules / Pages

- **Dashboard (`/pages/Dashboard.tsx`)**
  A high-level overview of key business metrics such as today's gross sales, total inventory value, low-stock warnings, and recent activity. Includes quick actions for daily operations.

- **Sales & POS (`/pages/Sales.tsx`)**
  The operational heart of the system, divided into several tabs:
  - *POS*: An optimized Point of Sale interface. Add products to cart, process multi-method payments (Cash, MoMo), apply dynamic discounts.
  - *History*: Review past transactions, handle refunds, and edit entries.
  - *Online Orders*: Manage incoming delivery or pickup orders with granular statuses (Pending, Processing, Shipped, Out for Delivery, Delivered) and one-click WhatsApp customer notifications.
  - *Customers*: A CRM view displaying registered customers, their contact details, lifetime spend, and quickly accessible order history.

- **Inventory (`/pages/Inventory.tsx`)**
  Comprehensive product catalog management.
  - Add, edit, or archive products.
  - Execute **Bulk Edits** and **Quick Bulk Restocks** (which automatically update stock counts and generate purchase expense logs).

- **Storefront (`/pages/Storefront.tsx`)**
  A seamless, customer-facing digital catalog. Buyers can browse active products, filter by category and size, view bundled promotions directly, and place request orders online. 

- **Expenses (`/pages/Expenses.tsx`)**
  Track operational costs over time. Categorize outlays like Rent, Salaries, Transport, and Utilities to ensure accurate net profit calculations.

- **Insights (`/pages/Insights.tsx`)**
  Analytics powered by `recharts`. Visualize sales trends, pinpoint top-selling items, monitor stock distribution, and track profit margins.

- **Settings (`/pages/Settings.tsx`)**
  Manage system behavior: Set store currency, define custom product categories and sizes, store details, and security PINs. 

### Services & Integrations

- **Firebase Backend (`/services/firebase.ts` & `/services/storage.ts`)**
  Secure data persistence using Google Firebase. 
  - **Auth**: Only authenticated users (via Google Sign-In) can access the management dashboards and sync data. 
  - **Firestore**: Collections for `products`, `transactions`, `expenses`, `promotions`, and `customers` use strict security rules to maintain private ownership of shop data (`firestore.rules`).
  - **Sync**: Intelligent batch processing handles cloud data synchronization.

- **Gemini AI (`/services/gemini.ts`)**
  Integration with the `@google/genai` SDK powers smart features such as automatic size/category suggestions and conversational intelligence with your inventory data.

## Setup & Local Development

This project uses modern frontend tooling (Vite + React). Follow these steps to build and run the application.

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- A configured Firebase Project with **Firestore** and **Google Authentication** enabled.

### 2. Installation
Install the project dependencies via npm:
```bash
npm install
```

### 3. Environment & Configuration
Ensure the backend services are properly configured:
- **Firebase Configuration**: The app relies on a `firebase-applet-config.json` at the root directory containing your specific Firebase connection secrets.
- **Firestore Rules**: Strict security rules exist in `firestore.rules`.
- **Gemini Configuration**: If testing AI chat queries or generative functions, ensure you configure your API key either in the code or within the app's Settings payload.

### 4. Running the Development Server
Start the Vite dev server for local testing:
```bash
npm run dev
```
The application will usually be accessible at `http://localhost:5173/` (or port 3000 depending on the environment setup) with Hot Module Replacement (HMR).

### 5. Deployment Build
To bundle the application into optimized static assets for production:
```bash
npm run build
```
This generates compiled HTML, CSS, and JS inside the `dist/` directory, ready to be deployed to static hosts.
