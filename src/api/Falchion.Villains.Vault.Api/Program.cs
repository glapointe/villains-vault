using Falchion.Villains.Vault.Api.Authorization;
using Falchion.Villains.Vault.Api.Data;
using Falchion.Villains.Vault.Api.GraphQL;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Threading.Channels;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Configure database with SQL Server (LocalDB for development, Azure SQL for production)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// If no connection string, use LocalDB default for development
if (string.IsNullOrEmpty(connectionString))
{
    connectionString = "Server=(localdb)\\MSSQLLocalDB;Database=VillainsVault;Trusted_Connection=True;TrustServerCertificate=True;";;
}


builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.CommandTimeout(60);
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    });

    // Enable sensitive data logging in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
    }
});

// Register repositories (data access layer)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IRaceRepository, RaceRepository>();
builder.Services.AddScoped<IDivisionRepository, DivisionRepository>();
builder.Services.AddScoped<IResultRepository, ResultRepository>();
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IRaceResultFollowRepository, RaceResultFollowRepository>();
builder.Services.AddScoped<IDlsDeclarationRepository, DlsDeclarationRepository>();
builder.Services.AddScoped<ICommunityEventRepository, CommunityEventRepository>();
builder.Services.AddScoped<IPushTokenRepository, PushTokenRepository>();
builder.Services.AddScoped<INotificationPreferenceRepository, NotificationPreferenceRepository>();

// Register services (business logic layer)
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TrackShackScraperService>();
builder.Services.AddScoped<ResultEnrichmentService>();
builder.Services.AddScoped<WeatherService>();
builder.Services.AddScoped<HeroImageService>();
builder.Services.AddScoped<CourseMapImageService>();
builder.Services.AddScoped<RaceDataService>();
builder.Services.AddScoped<RaceResultFollowService>();
builder.Services.AddScoped<DlsDeclarationService>();
builder.Services.AddScoped<CommunityEventService>();

// Register push notification services
var notificationChannel = Channel.CreateUnbounded<NotificationMessage>(new UnboundedChannelOptions
{
	SingleReader = true,
});
builder.Services.AddSingleton(notificationChannel);
builder.Services.AddScoped<PushNotificationService>();
builder.Services.AddHostedService<NotificationDispatchBackgroundService>();

// Register AI Chat services (conditionally based on AiChat:Enabled)
builder.Services.Configure<AiChatOptions>(builder.Configuration.GetSection(AiChatOptions.SectionName));
var aiChatEnabled = builder.Configuration.GetSection(AiChatOptions.SectionName).GetValue<bool>("Enabled");
if (aiChatEnabled)
{
	builder.Services.AddSingleton<AgentInstructions>();
	builder.Services.AddSingleton<AiChatService>();
}

// Register memory cache for caching race results
builder.Services.AddMemoryCache();

// Register MCP cache service for tool-level response caching
builder.Services.AddSingleton<McpCacheService>();

// Register response cache middleware for VaryByQueryKeys support
builder.Services.AddResponseCaching();

// Register GraphQL server with projections, filtering, sorting, and EF Core integration
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
	.AddType<Falchion.Villains.Vault.Api.GraphQL.Types.EventType>()
	.AddType<Falchion.Villains.Vault.Api.GraphQL.Types.RaceType>()
	.AddType<Falchion.Villains.Vault.Api.GraphQL.Types.RaceResultType>()
    .AddProjections()
    .AddFiltering()
    .AddSorting()
    // Limit query nesting depth to prevent deeply nested or fan-out queries.
    .AddMaxExecutionDepthRule(10, skipIntrospectionFields: true)
    .ModifyPagingOptions(o =>
    {
        o.MaxPageSize = 500;
        o.DefaultPageSize = 50;
        o.IncludeTotalCount = true;
    })
    .RegisterDbContextFactory<ApplicationDbContext>();

// Register MCP server for AI assistant integrations (Claude, VS Code, etc.)
builder.Services
	.AddMcpServer()
	.WithHttpTransport()
	.WithToolsFromAssembly();

