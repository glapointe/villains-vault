# Deploying to Mobile Devices with Expo Go

## Overview

This guide explains how to test the Villains Vault mobile app on physical Android or iOS devices using Expo Go during development. This is the fastest way to test the app without building native binaries.

## What is Expo Go?

Expo Go is a free mobile app that allows you to run your Expo projects on physical devices during development. It's available on both iOS and Android and comes pre-loaded with common native modules, making it ideal for rapid development and testing.

**Note:** Expo Go has limitations and cannot run apps with custom native code. For production builds or apps with custom native modules, you'll need to create a development build (see EAS Build documentation).

## Prerequisites

### Required Software
- **Node.js 18+** installed on your development machine
- **Expo Go app** installed on your mobile device:
  - iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Network Requirements
- Development machine and mobile device must be on the **same WiFi network**
- Firewall must allow connections on Metro Bundler port (default: 8081)
- Corporate networks may block this - try a personal hotspot if needed

### Backend API
The app requires the backend API to be running. For local development:
- Backend API should be running at `http://localhost:5000`
- Mobile device must be able to reach your development machine
- See "Backend Configuration" section below

## Initial Setup

### 1. Install Dependencies

```bash
cd src/app
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in `src/app/` with your Auth0 credentials:

```env
# Auth0 Configuration
EXPO_PUBLIC_AUTH0_DOMAIN=your-domain.us.auth0.com
EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID=your_native_client_id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://falchion.villains.vault

# API URL - use your machine's local IP address
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
```

**Important:** For `EXPO_PUBLIC_API_URL`, use your computer's local IP address (not `localhost`):
- **Windows**: Run `ipconfig` and look for "IPv4 Address"
- **macOS/Linux**: Run `ifconfig` or `ip addr`
- Example: `http://192.168.1.100:5000`

### 3. Start Backend API

The mobile app requires the backend API to be running:

```bash
cd src/api/Falchion.Villains.Vault.Api.Api
dotnet run
```

Verify the API is accessible from your mobile device by visiting `http://YOUR_IP:5000/api/health` in your phone's browser.

## Running on Physical Devices

### Start the Development Server

From the `src/app/` directory:

```bash
npm start
```

This will start Metro Bundler and display a QR code in your terminal along with connection instructions.

### Connect Your Device

#### iOS (iPhone/iPad)

1. Open **Expo Go** app on your iOS device
2. Tap **Scan QR Code**
3. Point camera at QR code in terminal
4. App will load and run on your device

**Alternative Method:**
- Ensure you're signed in to the same Expo account on both your computer and Expo Go
- Your project will appear in the "Projects" list in Expo Go
- Tap to open

#### Android

1. Open **Expo Go** app on your Android device
2. Tap **Scan QR code**
3. Scan the QR code from terminal
4. App will load and run on your device

**Alternative Method:**
- In terminal, press `a` to open on Android device via ADB (if connected via USB)
- Or manually enter the URL shown in terminal: `exp://YOUR_IP:8081`

## Development Workflow

### Hot Reload

Expo Go supports hot reloading:
- **Fast Refresh**: Automatically reloads when you save changes to your code
- **Shake to Open Menu**: Shake your device to open the developer menu
  - Reload app
  - Toggle performance monitor
  - Toggle element inspector
  - Debug remote JS (opens Chrome debugger)

### Viewing Logs

Console logs appear in your terminal where you ran `npm start`. You can also:
- Open Chrome DevTools for debugging (shake device → Debug Remote JS)
- View logs in Expo Go developer menu
- Use React Native Debugger for advanced debugging

## Troubleshooting

### Cannot Connect to Development Server

**Problem**: QR code scan succeeded but app won't load

**Solutions**:
1. Verify both devices are on same WiFi network
2. Check firewall allows port 8081
3. Try tunnel mode: `npm start -- --tunnel` (slower but works through firewalls)
4. Restart Metro Bundler: `npm start -- --clear`
5. On Windows, ensure WiFi is set to "Private" network (not "Public")

