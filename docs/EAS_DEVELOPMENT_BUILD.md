# EAS Development Build Deployment

## Overview

This guide explains how to create and install development builds of Villains Vault on physical iOS and Android devices using EAS (Expo Application Services) Build. Development builds are custom versions of your app that include all native dependencies and allow for advanced debugging while still supporting fast refresh.

## When to Use Development Builds vs Expo Go

**Use Expo Go when:**
- Rapid prototyping and initial development
- Testing UI/UX changes quickly
- App only uses Expo SDK modules

**Use Development Builds when:**
- App includes custom native code or modules
- Need to test native functionality (push notifications, custom permissions)
- Testing production-like builds
- Expo Go doesn't support a required library
- Preparing for app store submission

## Prerequisites

### Required Accounts & Tools

1. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Free tier includes limited builds per month
   - Pro tier recommended for teams (more builds, faster queues)

2. **Apple Developer Account** (for iOS)
   - $99/year Apple Developer Program membership
   - Required for installing apps on iOS devices
   - Sign up at [developer.apple.com](https://developer.apple.com)

3. **Google Play Console Account** (for Android)
   - One-time $25 registration fee
   - Only required for Play Store distribution (not needed for internal testing)
   - Sign up at [play.google.com/console](https://play.google.com/console)

4. **EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

5. **Mobile Device**
   - iOS 13.4+ or Android 5.0+
   - USB cable for initial setup (optional for subsequent installs)

## Initial Setup

### 1. Install EAS CLI and Login

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Verify you're logged in
eas whoami
```

### 2. Configure EAS Project

The project is already configured with `eas.json`, but verify it's linked to your account:

```bash
cd src/app

# Check current configuration
eas build:configure

# Verify project ID matches (should be: 8d73fc0c-10e9-4cf7-a936-55cb91fd9d85)
```

### 3. Set Up Credentials

#### iOS Credentials Setup

EAS can automatically manage your iOS credentials, or you can provide your own.

**Option A: Automatic (Recommended)**
```bash
# EAS will create and manage certificates for you
eas build --platform ios --profile development
```

Follow prompts to:
- Log in with Apple Developer account
- Select team (if you have multiple)
- EAS will create provisioning profiles and certificates

**Option B: Manual**
If you have existing certificates:
```bash
eas credentials
```

#### Android Credentials Setup

**Option A: Automatic (Recommended)**
```bash
# EAS will create a keystore for you
eas build --platform android --profile development
```

**Option B: Manual**
If you have an existing keystore:
```bash
eas credentials
```

## Building for Development

### Build for iOS

```bash
cd src/app

# Build development version for iOS
eas build --platform ios --profile development
```

**What happens:**
1. Code is uploaded to EAS servers
2. Dependencies are installed
3. Native iOS project is built with development client
4. IPA file is created and hosted on EAS servers
5. You receive a link to download/install

**Build time:** ~10-20 minutes for first build, ~5-10 minutes for subsequent builds

**Installing on Device:**

Once build completes, you'll receive a URL. You can:

1. **Install via Link (Easiest)**
   - Open the URL on your iOS device in Safari
   - Tap "Install"
   - Trust the developer certificate: Settings → General → VPN & Device Management → Trust

2. **Install via QR Code**
   - Scan the QR code provided in terminal
   - Follow installation prompts

3. **Install via USB (If Above Fails)**
   ```bash
   # Download IPA from build page
   # Install using Apple Configurator or third-party tool
   ```

### Build for Android

```bash
cd src/app

# Build development version for Android
eas build --platform android --profile development
```

**What happens:**
1. Code is uploaded to EAS servers
2. Dependencies are installed
3. Native Android project is built with development client
4. APK file is created and hosted on EAS servers
5. You receive a link to download/install

**Build time:** ~10-20 minutes for first build, ~5-10 minutes for subsequent builds

**Installing on Device:**

Once build completes:

1. **Install via Link (Easiest)**
   - Open the URL on your Android device
   - Download APK
   - Android may warn about installing from unknown sources - allow it
   - Tap APK to install

2. **Install via USB**
   ```bash
   # Download APK from build page
   adb install path/to/app.apk
   ```

### Build for Both Platforms

```bash
# Build for both iOS and Android simultaneously
eas build --platform all --profile development
```

## Development Workflow

### 1. Start Metro Bundler

After installing the development build on your device, start the development server:

```bash
cd src/app
npm start
```

### 2. Open App on Device

Open the development build app on your device (it will have the app name and icon).

**Important:** The first time you open it, you'll need to:
- Ensure you're on the same WiFi network as your development machine
- The app will try to connect to Metro bundler automatically
- Or scan QR code from terminal to connect

### 3. Develop with Fast Refresh

Now you can develop with:
- ✅ Fast Refresh on code changes
- ✅ Full access to custom native modules
- ✅ Chrome DevTools debugging
- ✅ React Native Debugger
- ✅ All features that work in production

### 4. Shake to Open Menu

Shake your device to access developer menu:
- Reload
- Debug Remote JS
- Toggle Performance Monitor
- Toggle Element Inspector

## Managing Builds

### View Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# View build logs
eas build:view --json [BUILD_ID]
```

### Cancel Running Build

```bash
eas build:cancel [BUILD_ID]
```

### Download Build Artifacts

```bash
# Download IPA or APK
eas build:download --id [BUILD_ID]
```

## Building Different Profiles

The project has three build profiles defined in `eas.json`:

### Development Profile
```bash
eas build --platform ios --profile development
```
- Includes development client for fast refresh
- `EXPO_PUBLIC_API_URL`: `http://localhost:5000`
- Distribution: Internal (ad-hoc for iOS, APK for Android)

### Preview Profile
```bash
eas build --platform ios --profile preview
```
- Production-like build without development client
- `EXPO_PUBLIC_API_URL`: Staging API URL
- Distribution: Internal
- Good for testing before production release

### Production Profile
```bash
eas build --platform ios --profile production
```
- Full production build
- `EXPO_PUBLIC_API_URL`: Production API URL
- Auto-increments version number
- Ready for App Store/Play Store submission

## Advanced Configuration

### Custom Environment Variables

Add secrets to builds without committing them:

```bash
# Set a secret
eas env:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "<your value>" --visibility "plaintext" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID --value "<your value>" --visibility "sensitive" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_AUTH0_DOMAIN --value "<your value>" --visibility "plaintext" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID --value "<your value>" --visibility "sensitive" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_AUTH0_AUDIENCE --value "<your value>" --visibility "plaintext" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_API_URL --value "<your value>" --visibility "plaintext" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_API_URL --value "http://localhost:5000" --visibility "plaintext" --environment "development"
eas env:create --scope project --name EXPO_PUBLIC_CLARITY_WEB_PROJECT_ID --value "<your value>" --visibility "sensitive" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_CLARITY_NATIVE_PROJECT_ID --value "<your value>" --visibility "sensitive" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_DISABLE_DLS_DECLARATIONS --value "false" --visibility "plaintext" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_DISABLE_COMMUNITY_EVENTS --value "false" --visibility "plaintext" --environment "development" --environment "preview" --environment "production"

# List secrets
eas env:list

# Use in eas.json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID": "$AUTH0_WEB_CLIENT_ID",
        "EXPO_PUBLIC_AUTH0_DOMAIN": "$AUTH0_DOMAIN",
        "EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID": "$AUTH0_NATIVE_CLIENT_ID",
        "EXPO_PUBLIC_AUTH0_AUDIENCE": "$AUTH0_AUDIENCE",
        "EXPO_PUBLIC_API_URL": "$API_URL",
        "EXPO_PUBLIC_CLARITY_WEB_PROJECT_ID": "$CLARITY_WEB_PROJECT_ID",
        "EXPO_PUBLIC_CLARITY_NATIVE_PROJECT_ID": "$CLARITY_NATIVE_PROJECT_ID",
        "EXPO_PUBLIC_DISABLE_DLS_DECLARATIONS": "$DISABLE_DLS_DECLARATIONS",
        "EXPO_PUBLIC_DISABLE_COMMUNITY_EVENTS": "$DISABLE_COMMUNITY_EVENTS"
      }
    }
  }
}
```

### Local Builds

Build on your own machine (faster, free unlimited builds):

```bash
# iOS (requires macOS)
eas build --platform ios --profile development --local

# Android (works on any OS)
eas build --platform android --profile development --local
```

**Requirements:**
- iOS: macOS with Xcode installed
- Android: Android SDK and NDK installed
- More setup overhead but faster builds

### Internal Distribution

Share builds with your team:

```bash
# Build and automatically share
eas build --platform ios --profile development

# Build creates shareable link
# Share link with team members
# They can install directly from browser
```

## Troubleshooting

### iOS: "Unable to install" Error

**Problem:** iOS won't install the app

**Solutions:**
1. Check device is registered in Apple Developer portal
2. Ensure provisioning profile includes your device UDID
3. Re-run credential setup: `eas credentials`
4. Delete and recreate provisioning profile
5. Verify you're using Developer (not Distribution) certificate

### Android: "App not installed" Error

**Problem:** Android refuses to install APK

**Solutions:**
1. Enable "Install from unknown sources" in Settings
2. Uninstall previous version if signature changed
3. Check Android version compatibility (minimum Android 5.0)
4. Clear cache and try again
5. Try USB installation with `adb install`

### Build Fails with "Out of memory"

**Problem:** Build process runs out of memory

**Solutions:**
1. Use cloud build instead of local: remove `--local` flag
2. Reduce build concurrency
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
4. Check for circular dependencies

### Cannot Connect to Metro Bundler

**Problem:** Development build won't connect to dev server

**Solutions:**
1. Ensure devices are on same WiFi network
2. Use tunnel mode: `npm start -- --tunnel`
3. Manually enter IP address in app settings
4. Check firewall isn't blocking port 8081
5. Restart Metro bundler with clear cache: `npm start -- --clear`

### Expired Provisioning Profile (iOS)

**Problem:** Build fails with expired certificate error

**Solutions:**
```bash
# Remove old credentials
eas credentials

# Select "Remove provisioning profile"
# Rebuild - EAS will create new profile
eas build --platform ios --profile development
```

### Build Queue Taking Too Long

**Problem:** Waiting hours for build to start

**Solutions:**
1. Use local builds if possible: `--local` flag
2. Upgrade to Expo Pro for priority queue
3. Build during off-peak hours
4. Cancel and restart if stuck for >1 hour

## Build Optimization Tips

1. **Cache Node Modules**: EAS caches dependencies between builds
2. **Use Local Builds for Iteration**: Faster turnaround during active development
3. **Build One Platform at a Time**: Unless deploying, build only platform you're testing
4. **Pre-build Locally First**: Run `npx expo prebuild` locally to catch issues
5. **Monitor Build Logs**: Watch for warnings that could slow builds
6. **Minimize Native Dependencies**: More native code = longer build times

## Cost Considerations

### Free Tier
- Limited builds per month (check current limits)
- Slower build queue
- Suitable for small projects and testing

### Paid Tier (Recommended for Teams)
- Unlimited builds
- Priority build queue
- Faster builds
- Build concurrency
- Essential for active development

### Local Builds Alternative
- Completely free
- Unlimited builds
- Faster iteration
- Requires setup and disk space
- Good for frequent builds during development

## Testing Workflow Best Practices

1. **Initial Device Testing**: Build once, test thoroughly
2. **Iterate with Expo Go**: Use Expo Go for rapid UI changes
3. **Rebuild for Native Changes**: Only rebuild when changing native dependencies
4. **Test on Real Devices**: Simulators/emulators don't catch all issues
5. **Test Both Platforms**: iOS and Android have different behaviors
6. **Beta Test with Preview Profile**: Use preview builds for external testers

## Next Steps

Once you have a working development build:

1. **Set Up Continuous Integration**: Automate builds with GitHub Actions
2. **Internal Distribution**: Share builds with team using EAS Submit
3. **Beta Testing**: Use TestFlight (iOS) or Google Play Internal Testing (Android)
4. **Production Builds**: Configure production profile for app store submission
5. **Over-the-Air Updates**: Set up EAS Update for instant updates without rebuilds

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds Guide](https://docs.expo.dev/development/getting-started/)
- [EAS Credentials](https://docs.expo.dev/app-signing/app-credentials/)
- [Internal Distribution](https://docs.expo.dev/build/internal-distribution/)
- [Local Builds](https://docs.expo.dev/build-reference/local-builds/)
- [EAS Build Pricing](https://expo.dev/pricing)