// Rate limiting for MCP and Chat endpoints to prevent abuse
var chatAuthRate = builder.Configuration.GetSection(AiChatOptions.SectionName).GetValue<int?>("RateLimitAuthPerMinute") ?? 10;
var chatAnonRate = builder.Configuration.GetSection(AiChatOptions.SectionName).GetValue<int?>("RateLimitAnonPerMinute") ?? 5;

builder.Services.AddRateLimiter(options =>
{
	options.AddFixedWindowLimiter("mcp", limiter =>
	{
		limiter.PermitLimit = 60;
		limiter.Window = TimeSpan.FromMinutes(1);
	});

    options.AddFixedWindowLimiter("graphql", limiter =>
    {
        limiter.PermitLimit = 60;
        limiter.Window = TimeSpan.FromMinutes(1);
    });
    
	// Authenticated chat users get a higher limit
    options.AddFixedWindowLimiter("chat-auth", limiter =>
	{
		limiter.PermitLimit = chatAuthRate;
		limiter.Window = TimeSpan.FromMinutes(1);
	});

	// Anonymous chat users get a lower limit
	options.AddFixedWindowLimiter("chat-anon", limiter =>
	{
		limiter.PermitLimit = chatAnonRate;
		limiter.Window = TimeSpan.FromMinutes(1);
	});

	options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Register singleton JobQueue for in-memory job queue
builder.Services.AddSingleton<JobQueue>();

// Register background service for processing jobs
builder.Services.AddHostedService<JobProcessorBackgroundService>();

// Configure HttpClient for Track Shack scraping
builder.Services.AddHttpClient("TrackShack", client =>
{
	client.Timeout = TimeSpan.FromMinutes(5);
	client.DefaultRequestHeaders.Add("User-Agent", "Villains.Vault/1.0");
});

// Configure HttpClient for Expo Push API
builder.Services.AddHttpClient("ExpoPush", client =>
{
	client.Timeout = TimeSpan.FromSeconds(30);
	client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Configure CORS with settings from appsettings.json
var corsConfig = builder.Configuration.GetSection("Cors");
var allowAnyOrigin = corsConfig.GetValue<bool>("AllowAnyOrigin");
var allowedOrigins = corsConfig.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowFrontend", policy =>
	{
		if (allowAnyOrigin && builder.Environment.IsDevelopment())
		{
			// In development with AllowAnyOrigin=true, allow any origin
			policy.SetIsOriginAllowed(_ => true)
				.AllowAnyMethod()
				.AllowAnyHeader()
				.AllowCredentials();
		}
		else
		{
			// In production or when AllowAnyOrigin=false, use specific origins
			var origins = allowedOrigins.Length > 0 
				? allowedOrigins 
				: new[] { "http://localhost:8081", "http://localhost:19006" };
			
			policy.WithOrigins(origins)
				.AllowAnyMethod()
				.AllowAnyHeader()
				.AllowCredentials();
		}
	});
});

// Configure JWT Authentication with Auth0
var auth0Domain = builder.Configuration["Auth0:Domain"];
var auth0Audience = builder.Configuration["Auth0:Audience"];

if (string.IsNullOrEmpty(auth0Domain) || string.IsNullOrEmpty(auth0Audience))
{
	throw new InvalidOperationException(
		"Auth0 configuration is missing. " +
		"Please configure Auth0:Domain and Auth0:Audience in appsettings.json or user secrets. " +
		"Run: dotnet user-secrets set \"Auth0:Domain\" \"your-domain.auth0.com\" " +
		"and: dotnet user-secrets set \"Auth0:Audience\" \"https://your-api-audience\"");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.Authority = $"https://{auth0Domain}/";
		options.Audience = auth0Audience;
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidIssuer = $"https://{auth0Domain}/",
			ValidateAudience = true,
			ValidAudience = auth0Audience,
			ValidateLifetime = true,
			ClockSkew = TimeSpan.FromMinutes(5) // Allow 5 minutes clock skew
		};

		// Log authentication failures in development
		options.Events = new JwtBearerEvents
		{
			OnAuthenticationFailed = context =>
			{
				if (builder.Environment.IsDevelopment())
				{
					Console.WriteLine($"[Auth] Authentication failed: {context.Exception.Message}");
				}
				return Task.CompletedTask;
			},
			OnTokenValidated = context =>
			{
				if (builder.Environment.IsDevelopment())
				{
					var userId = context.Principal?.Identity?.Name ?? "Unknown";
					Console.WriteLine($"[Auth] Token validated for user: {userId}");
				}
				return Task.CompletedTask;
			}
		};
	});