### "Network request failed" or API Errors

**Problem**: App loads but can't connect to backend

**Solutions**:
1. Verify backend API is running: `curl http://YOUR_IP:5000/api/health`
2. Check `EXPO_PUBLIC_API_URL` uses your local IP (not localhost)
3. Ensure firewall allows port 5000
4. Test API from phone browser: visit `http://YOUR_IP:5000/api/health`

### "Invalid Regular Expression" Error

**Problem**: Metro bundler crashes with regex error

**Solutions**:
1. Clear Metro cache: `npm start -- --clear`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Clear npm cache: `npm cache clean --force`

### iOS: "Unable to verify app"

**Problem**: iOS shows developer certificate warning

**Solutions**:
- This shouldn't happen with Expo Go (it's signed by Expo)
- If you see this, ensure you're using Expo Go, not a custom development build
- Try reinstalling Expo Go from App Store

### Android: App crashes on startup

**Problem**: App immediately crashes when opening

**Solutions**:
1. Check Expo Go is up to date in Google Play
2. Clear Expo Go app data: Settings → Apps → Expo Go → Storage → Clear Data
3. Try development build if you have custom native code

### Performance Issues

**Problem**: App is slow or laggy

**Solutions**:
1. Enable Performance Monitor (shake device → Show Performance Monitor)
2. Check Metro terminal for warnings about large bundles
3. Use Production mode for better performance: `npm start -- --no-dev`
4. Consider creating an optimized development build

## Using Tunnel Mode

If you can't get devices on the same network or have firewall issues, use tunnel mode:

```bash
npm start -- --tunnel
```

**Pros:**
- Works across different networks
- Bypasses firewall issues
- Can share with testers anywhere

**Cons:**
- Slower reload times
- Requires internet connection
- May have connection instability

## Switching Between Environments

### Development (Local Backend)

Default configuration in `.env.local`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000
```

### Preview (Staging Backend)

Create `.env.stage` for testing against deployed backend:
```env
EXPO_PUBLIC_API_URL=https://vault.villains.run
```

Run with staging environment:
```bash
cross-env ENV_NAME=stage npm start
```

## Limitations of Expo Go

Expo Go works great for most development but has limitations:

**Cannot use:**
- Custom native modules not included in Expo SDK
- Custom native code (Objective-C, Swift, Java, Kotlin)
- Custom app icons and splash screens (uses Expo Go branding)
- Custom schemes or deep linking configurations
- Push notifications (requires native build)

**If you need these features:**
- Create a development build: `eas build --profile development --platform ios/android`
- See [DEVELOPMENT_BUILD.md](DEVELOPMENT_BUILD.md) for instructions (create this doc separately)

## Tips for Efficient Development

1. **Keep Metro Running**: Don't restart Metro unless necessary - it maintains fast reload times
2. **Use Fast Refresh**: Save files frequently to see changes instantly
3. **Debug on One Device**: Pick iOS or Android as primary testing device during development
4. **Test Both Platforms**: Before committing features, test on both iOS and Android
5. **Use Simulator/Emulator for Rapid Iteration**: Physical devices for final testing
6. **Enable Network Inspector**: Great for debugging API calls (shake → Show Element Inspector)

## Next Steps

Once you've verified the app works in Expo Go:

1. **Create Development Build** for features requiring custom native code
2. **Test Authentication** with all social providers (Google, Apple, Facebook, Microsoft)
3. **Profile Performance** using React Native Performance Monitor
4. **Build for Production** when ready to submit to app stores

## Additional Resources

- [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
- [Expo Development Mode](https://docs.expo.dev/guides/development-mode/)
- [Debugging with Expo](https://docs.expo.dev/debugging/runtime-issues/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [Auth0 Setup Guide](AUTH0_SOCIAL_SETUP.md)
