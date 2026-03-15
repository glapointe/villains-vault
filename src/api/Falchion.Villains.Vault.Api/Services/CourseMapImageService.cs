using Falchion.Villains.Vault.Api.DTOs;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for managing course map images on disk.
/// Images are stored at {ContentBasePath}/content/images/maps/{full|thumbs}/.
/// Filenames use race ID ([raceId].jpg) for uniqueness.
/// </summary>
public class CourseMapImageService
{
    private readonly string _fullDir;
    private readonly string _thumbsDir;
    private readonly string _contentUrlBase;
    private readonly ILogger<CourseMapImageService> _logger;

    /// <summary>
    /// Maximum width for full-size course map images
    /// </summary>
    private const int FullMaxWidth = 1920;

    /// <summary>
    /// JPEG quality for full-size images
    /// </summary>
    private const int FullJpegQuality = 85;

    /// <summary>
    /// Width for thumbnail images
    /// </summary>
    private const int ThumbWidth = 150;

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

    public CourseMapImageService(IConfiguration configuration, IWebHostEnvironment environment, ILogger<CourseMapImageService> logger)
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

        _fullDir = Path.Combine(absoluteBasePath, "content", "images", "maps", "full");
        _thumbsDir = Path.Combine(absoluteBasePath, "content", "images", "maps", "thumbs");

        // Ensure directories exist
        Directory.CreateDirectory(_fullDir);
        Directory.CreateDirectory(_thumbsDir);

        // URL base for serving content via PhysicalFileProvider mapped to /content
        _contentUrlBase = "/content/images/maps";

        _logger.LogInformation("Course map image storage initialized at {FullDir}", _fullDir);
    }

    /// <summary>
    /// Retrieves the course map image associated with the specified race identifier.
    /// </summary>
    /// <param name="raceId">The unique identifier of the race for which to retrieve the course map image.</param>
    /// <returns>A <see cref="CourseMapImageDto"/> containing the course map image for the specified race; or <see
    /// langword="null"/> if no image is available.</returns>
    public CourseMapImageDto? GetImage(int raceId)
    {
        var filename = $"{raceId}.jpg";
        return CreateDto(filename);
    }

    /// <summary>
    /// Uploads an image, resizing to full-size and thumbnail versions.
    /// Returns the DTO for the uploaded image.
    /// </summary>
    public async Task<CourseMapImageDto> UploadImageAsync(IFormFile file, int raceId)
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

        var filename = $"{raceId}.jpg";
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

        _logger.LogInformation("Course map image uploaded: {Filename} ({Width}x{Height})", filename, image.Width, image.Height);

        return CreateDto(filename)!;
    }

    /// <summary>
    /// Deletes a course map image (both full and thumbnail).
    /// </summary>
    public Task DeleteImageAsync(int raceId)
    {
        // Validate raceId
        if (raceId <= 0)
        {
            throw new ArgumentException("Invalid race ID.");
        }

        var filename = $"{raceId}.jpg";
        var fullPath = Path.Combine(_fullDir, filename);
        var thumbPath = Path.Combine(_thumbsDir, filename);

        if (!File.Exists(fullPath) ||
            filename.Contains('\\') ||
            Path.GetFileName(filename) != filename)
        {
            throw new ArgumentException("Invalid filename.");
        }

        File.Delete(fullPath);

        if (File.Exists(thumbPath))
        {
            File.Delete(thumbPath);
        }

        _logger.LogInformation("Course map image deleted: {Filename}", filename);

        return Task.CompletedTask;
    }

    /// <summary>
    /// Creates a DTO from a filename.
    /// </summary>
    private CourseMapImageDto? CreateDto(string filename)
    {
        var nameWithoutExt = Path.GetFileNameWithoutExtension(filename);

        var fullPath = Path.Combine(_fullDir, filename);
        if (!File.Exists(fullPath))
        {
            return null;
        }
        DateTime uploadedAt = File.GetCreationTimeUtc(fullPath);

        // Read thumbnail dimensions to provide aspect ratio to the client
        var thumbPath = Path.Combine(_thumbsDir, filename);
        double aspectRatio = 1.0;
        if (File.Exists(thumbPath))
        {
            var info = Image.Identify(thumbPath);
            if (info != null && info.Height > 0)
            {
                aspectRatio = (double)info.Width / info.Height;
            }
        }
        else
        {
            // Fall back to full image if thumb not yet created
            var info = Image.Identify(fullPath);
            if (info != null && info.Height > 0)
            {
                aspectRatio = (double)info.Width / info.Height;
            }
        }

        return new CourseMapImageDto
        {
            Filename = filename,
            FullUrl = $"{_contentUrlBase}/full/{filename}",
            ThumbnailUrl = $"{_contentUrlBase}/thumbs/{filename}",
            UploadedAt = uploadedAt,
            AspectRatio = aspectRatio,
        };
    }
}
