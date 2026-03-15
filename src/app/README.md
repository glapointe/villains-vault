# Villains Vault - Frontend Application

A cross-platform mobile and web application for tracking Disney race results, built with React Native and Expo.

## Technologies

- **React Native** with Expo for cross-platform development
- **Expo Router** for file-based routing
- **NativeWind** (Tailwind CSS) for styling
- **Auth0** for passwordless authentication
- **TypeScript** for type safety
- **Jest** and React Native Testing Library for testing

## Getting Started

### Prerequisites

- Node.js 22.x
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure Auth0 credentials in `.env`:
   - `EXPO_PUBLIC_AUTH0_DOMAIN`
   - `EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID`
   - `EXPO_PUBLIC_AUTH0_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_AUTH0_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_AUTH0_AUDIENCE`
   - `EXPO_PUBLIC_API_URL`

### Running the App

**Web:**
```bash
npm run web
```

**iOS (requires macOS):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### Building Custom Development Client

For native features like Auth0:

**iOS:**
```bash
npx expo run:ios
```

**Android:**
```bash
npx expo run:android
```
