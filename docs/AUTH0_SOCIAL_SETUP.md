# Auth0 Social Authentication Setup

## Overview

Villains Vault uses Auth0 for authentication with social login providers (Google, Apple, Facebook, Microsoft). This guide walks through the complete setup process for Auth0, from creating applications to configuring custom claims.

Social authentication provides a better user experience and eliminates costs associated with passwordless email/SMS authentication.

## Benefits of Social Authentication

- **No authentication costs** - Social providers handle authentication for free
- **Better user experience** - One-click login with existing accounts
- **Higher conversion rates** - Users prefer familiar social login
- **Apple App Store compliance** - Required when offering other third-party authentication
- **Enterprise-ready** - Microsoft authentication supports work accounts

## Prerequisites

- Auth0 account (free tier is sufficient for development)
- Access to Auth0 Dashboard
- Domain configured in Auth0

## Setup Steps

### Step 1: Create Auth0 Applications

You need **two separate applications** in Auth0 - one for web and one for mobile platforms.

#### Create Web Application (SPA)

1. Login to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications > Applications**
3. Click **Create Application**
4. Application settings:
   - **Name:** `Villains Vault - Web`
   - **Application Type:** Single Page Application
5. Click **Create**
6. Note the **Client ID** (needed for frontend configuration)

#### Create Native Application (iOS & Android)

1. In Auth0 Dashboard, go to **Applications > Applications**
2. Click **Create Application**
3. Application settings:
   - **Name:** `Villains Vault - Mobile`
   - **Application Type:** Native
4. Click **Create**
5. Note the **Client ID** (this single ID is used by both iOS and Android)

### Step 2: Create and Configure Auth0 API

Create an API in Auth0 to represent your backend. This API identifier becomes the "audience" that your applications request when authenticating.

#### Create the API

1. In Auth0 Dashboard, navigate to **Applications > APIs**
2. Click **Create API**
3. Configure API settings:
   - **Name:** `Villains Vault API`
   - **Identifier:** `https://falchion.villains.vault`
   - **Signing Algorithm:** RS256 (recommended)
4. Click **Create**

**Important:** The API Identifier (`https://falchion.villains.vault`) doesn't need to be a real URL - it's just a unique identifier. This value must match:
- The `Audience` in your backend `appsettings.json`
- The namespace used in your Auth0 Actions for custom claims
- The `EXPO_PUBLIC_AUTH0_AUDIENCE` in your frontend `.env.local`

#### Configure API Settings

1. In the API settings page, review the following:

**Token Settings:**
- **Token Expiration:** 86400 seconds (24 hours) - adjust as needed
- **Token Expiration For Browser Flows:** 7200 seconds (2 hours) - recommended for security
- **Allow Offline Access:** Enable if you need refresh tokens

**RBAC Settings:**
- **Enable RBAC:** Optional (only if using role-based permissions)
- **Add Permissions in the Access Token:** Optional (only if using permissions/scopes)

2. Click **Save** if you made changes

#### Grant Applications Access to API

Allow your Web and Native applications to request tokens for this API.

**For Web Application:**
1. Navigate to **Applications > Applications**
2. Select your **Villains Vault - Web** application
3. Click the **APIs** tab
4. Find `Villains Vault API` in the list
5. Click the toggle to **Authorize** the application
6. The audience `https://falchion.villains.vault` is now available to this application

**For Native Application:**
1. Navigate to **Applications > Applications**
2. Select your **Villains Vault - Mobile** application
3. Click the **APIs** tab
4. Find `Villains Vault API` in the list
5. Click the toggle to **Authorize** the application
6. The audience `https://falchion.villains.vault` is now available to this application

**Why this matters:** When users authenticate, your application requests an access token for the specific API audience. Auth0 only returns tokens for APIs that the application is authorized to access. Without this authorization, authentication will fail with "unauthorized client" errors.

#### Verify API Configuration

To confirm setup:

