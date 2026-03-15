# Microsoft Clarity Analytics Integration

This directory contains the Microsoft Clarity integration for tracking user behavior across web and mobile platforms.

**⚠️ Current Status**: Web tracking is fully functional. Native (iOS/Android) tracking requires additional configuration (see Native Limitations below).

## Architecture

The implementation follows the platform-specific provider pattern used throughout the app (similar to Auth0):

- **Web**: Uses Clarity JavaScript snippet injected into DOM
- **Native (iOS/Android)**: Uses `@microsoft/react-native-clarity` SDK
- **Unified Interface**: `useAnalytics` hook provides consistent API across platforms

## Files

- `providers/ClarityProvider.web.tsx` - Web-specific Clarity initialization
- `providers/ClarityProvider.native.tsx` - Native-specific Clarity initialization  
- `providers/index.ts` - Platform-aware barrel export
- `hooks/useAnalytics.ts` - Unified analytics interface

## Setup

### 1. Environment Variables

Configure in `.env.local`:

```bash
# Required: Web tracking
EXPO_PUBLIC_CLARITY_WEB_PROJECT_ID=your_web_project_id

# Optional: Native tracking (requires bare workflow or config plugin)
EXPO_PUBLIC_CLARITY_NATIVE_PROJECT_ID=your_native_project_id
```

### 2. EAS Secrets (for builds)

For EAS builds, add these as secrets:

```bash
cd src/app
eas env:create --scope project --name EXPO_PUBLIC_CLARITY_WEB_PROJECT_ID --value "your_web_project_id" --visibility "sensitive" --environment "development" --environment "preview" --environment "production"
eas env:create --scope project --name EXPO_PUBLIC_CLARITY_NATIVE_PROJECT_ID --value "your_native_project_id" --visibility "sensitive" --environment "development" --environment "preview" --environment "production"
```

### 3. Clarity Dashboard

