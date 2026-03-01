# DeliveryApp — Food Delivery (Expo + React Native Web)

A complete food delivery app (DoorDash/UberEats style) that runs entirely in the browser with zero backend installation.

## Tech Stack

- **Frontend**: Expo 51 + React Native Web + TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Database**: SQLocal (SQLite in-browser via WebAssembly + OPFS)
- **API**: MSW v2 (Mock Service Worker — intercepts all fetch calls)
- **State**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Navigation**: React Navigation (Stack + Bottom Tabs)

## Quick Start

```bash
npm install
npx msw init public/ --save
npm start
```

Open **http://localhost:19006** in your browser.

## Demo Credentials

| Field | Value |
|---|---|
| Email | test@example.com |
| Password | Password1 |
| OTP Code | 123456 |
| Promo Codes | WELCOME20, FLAT5 |

## Full Flow

1. **Login** with demo credentials
2. **Browse** restaurants on home screen
3. **Add items** to cart from a restaurant menu
4. **Checkout** with address, payment, and optional tip
5. **Track** your order (status auto-advances over time)
6. **Rate** the order when delivered

## Project Structure

```
food/
├── App.tsx                  # Entry point (MSW + DB init)
├── src/
│   ├── navigation/          # RootNavigator, AuthStack, MainTabs, HomeStack
│   ├── screens/             # 10 screens (Splash, Signup, OTP, Login, Home, Restaurant, Cart, Checkout, OrderTracking, Rating)
│   ├── components/          # 14 reusable components
│   ├── db/                  # SQLocal schema, init, seed
│   ├── mocks/               # MSW browser worker + 14 API handlers
│   ├── schemas/             # Zod schemas (auth, order, rating)
│   ├── lib/                 # Auth store, API client, error mapping
│   └── store/               # Cart store (Zustand)
├── public/                  # MSW service worker
└── assets/imgs/             # Placeholder restaurant images
```
