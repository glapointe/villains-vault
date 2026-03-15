using Falchion.Villains.Vault.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Public endpoint for retrieving hero carousel images.
/// Returns the most recent 10 images for the home page carousel.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Tags("Hero Images")]
[Route("api/v1.0/hero-images")]
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
	/// Get the most recent hero carousel images (public, no auth required).
	/// Returns the newest 10 images sorted by upload date descending.
	/// </summary>
	[HttpGet]
	public async Task<IActionResult> GetRecentImages()
	{
		try
		{
			var images = await _heroImageService.GetRecentImagesAsync(10);
			return Ok(images);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving recent hero images");
			return StatusCode(500, new { error = "Failed to retrieve hero images." });
		}
	}
}
