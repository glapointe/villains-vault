namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO representing a course map image with URLs for full-size and thumbnail versions.
/// </summary>
public class CourseMapImageDto
{
    /// <summary>
    /// The filename (e.g., "1.jpg")
    /// </summary>
    public string Filename { get; set; } = string.Empty;

    /// <summary>
    /// URL to the full-size image (max 1920px wide)
    /// </summary>
    public string FullUrl { get; set; } = string.Empty;

    /// <summary>
    /// URL to the thumbnail image (300px wide)
    /// </summary>
    public string ThumbnailUrl { get; set; } = string.Empty;

    /// <summary>
    /// When the image was uploaded, derived from the timestamp filename
    /// </summary>
    public DateTime UploadedAt { get; set; }

    /// <summary>
    /// Width divided by height of the full-size image (e.g. 1.77 for 16:9).
    /// Used by clients to correctly size thumbnails without hardcoding dimensions.
    /// </summary>
    public double AspectRatio { get; set; } = 1.0;
}
