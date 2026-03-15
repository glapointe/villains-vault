# Admin User Management

## Overview

Villains Vault uses automatic user provisioning with first-user admin assignment. When a user authenticates with Auth0 for the first time, the backend API automatically creates a user record in the database. The first user to authenticate is automatically assigned admin privileges.

This design eliminates the need for manual user setup and ensures there's always an admin who can manage other users.

## How It Works

### User Authentication Flow

1. User authenticates via Auth0 (Google, Apple, Facebook, or Microsoft)
2. Frontend receives JWT access token from Auth0
3. Frontend calls `GET /api/v1.0/users/me` with Bearer token
4. Backend validates JWT and extracts user claims (`sub`, `email`, `name`)
5. Backend checks if user exists in database by subject identifier
6. If user doesn't exist, backend creates new user record
7. Backend returns user profile including `isAdmin` status
8. Frontend stores user data and uses `isAdmin` to control access to admin features

### First User Admin Assignment

The first user to authenticate receives admin privileges automatically:

```csharp
var userCount = await _context.Users.CountAsync();
var isFirstUser = userCount == 0;

var user = new User
{
    SubjectId = subjectId,
    Email = email,
    DisplayName = name,
    IsAdmin = isFirstUser,
    CreatedAt = DateTime.UtcNow
};
```

This logic is in `Services/UserService.cs` in the `GetOrCreateUserAsync()` method.

## Initial Setup

### Prerequisites

- Auth0 account configured with social authentication (see [AUTH0_SOCIAL_SETUP.md](AUTH0_SOCIAL_SETUP.md))
- .NET 10 SDK installed
- Node.js and npm installed

### Backend Configuration

1. **Update `appsettings.Development.json`** with your Auth0 credentials:
   ```json
   {
     "Auth0": {
       "Domain": "your-domain.us.auth0.com",
       "Audience": "https://your-api-audience"
     },
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=VillainsVault;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }
   ```

2. **Run database migrations** (executes automatically on startup):
   ```bash
   cd src/api/Falchion.Villains.Vault.Api
   dotnet run
   ```

The database will be created automatically on SQL Server LocalDB.

### Frontend Configuration

Update `.env.local` in `src/app/`:
```env
EXPO_PUBLIC_AUTH0_DOMAIN=your-domain.us.auth0.com
EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID=your_native_client_id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://your-api-audience
EXPO_PUBLIC_API_URL=http://localhost:5000
```

**Important:** The `EXPO_PUBLIC_AUTH0_AUDIENCE` must match the backend `Auth0:Audience` configuration.

## Architecture

### Database Schema

**User Table:**
- `Id` - Auto-incrementing primary key
- `SubjectId` - Auth0 subject identifier (unique index)
- `Email` - User email address
- `DisplayName` - Optional display name
- `IsAdmin` - Boolean flag for admin privileges
- `CreatedAt` - User creation timestamp
- `UpdatedAt` - Last update timestamp

### Key Components

**Backend:**
- `Data/Entities/User.cs` - User entity model
- `Data/ApplicationDbContext.cs` - EF Core database context
- `Services/UserService.cs` - User management business logic
- `Controllers/UsersController.cs` - User API endpoints
- `Program.cs` - Auth0 JWT authentication configuration

**Frontend:**
- `features/auth/providers/AuthProvider.web.tsx` - Web authentication provider
- `features/auth/providers/AuthProvider.native.tsx` - Native authentication provider
- `hooks/useAuth.ts` - Unified authentication hook
- `services/api/users.ts` - User API client

## API Endpoints

### GET /api/v1.0/users/me

Returns the current authenticated user's profile. Auto-creates user on first login.

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "id": "1",
  "email": "user@example.com",
  "displayName": "User Name",
  "isAdmin": true,
  "createdAt": "2026-02-18T10:30:00Z"
}
```

## Manual Admin Management

While the first user is automatically assigned admin privileges, you may need to manually manage admin status for subsequent users.

### Using SQL

```bash
# Connect to LocalDB
sqlcmd -S "(localdb)\MSSQLLocalDB" -d VillainsVault

# View all users
SELECT * FROM Users;
GO

# Grant admin to a user
UPDATE Users SET IsAdmin = 1 WHERE Email = 'user@example.com';
GO

# Revoke admin from a user
UPDATE Users SET IsAdmin = 0 WHERE Email = 'user@example.com';
GO
```

### Using UserService

The `UserService.cs` provides methods for admin management:

```csharp
// Grant admin privileges
await userService.UpdateAdminStatusAsync(userId, isAdmin: true);

// Revoke admin privileges
await userService.UpdateAdminStatusAsync(userId, isAdmin: false);
```

## Testing

### Test First User Admin Assignment

1. Delete the database if it exists:
   ```bash
   cd src/api/Falchion.Villains.Vault.Api
   sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "DROP DATABASE VillainsVault"
   ```

2. Start the API:
   ```bash
   dotnet run
   ```

3. Start the frontend:
   ```bash
   cd src/app
   npm run web
   ```

4. Login with your account

5. Verify in API logs:
   ```
   First user created with admin privileges: auth0|123456789
   ```

6. Check user profile in browser DevTools - `isAdmin` should be `true`

### Test Subsequent Users

1. Logout from the first account
2. Login with a different account
3. Verify `isAdmin` is `false` in user profile
4. API logs should show: `New user created: auth0|987654321`

### Platform Testing

Test on all platforms to ensure consistent behavior:

- **Web:** `npm run web`
- **iOS:** `npm run ios`
- **Android:** `npm run android`

The `isAdmin` property should work identically across all platforms.

## Troubleshooting

### "Auth0 configuration is missing"

**Cause:** Backend is missing Auth0 configuration.

**Solution:**
- Verify `appsettings.Development.json` contains Auth0 Domain and Audience
- Ensure values match your Auth0 application settings
- Restart the API after configuration changes

### "Unauthorized" when calling /api/v1.0/users/me

**Cause:** JWT token validation failing.

**Solution:**
- Check Network tab in browser DevTools - verify `Authorization: Bearer <token>` header is present
- Ensure `EXPO_PUBLIC_AUTH0_AUDIENCE` matches backend `Auth0:Audience`
- Verify Auth0 Action is configured to add custom claims (see [AUTH0_SOCIAL_SETUP.md](AUTH0_SOCIAL_SETUP.md))
- Check API logs for authentication failure details

### isAdmin always false

**Cause:** User was not the first to authenticate.

**Solution:**
- To reset and make a specific user the admin:
  1. Drop database: `sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "DROP DATABASE VillainsVault"`
  2. Restart API: `dotnet run`
  3. Login with the account that should be admin (must be first login)
- Alternatively, manually update the database (see Manual Admin Management section)

### API CORS errors

**Cause:** Frontend URL not allowed by CORS policy.

**Solution:**
- Verify frontend URL is in CORS policy in `Program.cs`
- Default allowed origins: `http://localhost:8081`, `http://localhost:19006`
- Check browser console for specific CORS error message
- Ensure `EXPO_PUBLIC_API_URL` points to correct API URL

## Security Considerations

- Admin status is persistent and stored in the database
- Only users with `isAdmin: true` should be able to access admin endpoints
- Use the `[Authorize(Policy = "AdminOnly")]` attribute on admin-only API endpoints
- Frontend should hide admin UI for non-admin users, but backend must enforce authorization
- Subject identifiers (`sub` claim) are globally unique and come from Auth0