// Register authorization handlers
builder.Services.AddSingleton<IAuthorizationHandler, AdminAuthorizationHandler>();

builder.Services.AddAuthorization(options =>
{
	options.AddPolicy("AdminOnly", policy =>
	{
		policy.Requirements.Add(new AdminRequirement());
	});
});

builder.Services.AddOpenApi(options => {});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddSwaggerGen(o => {
    o.SwaggerDoc("public", new OpenApiInfo { Title = "Villains Vault API", Version = "v1.0" });
    o.SwaggerDoc("admin", new OpenApiInfo { Title = "Villains Vault API - Admin", Version = "v1.0" });
    o.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });
    o.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("bearer", document)] = []
    });

}
);

// Add health checks
builder.Services.AddHealthChecks()
	.AddDbContextCheck<ApplicationDbContext>("database");

builder.Services.AddControllers();

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
	var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
	try
	{
		dbContext.Database.Migrate();
		Console.WriteLine("[Database] Migration completed successfully");
	}
	catch (Exception ex)
	{
		Console.WriteLine($"[Database] Migration failed: {ex.Message}");
		throw;
	}
}
// maps to /openapi/v1.json
app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/public/swagger.json", "Villains Vault API - Public API");
#if DEBUG
    c.SwaggerEndpoint("/swagger/admin/swagger.json", "Villains Vault API - Admin API");
#endif
});
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();

// Enable response caching middleware (must come before UseCors)
app.UseResponseCaching();

// Serve static files from wwwroot (for React build output)
app.UseStaticFiles();

// Serve content files (hero images, etc.) from configurable content directory
var contentBasePath = builder.Configuration["Content:BasePath"] ?? "App_Data";
var contentAbsolutePath = Path.IsPathRooted(contentBasePath)
	? contentBasePath
	: Path.Combine(builder.Environment.ContentRootPath, contentBasePath);
var contentDir = Path.Combine(contentAbsolutePath, "content");
if (!Directory.Exists(contentDir))
{
	Directory.CreateDirectory(contentDir);
}
app.UseStaticFiles(new StaticFileOptions
{
	FileProvider = new PhysicalFileProvider(contentDir),
	RequestPath = "/content",
	OnPrepareResponse = ctx =>
	{
		// Hero images use timestamp filenames and never change once uploaded,
		// so they can be cached aggressively (7 days, immutable).
		ctx.Context.Response.Headers.CacheControl = "public, max-age=604800, immutable";
	},
});

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map MCP endpoint for AI assistant integrations (Streamable HTTP + legacy SSE)
app.MapMcp("/mcp").RequireRateLimiting("mcp");

app.MapNitroApp("/api/graphql/ui");
app.MapGraphQL("/api/graphql").RequireRateLimiting("graphql");

// Map health check endpoint
app.MapHealthChecks("/api/health");

// Fallback to index.html for React Router (SPA)
app.MapFallbackToFile("index.html");

Console.WriteLine($"[Server] Starting in {app.Environment.EnvironmentName} mode");
Console.WriteLine($"[Server] Database: SQL Server ({(connectionString.Contains("localdb", StringComparison.OrdinalIgnoreCase) ? "LocalDB" : "Azure SQL")});");
Console.WriteLine($"[Server] CORS: {(allowAnyOrigin && app.Environment.IsDevelopment() ? "AllowAnyOrigin (Dev)" : $"{allowedOrigins.Length} origin(s)")}");

app.Run();