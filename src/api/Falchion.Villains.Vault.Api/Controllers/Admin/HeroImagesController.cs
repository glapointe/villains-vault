using Falchion.Villains.Vault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Falchion.Villains.Vault.Api.Controllers.Admin;

/// <summary>
/// Admin endpoints for managing hero carousel images.
/// Supports listing all images, uploading new images, and deleting images.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "admin")]
[Tags("Hero Images")]
[Route("api/v1.0/admin/hero-images")]
[Authorize(Policy = "AdminOnly")]
public class HeroImagesController : ApiControllerBase
{
	private readonly HeroImageService _heroImageService;
	private readonly ILogger<HeroImagesController> _logger;

	public HeroImagesController(
		HeroImageService heroImageService,
		ILogger<HeroImagesController> logger)
	{
		_heroImageService = heroImageService;
		_logger = logger;
	}

	/// <summary>
	/// Get all hero images (admin view with thumbnails).
	/// Returns all images sorted newest first.
	/// </summary>
	[HttpGet]
	public async Task<IActionResult> GetAllImages()
	{
		try
		{
			var images = await _heroImageService.GetAllImagesAsync();
			return Ok(images);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving all hero images");
			return StatusCode(500, new { error = "Failed to retrieve hero images." });
		}
	}

	/// <summary>
	/// Upload a new hero image (admin only).
	/// Accepts JPEG, PNG, or WebP. Image is resized to full-size (max 1920px) and thumbnail (300px).
	/// Filename is auto-generated from a UTC timestamp for uniqueness and sort order.
	/// </summary>
	[HttpPost]
	[RequestSizeLimit(20 * 1024 * 1024)] // 20 MB max
	public async Task<IActionResult> UploadImage([FromForm] IFormFile image)
	{
		try
		{
			var dto = await _heroImageService.UploadImageAsync(image);
			return Ok(dto);
		}
		catch (ArgumentException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error uploading hero image");
			return StatusCode(500, new { error = "Failed to upload hero image." });
		}
	}

	/// <summary>
	/// Delete a hero image by filename (admin only).
	/// Removes both the full-size and thumbnail versions.
	/// </summary>
	[HttpDelete("{filename}")]
	public async Task<IActionResult> DeleteImage(string filename)
	{
		try
		{
			await _heroImageService.DeleteImageAsync(filename);
			return NoContent();
		}
		catch (ArgumentException ex)
		{
			return BadRequest(new { error = ex.Message });
		}
		catch (FileNotFoundException ex)
		{
			return NotFound(new { error = ex.Message });
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error deleting hero image {Filename}", filename);
			return StatusCode(500, new { error = "Failed to delete hero image." });
		}
	}
}