Create a web project in [clarity.microsoft.com](https://clarity.microsoft.com):

- **Web Project**: Tracks web app, provides heatmaps and session recordings

*(Mobile project setup can be deferred until native support is configured)*

## Usage

### Automatic Tracking

Clarity is automatically initialized in the root layout (`app/_layout.tsx`). No additional setup required for basic page view/screen tracking.

### Custom Event Tracking

Use the `useAnalytics` hook to track custom events:

```typescript
import { useAnalytics } from '@/hooks';

function RaceResultsScreen() {
	const { trackEvent } = useAnalytics();

	const handleViewResult = (raceId: string) => {
		trackEvent('race_result_viewed', {
			raceId,
			timestamp: new Date().toISOString(),
		});
	};

	return (
		<Button onPress={() => handleViewResult('123')}>
			View Results
		</Button>
	);
}
```

### User Identification

Identify authenticated users for session tracking:

```typescript
import { useAnalytics } from '@/hooks';
import { useAuth } from '@/hooks';

function MyComponent() {
	const { user } = useAuth();
	const { identifyUser } = useAnalytics();

	useEffect(() => {
		if (user) {
			identifyUser(user.sub, {
				email: user.email,
				name: user.name,
			});
		}
	}, [user]);
}
```

## Platform Differences

### Web
- **API**: Uses global `window.clarity()` function
- **Events**: `clarity('event', eventName, properties)`
- **Identify**: `clarity('identify', userId, properties)`
- **Features**: Heatmaps, scroll maps, click tracking

### Native (iOS/Android)
- **API**: Uses `Clarity` SDK from `@microsoft/react-native-clarity`
- **Events**: `Clarity.setCustomTag(eventName, JSON.stringify(properties))`
- **Identify**: `Clarity.setCustomUserId(userId)` + `Clarity.setCustomTag(key, value)`
- **Features**: Session replays, crash analytics, user flows

## Testing

### Web (Fully Functional)
```bash
npm run web
# Check browser console for: [Clarity Web] Initialized with project ID: <your_web_project_id>
```

### Native (Requires Additional Configuration)
```bash
# Current behavior: App runs but shows warnings
npm run ios  # or npm run android
# Check logs for: [Clarity Native] SDK not available. Skipping initialization.
```

After configuring native support (bare workflow or config plugin):
```bash
eas build --platform ios --profile preview
# Install TestFlight build
# Check logs for: [Clarity Native] Initialized with project ID: <your_native_project_id>
```

## Native Limitations

**Important**: `@microsoft/react-native-clarity` does not include an Expo config plugin, which means it cannot be used in a managed Expo workflow without additional steps.

### Current Behavior

- ✅ **Web**: Fully functional using Clarity JS snippet
- ⚠️ **Native**: Provider loads but SDK initialization will fail gracefully with console warnings

### Enabling Native Support

When you're ready to enable native tracking, use **Expo Prebuild** (recommended approach):

#### Step 1: Generate Native Projects

```bash
cd src/app

# Generate native android/ios directories
npx expo prebuild

# This creates android/ and ios/ folders with all native code
```

#### Step 2: Verify Native Code Generation

The prebuild process will:
- Auto-link `@microsoft/react-native-clarity` to native projects
- Configure all required native dependencies
- Generate platform-specific build files

#### Step 3: Update .gitignore (Optional)

Choose one approach:

**Option A: Commit native directories** (recommended for team projects)
- Remove `android/` and `ios/` from .gitignore
- Commit generated code to version control
- Team members get consistent builds

**Option B: Regenerate on demand** (cleaner git history)
- Keep `android/` and `ios/` in .gitignore
- Run `npx expo prebuild --clean` before builds
- EAS Build will run prebuild automatically

#### Step 4: Update Native Provider Import

Remove the try/catch from `ClarityProvider.native.tsx`:

```typescript
import { Clarity, ClarityConfig } from '@microsoft/react-native-clarity';
```

Since native modules will be properly linked after prebuild.

#### Step 5: Test Locally

```bash
# iOS (requires macOS and Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android

# Check logs for: [Clarity Native] Initialized with project ID: <your_native_project_id>
```

#### Step 6: Build with EAS

```bash
# EAS Build automatically runs prebuild if native directories exist
eas build --platform all --profile preview

# Or specify prebuild explicitly in eas.json:
# "build": {
#   "preview": {
#     "distribution": "internal",
#     "prebuildCommand": "npx expo prebuild"
#   }
# }
```

### Alternative Options

If Expo Prebuild doesn't meet your needs:

1. **Create Custom Config Plugin**
   - Write Expo config plugin for @microsoft/react-native-clarity
   - Advanced option requiring native code knowledge
   - See: [Expo Config Plugins Guide](https://docs.expo.dev/guides/config-plugins/)

2. **Use Alternative Analytics**
   - **Firebase Analytics**: Official Expo support via `expo-firebase-analytics`
   - **Mixpanel**: Expo SDK available
   - **Amplitude**: Expo support available
   - All of these work without prebuild

3. **Development Build**
   - Create custom development client with native modules
   - Use `eas build --profile development`
   - Similar to prebuild but focuses on development workflow

### Recommended Approach

**Start with Expo Prebuild when ready for native tracking**:
- ✅ Officially recommended by Expo team
- ✅ Works with EAS Build automatically
- ✅ Supports any React Native library
- ✅ Can regenerate anytime with `--clean` flag
- ✅ Keeps you in Expo ecosystem
- ✅ No custom plugin code needed

For now, the current web-only setup is fully functional and requires no changes.

## Why Two Projects?

- **Different Dashboards**: Web provides heatmaps, native provides session replays
- **Platform-Specific Metrics**: Page views vs. screen navigation patterns
- **Separate Data Streams**: Easier to analyze web vs. mobile user behavior independently
- **API Differences**: Web uses DOM events, native uses SDK custom tags

## Best Practices

1. **Semantic Event Names**: Use descriptive names like `race_result_viewed` instead of `click1`
2. **Structured Properties**: Pass objects with meaningful keys: `{ raceId, eventName, timestamp }`
3. **PII Compliance**: Don't track sensitive data (passwords, credit cards, etc.)
4. **Performance**: Events are queued and sent asynchronously, minimal impact on UI
5. **Development**: Events are tracked in dev mode (check `logLevel` in native config)

## Documentation

- [Clarity for Web](https://learn.microsoft.com/en-us/clarity/)
- [Clarity for React Native](https://github.com/microsoft/clarity/tree/main/packages/clarity-react-native)
- [Clarity Dashboard](https://clarity.microsoft.com)
