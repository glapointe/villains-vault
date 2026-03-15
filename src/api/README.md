# Villains Vault API

.NET 10 ASP.NET Core Web API for managing Villains Vault race results and user profiles.

## Features

- **Repository Pattern**: Clean separation between data access and business logic
- **Auto User Creation**: Users automatically created in database on first authentication
- **First User Admin**: The first user to authenticate automatically becomes an admin
- **Auth0 Integration**: JWT Bearer authentication with Auth0
- **SQL Server Database**: SQL Server LocalDB for local development, Azure SQL for production with EF Core
- **Auto Migration**: Database automatically migrates on startup
- **Health Checks**: Built-in ASP.NET Core health endpoint with database monitoring
- **Static File Support**: Serves React build from wwwroot for single-server deployment

## Database

### SQL Server (LocalDB)
- Database: `VillainsVault` on `(localdb)\MSSQLLocalDB`
- Automatically created and migrated on first run
- Connection string configured in `appsettings.json`
- Production uses Azure SQL via connection string override

### Migrations

The database automatically migrates on startup. To manually manage migrations:

```bash
# Create a new migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Remove last migration
dotnet ef migrations remove
```

## Authentication Flow

1. **Frontend** authenticates with Auth0 and receives JWT access token
2. **Frontend** sends API request with `Authorization: Bearer {token}` header
3. **API** validates JWT signature and claims
4. **API** extracts `sub`, `email`, and `name` claims from token
5. **UserService** checks if user exists by subject identifier (`sub` claim)
   - If **new user**: Creates user in database
   - If **first user**: Sets `IsAdmin = true`
   - If **existing user**: Returns existing record
6. **API** returns user profile to frontend

## CORS Configuration

The API is configured to allow requests from:
- `http://localhost:8081` - Expo web
- `exp://localhost:8081` - Expo mobile app
- `http://localhost:19006` - Alternative Expo port
- Mobile platforms (iOS/Android)

Update the CORS policy in `Program.cs` if your frontend runs on different ports.

## Environment Variables

No environment variables required - all configuration is in `appsettings.json` files.

For production, you should:
1. Use environment variables or Azure Key Vault for Auth0 credentials
2. Configure Azure SQL connection string
3. Configure proper CORS origins
4. Enable HTTPS only

## Development

### Watch Mode
```bash
dotnet watch run
```

### View Logs
All authentication and database operations are logged to console in development mode.

## Troubleshooting

### "Authentication failed" errors
- Verify Auth0 Domain and Audience match your Auth0 application
- Check that the JWT token includes the correct audience
- Ensure frontend is sending token in `Authorization: Bearer {token}` header

### Database errors
- Drop and recreate the LocalDB database: `sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "DROP DATABASE VillainsVault"` then restart
- Check migration files in `Migrations/` folder
- Run `dotnet ef database update` manually

### CORS errors
- Verify frontend URL is in CORS policy in `Program.cs`
- Check browser console for specific CORS error messages
