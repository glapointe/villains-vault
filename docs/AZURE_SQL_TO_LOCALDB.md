# Azure SQL to LocalDB Migration Guide

Copy production data from Azure SQL to your local development database for testing.

## Prerequisites

- **SQL Server LocalDB** installed (ships with Visual Studio)
- **SqlPackage** CLI tool ([download](https://learn.microsoft.com/en-us/sql/tools/sqlpackage/sqlpackage-download)) or installed via Visual Studio
- **Azure CLI** (`az`) if downloading BACPAC from Azure Storage
- Access to the production Azure SQL database

## Option 1: BACPAC Export/Import (Recommended)

### Step 1: Export from Azure SQL

**Via Azure Portal:**
1. Navigate to **Azure Portal** → your SQL Database
2. Click **Export** on the toolbar
3. Configure export settings and save to an Azure Storage Account
4. Download the `.bacpac` file

**Via SqlPackage CLI:**
```powershell
sqlpackage /Action:Export `
    /TargetFile:"VillainsVault.bacpac" `
    /SourceConnectionString:"Server=tcp:your-server.database.windows.net,1433;Database=VillainsVault;Authentication=Active Directory Default;Encrypt=True;"
```

> **Note:** If using SQL authentication instead of Entra ID, replace the connection string:
> ```
> Server=tcp:your-server.database.windows.net,1433;Database=VillainsVault;User ID=your-admin;Password=your-password;Encrypt=True;TrustServerCertificate=False;
> ```

### Step 2: Drop Existing Local Database (if exists)

```powershell
# Connect to LocalDB and drop the existing database
sqlcmd -S "(localdb)\MSSQLLocalDB" -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = 'VillainsVault') BEGIN ALTER DATABASE [VillainsVault] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [VillainsVault]; END"
```

### Step 3: Import to LocalDB

```powershell
sqlpackage /Action:Import `
    /SourceFile:"VillainsVault.bacpac" `
    /TargetConnectionString:"Server=(localdb)\MSSQLLocalDB;Database=VillainsVault;Trusted_Connection=True;TrustServerCertificate=True;"
```

This creates the database with the full schema and all data.

### Step 4: Verify

```powershell
# Quick row count check
sqlcmd -S "(localdb)\MSSQLLocalDB" -d VillainsVault -Q "
SELECT 'Users' AS [Table], COUNT(*) AS [Rows] FROM Users UNION ALL
SELECT 'Events', COUNT(*) FROM Events UNION ALL
SELECT 'Races', COUNT(*) FROM Races UNION ALL
SELECT 'Divisions', COUNT(*) FROM Divisions UNION ALL
SELECT 'Jobs', COUNT(*) FROM Jobs UNION ALL
SELECT 'RaceResults', COUNT(*) FROM RaceResults
"
```

Then start the API and verify:
```powershell
cd src/api/Falchion.Villains.Vault.Api
dotnet run
# Check: https://localhost:5001/api/health
```

## Option 2: DACPAC + Selective Data (Schema Only)

If you only want the schema without production data:

```powershell
# Export schema only
sqlpackage /Action:Extract `
    /TargetFile:"VillainsVault.dacpac" `
    /SourceConnectionString:"Server=tcp:your-server.database.windows.net,1433;Database=VillainsVault;Authentication=Active Directory Default;Encrypt=True;"

# Deploy schema to LocalDB
sqlpackage /Action:Publish `
    /SourceFile:"VillainsVault.dacpac" `
    /TargetConnectionString:"Server=(localdb)\MSSQLLocalDB;Database=VillainsVault;Trusted_Connection=True;TrustServerCertificate=True;"
```

Then scrape fresh data via the admin UI, or use the API to seed test data.

## Option 3: BCP Bulk Copy (Selective Tables)

Copy specific tables only (e.g., results data but not user accounts):

```powershell
# Export a table from Azure SQL
bcp "[dbo].[RaceResults]" out raceresults.dat `
    -S "your-server.database.windows.net" `
    -d VillainsVault -G -N

# Import to LocalDB
bcp "[dbo].[RaceResults]" in raceresults.dat `
    -S "(localdb)\MSSQLLocalDB" `
    -d VillainsVault -T -N
```

> **Note:** Import tables in FK dependency order: Users → Events → Races → Divisions → Jobs → RaceResults

## Troubleshooting

### "Login failed" when connecting to Azure SQL

Ensure you're authenticated:
```powershell
az login
```

Or use SQL authentication credentials from Azure Portal → your database → **Connection strings**.

### SqlPackage not found

Install via:
```powershell
# Via dotnet tool
dotnet tool install -g microsoft.sqlpackage

# Or via winget
winget install Microsoft.SqlPackage
```

### LocalDB not running

```powershell
sqllocaldb start MSSQLLocalDB
```

### Import fails with "database already exists"

Drop it first (see Step 2 above), or use a different database name:
```powershell
sqlpackage /Action:Import `
    /SourceFile:"VillainsVault.bacpac" `
    /TargetConnectionString:"Server=(localdb)\MSSQLLocalDB;Database=VillainsVault_ProdCopy;Trusted_Connection=True;TrustServerCertificate=True;"
```

Then update your `appsettings.Development.json` to point to the new database name.

### EF migration history mismatch

If the BACPAC was exported from a database at a different migration state, you may see warnings on startup. To fix:
```powershell
# Check current migration state
sqlcmd -S "(localdb)\MSSQLLocalDB" -d VillainsVault -Q "SELECT * FROM __EFMigrationsHistory"

# If empty or mismatched, insert the current migration
sqlcmd -S "(localdb)\MSSQLLocalDB" -d VillainsVault -Q "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260306231159_InitialCreate', '10.0.3')"
```
