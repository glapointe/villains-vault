namespace Falchion.Villains.Vault.Api.DTOs;

/// <summary>
/// DTO representing a hero carousel image with URLs for full-size and thumbnail versions.
/// </summary>
public class HeroImageDto
{
	/// <summary>
	/// The filename (e.g., "20260224153045123.jpg")
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
}
