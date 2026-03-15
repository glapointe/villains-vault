using Falchion.Villains.Vault.Api.DTOs;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for managing hero carousel images on disk.
/// Images are stored at {ContentBasePath}/content/images/hero/{full|thumbs}/.
/// Filenames use timestamps (yyyyMMddHHmmssfff.jpg) for uniqueness and natural sort order.
/// </summary>
public class HeroImageService
{
	private readonly string _fullDir;
	private readonly string _thumbsDir;
	private readonly string _contentUrlBase;
	private readonly ILogger<HeroImageService> _logger;

	/// <summary>
	/// Maximum width for full-size hero images
	/// </summary>
	private const int FullMaxWidth = 1920;

	/// <summary>
	/// JPEG quality for full-size images
	/// </summary>
	private const int FullJpegQuality = 85;

	/// <summary>
	/// Width for thumbnail images
	/// </summary>
	private const int ThumbWidth = 300;

	/// <summary>
	/// JPEG quality for thumbnail images
	/// </summary>
	private const int ThumbJpegQuality = 75;

	private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
	{
		".jpg", ".jpeg", ".png", ".webp"
	};

	private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
	{
		"image/jpeg", "image/png", "image/webp"
	};

	public HeroImageService(IConfiguration configuration, IWebHostEnvironment environment, ILogger<HeroImageService> logger)
	{
		_logger = logger;

		// Read base path from config, default to App_Data
		var basePath = configuration["Content:BasePath"] ?? "App_Data";

		// Resolve to absolute path if relative
		string absoluteBasePath;
		if (Path.IsPathRooted(basePath))
		{
			absoluteBasePath = basePath;
		}
		else
		{
			absoluteBasePath = Path.Combine(environment.ContentRootPath, basePath);
		}

		_fullDir = Path.Combine(absoluteBasePath, "content", "images", "hero", "full");
		_thumbsDir = Path.Combine(absoluteBasePath, "content", "images", "hero", "thumbs");

		// Ensure directories exist
		Directory.CreateDirectory(_fullDir);
		Directory.CreateDirectory(_thumbsDir);

		// URL base for serving content via PhysicalFileProvider mapped to /content
		_contentUrlBase = "/content/images/hero";

		_logger.LogInformation("Hero image storage initialized at {FullDir}", _fullDir);
	}

	/// <summary>
	/// Gets all hero images sorted by filename descending (newest first).
	/// </summary>
	public Task<List<HeroImageDto>> GetAllImagesAsync()
	{
		var images = new List<HeroImageDto>();

		if (!Directory.Exists(_fullDir))
		{
			return Task.FromResult(images);
		}

		var files = Directory.GetFiles(_fullDir, "*.jpg")
			.OrderByDescending(f => Path.GetFileNameWithoutExtension(f));

		foreach (var filePath in files)
		{
			var filename = Path.GetFileName(filePath);
			var dto = CreateDto(filename);
			if (dto != null)
			{
				images.Add(dto);
			}
		}

		return Task.FromResult(images);
	}

	/// <summary>
	/// Gets the most recent N hero images.
	/// </summary>
	public async Task<List<HeroImageDto>> GetRecentImagesAsync(int count = 10)
	{
		var all = await GetAllImagesAsync();
		return all.Take(count).ToList();
	}

	/// <summary>
	/// Uploads an image, resizing to full-size and thumbnail versions.
	/// Returns the DTO for the uploaded image.
	/// </summary>
	public async Task<HeroImageDto> UploadImageAsync(IFormFile file)
	{
		// Validate file
		if (file == null || file.Length == 0)
		{
			throw new ArgumentException("No file provided.");
		}

		var extension = Path.GetExtension(file.FileName);
		if (!AllowedExtensions.Contains(extension))
		{
			throw new ArgumentException($"File type '{extension}' is not allowed. Allowed types: .jpg, .jpeg, .png, .webp");
		}

		if (!AllowedMimeTypes.Contains(file.ContentType))
		{
			throw new ArgumentException($"Content type '{file.ContentType}' is not allowed.");
		}

		// Generate timestamp-based filename
		var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
		var filename = $"{timestamp}.jpg";
		var fullPath = Path.Combine(_fullDir, filename);
		var thumbPath = Path.Combine(_thumbsDir, filename);

		using var inputStream = file.OpenReadStream();
		using var image = await Image.LoadAsync(inputStream);

		// Save full-size (resize if wider than max)
		if (image.Width > FullMaxWidth)
		{
			image.Mutate(x => x.Resize(new ResizeOptions
			{
				Mode = ResizeMode.Max,
				Size = new Size(FullMaxWidth, 0),
			}));
		}

		await image.SaveAsJpegAsync(fullPath, new JpegEncoder { Quality = FullJpegQuality });

		// Create thumbnail
		using var thumbImage = await Image.LoadAsync(fullPath);
		thumbImage.Mutate(x => x.Resize(new ResizeOptions
		{
			Mode = ResizeMode.Max,
			Size = new Size(ThumbWidth, 0),
		}));

		await thumbImage.SaveAsJpegAsync(thumbPath, new JpegEncoder { Quality = ThumbJpegQuality });

		_logger.LogInformation("Hero image uploaded: {Filename} ({Width}x{Height})", filename, image.Width, image.Height);

		return CreateDto(filename)!;
	}

	/// <summary>
	/// Deletes a hero image (both full and thumbnail).
	/// </summary>
	public Task DeleteImageAsync(string filename)
	{
		// Validate filename to prevent path traversal
		if (string.IsNullOrWhiteSpace(filename) ||
			filename.Contains("..") ||
			filename.Contains('/') ||
			filename.Contains('\\') ||
			Path.GetFileName(filename) != filename)
		{
			throw new ArgumentException("Invalid filename.");
		}

		var fullPath = Path.Combine(_fullDir, filename);
		var thumbPath = Path.Combine(_thumbsDir, filename);

		if (!File.Exists(fullPath))
		{
			throw new FileNotFoundException($"Image '{filename}' not found.");
		}

		File.Delete(fullPath);

		if (File.Exists(thumbPath))
		{
			File.Delete(thumbPath);
		}

		_logger.LogInformation("Hero image deleted: {Filename}", filename);

		return Task.CompletedTask;
	}

	/// <summary>
	/// Creates a DTO from a filename, parsing the timestamp.
	/// </summary>
	private HeroImageDto? CreateDto(string filename)
	{
		var nameWithoutExt = Path.GetFileNameWithoutExtension(filename);

		DateTime uploadedAt;
		if (DateTime.TryParseExact(nameWithoutExt, "yyyyMMddHHmmssfff",
			System.Globalization.CultureInfo.InvariantCulture,
			System.Globalization.DateTimeStyles.AssumeUniversal, out var parsed))
		{
			uploadedAt = DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
		}
		else
		{
			// Fallback to file creation time if filename doesn't parse
			var fullPath = Path.Combine(_fullDir, filename);
			uploadedAt = File.Exists(fullPath) ? File.GetCreationTimeUtc(fullPath) : DateTime.UtcNow;
		}

		return new HeroImageDto
		{
			Filename = filename,
			FullUrl = $"{_contentUrlBase}/full/{filename}",
			ThumbnailUrl = $"{_contentUrlBase}/thumbs/{filename}",
			UploadedAt = uploadedAt,
		};
	}
}