1. Go to **Applications > APIs**
2. Click on **Villains Vault API**
3. Click the **Test** tab
4. Select one of your applications from the dropdown
5. Click **Copy Token** - this generates a test access token
6. Paste the token into [jwt.io](https://jwt.io) to decode it
7. Verify the token contains:
   - `"aud": "https://falchion.villains.vault"` (your API identifier)
   - `"iss": "https://YOUR_DOMAIN.us.auth0.com/"` (your Auth0 domain)

### Step 3: Enable Social Connections

Configure the social identity providers you want to support.

1. In Auth0 Dashboard, navigate to **Authentication > Social**
2. Configure each provider:

#### Google (google-oauth2)

1. Click **Google**
2. Choose one:
   - **Continue with defaults** - Uses Auth0's shared credentials (fastest for development)
   - **Use custom OAuth app** - Requires Google Cloud Console setup (recommended for production)
3. Add your Auth0 Allowed Callback URLs (auto-configured)
4. Click **Create** or **Save**
5. Navigate to **Applications** tab
6. Enable for **both** your Web and Mobile applications
7. Click **Save**

#### Apple (apple)

1. Click **Apple**
2. If using custom credentials, configure:
   - Services ID (from Apple Developer)
   - Apple Team ID
   - Client Secret Signing Key
   - Key ID
3. Add Allowed Callback URLs (auto-configured by Auth0)
4. Click **Create** or **Save**
5. Navigate to **Applications** tab
6. Enable for **both** your Web and Mobile applications
7. Click **Save**

**Note:** Apple authentication is **required** if you submit to iOS App Store with other third-party authentication options.

#### Facebook (facebook)

1. Click **Facebook**
2. Choose one:
   - **Continue with defaults** - Uses Auth0's shared credentials (fastest for development)
   - **Use custom Facebook App** - Requires Facebook Developers setup (recommended for production)
3. Add your Auth0 Allowed Callback URLs (auto-configured)
4. Click **Create** or **Save**
5. Navigate to **Applications** tab
6. Enable for **both** your Web and Mobile applications
7. Click **Save**

#### Microsoft (windowslive)

1. Click **Microsoft Account**
2. Choose one:
   - **Continue with defaults** - Uses Auth0's shared credentials
   - **Use custom Azure AD app** - Requires Azure Portal setup
3. Add Allowed Callback URLs (auto-configured)
4. Click **Create** or **Save**
5. Navigate to **Applications** tab
6. Enable for **both** your Web and Mobile applications
7. Click **Save**

### Step 4: Configure Custom Claims Action

**Critical:** Auth0 access tokens don't include user profile data by default. You must create an Action to add email and name claims.

1. In Auth0 Dashboard, navigate to **Actions > Library**
2. Click **Build Custom** (top right corner)
3. Configure the Action:
   - **Name:** `Add User Claims to Access Token`
   - **Trigger:** Login / Post Login
   - **Runtime:** Node 18 (recommended)
4. Replace the code with:

```javascript
exports.onExecutePostLogin = async (event, api) => {
	const namespace = 'https://falchion.villains.vault'; // Must match your API identifier from Step 2
	
	if (event.authorization) {
		// Add user profile claims to access token
		api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email);
		api.accessToken.setCustomClaim(`${namespace}/name`, event.user.name);
		api.accessToken.setCustomClaim(`${namespace}/sub`, event.user.user_id);
	}
};
```

5. Click **Deploy** (bottom left)

6. Navigate to **Actions > Flows > Login**
7. Click **Custom** tab on the right panel
8. **Drag** your `Add User Claims to Access Token` action from the right panel into the flow
9. Position it between **Start** and **Complete** nodes
10. Click **Apply** (top right)

**Why this is needed:** Auth0 access tokens include only standard OIDC claims (`iss`, `aud`, `sub`, etc.) by default. User profile information must be explicitly added via Actions using a namespaced custom claim to avoid collisions.

### Step 5: Configure Application URLs

Configure allowed callback, logout, and origin URLs for each application.

#### Web Application Configuration

1. Select your Web SPA application in Auth0 Dashboard
2. Navigate to **Settings** tab
3. Configure **Application URIs**:

**Allowed Callback URLs:**
```
http://localhost:8081/callback
https://yourdomain.com/callback
```

**Allowed Logout URLs:**
```
http://localhost:8081
https://yourdomain.com
```

**Allowed Web Origins:**
```
http://localhost:8081
https://yourdomain.com
```

**Allowed Origins (CORS):**
```
http://localhost:8081
https://yourdomain.com
```

4. Click **Save Changes**

#### Native Application Configuration

1. Select your Native application in Auth0 Dashboard
2. Navigate to **Settings** tab
3. Configure **Application URIs**:

**Allowed Callback URLs:**
- Leave **EMPTY** (automatically configured based on app bundle identifier)

**Allowed Logout URLs:**
- Leave **EMPTY** (automatically configured)

The `react-native-auth0` SDK handles callback URL construction automatically using your app's bundle identifier.

4. Click **Save Changes**

### Step 6: Disable Passwordless Authentication

Since we're using only social providers, disable passwordless email to avoid confusion.

For **each** application (Web and Mobile):

1. Open the application in Auth0 Dashboard
2. Navigate to **Connections** tab
3. **Disable** the following if enabled:
   - Email (passwordless)
   - SMS (passwordless)
4. **Enable** your social connections:
   - google-oauth2
   - apple
   - windowslive
   - facebook
5. Click **Save**

## Environment Configuration

### Backend Configuration

Update `src/api/Falchion.Villains.Vault.Api/appsettings.Development.json`:

```json
{
	"Auth0": {
		"Domain": "your-domain.us.auth0.com",
		"Audience": "https://falchion.villains.vault"
	}
}
```

**Note:** The `Audience` must exactly match your Auth0 API identifier created in Step 2.

### Frontend Configuration

Create `.env.local` in `src/app/` directory:

```env
# Auth0 Domain (same for both platforms)
EXPO_PUBLIC_AUTH0_DOMAIN=your-domain.us.auth0.com

# Auth0 API Audience (must match API identifier from Step 2 and backend configuration)
EXPO_PUBLIC_AUTH0_AUDIENCE=https://falchion.villains.vault

# Web SPA Client ID
EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID=your_web_client_id_here

# Native Client ID (shared by iOS and Android)
EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID=your_native_client_id_here

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:5000
```

**Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

## Testing

### Test Web Authentication

1. Start the backend API:
   ```bash
   cd src/api/Falchion.Villains.Vault.Api.Api
   dotnet run
   ```

2. Start the web frontend:
   ```bash
   cd src/app
   npm run web
   ```

3. Navigate to `http://localhost:8081`
4. Click a social login button (Google, Apple, Facebook, or Microsoft)
5. Complete authentication with the provider
6. You should be redirected back to the app and logged in

### Test Native Authentication

1. Ensure backend API is running

2. Build and run iOS:
   ```bash
   cd src/app
   npm run ios
   ```

   Or Android:
   ```bash
   npm run android
   ```

3. Tap a social login button
4. Device opens system browser for authentication
5. Complete authentication
6. App opens automatically via deep link
7. You should be logged in

## Social Provider Custom Setup (Optional)

For production deployments, you should configure custom OAuth apps rather than using Auth0's shared credentials.

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Navigate to **Credentials**
5. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `https://YOUR_AUTH0_DOMAIN/login/callback`
6. Copy Client ID and Client Secret
7. In Auth0 Dashboard, edit Google connection and paste credentials

### Apple Developer

1. Login to [Apple Developer](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a **Services ID** for Sign in with Apple
4. Configure:
   - Return URLs: `https://YOUR_AUTH0_DOMAIN/login/callback`
   - Domains: Your Auth0 domain
5. Generate a private key for authentication
6. In Auth0 Dashboard, edit Apple connection and configure:
   - Services ID
   - Apple Team ID
   - Client Secret Signing Key (private key)
   - Key ID

### Microsoft Azure
### Microsoft Azure

1. Login to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**
4. Configure:
   - Name: Your application name
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: `https://YOUR_AUTH0_DOMAIN/login/callback`
5. Copy Application (client) ID
6. In Auth0 Dashboard, edit Microsoft connection and paste Client ID

### Facebook Developers

1. Login to [Facebook Developers](https://developers.facebook.com)
2. Click **My Apps** > **Create App**
3. Select **Consumer** as the app type
4. Configure:
   - App name: Your application name
   - App contact email: Your email
5. Once created, go to **Settings > Basic**
6. Copy **App ID** and **App Secret**
7. Add **App Domains**: Your Auth0 domain (without https://)
8. Go to **Facebook Login > Settings**
9. Add **Valid OAuth Redirect URIs**: `https://YOUR_AUTH0_DOMAIN/login/callback`
10. In Auth0 Dashboard, edit Facebook connection and paste App ID and App Secret

## Connection Identifiers Reference

These are the exact connection names used in the codebase:

```typescript
export const socialConnections = {
	google: 'google-oauth2',    // Google OAuth 2.0
	apple: 'apple',             // Sign in with Apple
	microsoft: 'windowslive',   // Microsoft Account
	facebook: 'facebook',       // Facebook Login
} as const;
```

These identifiers are case-sensitive and must match exactly in Auth0 Dashboard.

## Troubleshooting

### "Unauthorized client" or "access_denied" error

**Cause:** Application is not authorized to access the API.

**Solution:**
- Go to **Applications > Applications** in Auth0 Dashboard
- Select your application (Web or Mobile)
- Click the **APIs** tab
- Verify `Villains Vault API` is toggled to **Authorized**
- If not, enable authorization for the API
- Test authentication again

### "Invalid audience" error

**Cause:** Audience mismatch between frontend, backend, and Auth0 API configuration.

**Solution:**
- Verify API identifier in Auth0 Dashboard (**Applications > APIs > Villains Vault API**)
- Check backend `appsettings.json` - `Auth0.Audience` must match exactly
- Check frontend `.env.local` - `EXPO_PUBLIC_AUTH0_AUDIENCE` must match exactly
- Check Auth0 Action - namespace must match exactly
- All four values must be identical: `https://falchion.villains.vault`
- Note: This is case-sensitive and must include the protocol (https://)

### "Connection not enabled"

**Cause:** Social connection not enabled for the application or not configured in Auth0.

**Solution:**
- Verify connection is enabled in **Authentication > Social** in Auth0 Dashboard
- Check connection is enabled for your specific application in **Applications > [Your App] > Connections**
- Ensure connection name matches exactly (case-sensitive)

### "Email is required" error from API

**Cause:** Access token doesn't contain email claim.

**Solution:**
- Verify Auth0 Action is created and deployed
- Ensure Action is added to Login Flow (Actions > Flows > Login)
- Check Action is positioned between **Start** and **Complete** nodes
- Verify namespace in Action matches your API: `https://falchion.villains.vault`
- Test by decoding access token at [jwt.io](https://jwt.io) - should see custom claims

### iOS deep link not working

**Cause:** App bundle identifier not configured correctly.

**Solution:**
- Verify bundle identifier in `app.config.js` matches Auth0 configuration
- Check iOS URL scheme is configured: `villains-vault://`
- Rebuild native app:
  ```bash
  cd src/app
  npx expo prebuild --clean
  npm run ios
  ```
- Ensure Allowed Callback URLs in Auth0 are **empty** (auto-configured for native)

### Android deep link not working

**Cause:** App scheme or package name mismatch.

**Solution:**
- Verify package name in `app.config.js` matches Auth0 configuration
- Check Android intent filter is configured correctly
- Rebuild native app:
  ```bash
  cd src/app
  npx expo prebuild --clean
  npm run android
  ```
- Verify Allowed Callback URLs in Auth0 are **empty** for Native apps

### Web redirect not working

**Cause:** Callback URL not configured or callback route missing.

**Solution:**
- Verify Allowed Callback URLs includes `http://localhost:8081/callback`
- Check callback route exists at `app/(auth)/callback.tsx`
- Ensure Auth0 web client ID is correct in `.env.local`
- Check browser console for specific error messages

### "Invalid state" error

**Cause:** State mismatch during OAuth flow (usually from stale callback).

**Solution:**
- Clear browser cookies and local storage
- Restart authentication flow
- Ensure system time is synchronized (OAuth is time-sensitive)

### Custom claims not appearing in token

**Cause:** Action not deployed or not in flow.

**Solution:**
- In Auth0 Dashboard, go to **Actions > Library**
- Find your `Add User Claims to Access Token` action
- Verify status shows **Deployed** (not Draft)
- Check **Actions > Flows > Login** - ensure action is in the flow
- Try re-deploying the action (click Deploy button)

## Security Best Practices

- **Never expose Client Secrets** - Only Single Page Applications (no secrets needed)
- **Use HTTPS in production** - Required for OAuth callback URLs
- **Validate tokens on backend** - Don't trust client-side authentication
- **Rotate credentials periodically** - Especially for production environments
- **Use custom OAuth apps in production** - Don't rely on Auth0's shared credentials
- **Enable MFA for Auth0 Dashboard** - Protect your Auth0 management account
- **Monitor Auth0 logs** - Check for suspicious authentication attempts

## Production Deployment Checklist

Before deploying to production:

- [ ] Configure custom OAuth apps for each provider (not Auth0 defaults)
- [ ] Update Allowed Callback URLs with production domain
- [ ] Update Allowed Logout URLs with production domain
- [ ] Update Allowed Web Origins with production domain
- [ ] Configure custom domain for Auth0 (optional but recommended)
- [ ] Test authentication flow on all platforms (web, iOS, Android)
- [ ] Verify custom claims are present in access tokens
- [ ] Enable MFA for Auth0 dashboard access
- [ ] Set up Auth0 monitoring and alerts
- [ ] Document Auth0 credentials securely (e.g., password manager)
- [ ] Configure rate limiting in Auth0 to prevent abuse
- [ ] Review Auth0 audit logs

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Actions Documentation](https://auth0.com/docs/customize/actions)
- [React Native Auth0 SDK](https://github.com/auth0/react-native-auth0)
- [Auth0 React SDK](https://github.com/auth0/auth0-react)
- [JWT.io](https://jwt.io) - Decode and verify JWTs
- [Auth0 Community](https://community.auth0.com) - Get help from the community

## Related Documentation

- [ADMIN_USER_SETUP.md](ADMIN_USER_SETUP.md) - Admin user management and first-user setup
- Project README - Overall project setup and architecture
