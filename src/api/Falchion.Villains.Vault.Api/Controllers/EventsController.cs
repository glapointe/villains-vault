using Falchion.Villains.Vault.Api.DTOs;
using Falchion.Villains.Vault.Api.Enums;
using Falchion.Villains.Vault.Api.Repositories;
using Falchion.Villains.Vault.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Falchion.Villains.Vault.Api.Controllers;

/// <summary>
/// Public controller for browsing events.
/// No authentication required.
/// </summary>
[ApiController]
[ApiExplorerSettings(GroupName = "public")]
[Tags("Events")]
[Route("api/v1.0/events")]
public class EventsController : ApiControllerBase
{
	private readonly IEventRepository _eventRepository;
	private readonly ILogger<EventsController> _logger;
	private readonly RaceDataService _raceDataService;

	public EventsController(
		IEventRepository eventRepository,
		ILogger<EventsController> logger,
        RaceDataService raceDataService)
	{
		_eventRepository = eventRepository;
		_logger = logger;
		_raceDataService = raceDataService;
	}

	/// <summary>
	/// Gets all events with their races.
	/// Optionally filter by year based on race dates.
	/// </summary>
	/// <param name="year">Optional year to filter events (e.g., 2025, 2026)</param>
	/// <param name="eventSeries">Optional event series to filter events.</param>
	/// <returns>List of events with their races</returns>
	[HttpGet]
	public async Task<IActionResult> GetEvents([FromQuery] int? year = null, [FromQuery] EventSeries? eventSeries = null)
	{
		try
		{
            var events = await _raceDataService.GetEventsAsync(year > 0 ? year : null, eventSeries);

			return Ok(events);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving events with year and eventSeries filter: {Year}, {EventSeries}", year, eventSeries);
			return StatusCode(500, new { error = "Failed to retrieve events" });
		}
	}

	/// <summary>
	/// Gets all available years that have events.
	/// Returns a list of years in descending order.
	/// </summary>
	/// <param name="eventSeries">Optional event series to filter years</param>
	/// <returns>List of years</returns>
	[HttpGet("years")]
	public async Task<IActionResult> GetYears([FromQuery] EventSeries? eventSeries)
	{
		try
		{
			var years = await _eventRepository.GetAvailableYearsAsync(eventSeries);
			return Ok(years.OrderByDescending(y => y).ToList());
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error retrieving available years");
			return StatusCode(500, new { error = "Failed to retrieve years" });
		}
	}
}

