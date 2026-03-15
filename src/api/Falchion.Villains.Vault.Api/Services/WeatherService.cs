using System.Text.Json;
using Falchion.Villains.Vault.Api.Data.Entities;

namespace Falchion.Villains.Vault.Api.Services;

/// <summary>
/// Service for fetching weather data from Open-Meteo API.
/// </summary>
public class WeatherService
{
	private readonly IHttpClientFactory _httpClientFactory;
	private readonly ILogger<WeatherService> _logger;

	// Epcot at Walt Disney World, Florida
	private const double EPCOT_LATITUDE = 28.376657469642765;
	private const double EPCOT_LONGITUDE = -81.54941413048536;

	// Disneyland, California
	private const double DISNEYLAND_LATITUDE = 33.8120962;
	private const double DISNEYLAND_LONGITUDE = -117.9189742;

	public WeatherService(IHttpClientFactory httpClientFactory, ILogger<WeatherService> logger)
	{
		_httpClientFactory = httpClientFactory;
		_logger = logger;
	}

	/// <summary>
	/// Fetches weather data for a race from the Open-Meteo API.
	/// </summary>
	/// <param name="race">The race to fetch weather data for.</param>
	/// <returns>JSON string containing weather data, or null if the request fails.</returns>
	public async Task<string?> FetchWeatherDataAsync(Race race)
	{
		try
		{
			var (latitude, longitude) = DetermineLocation(race.Event.Name);
			var dateString = race.RaceDate.ToString("yyyy-MM-dd");

			// Build the API URL with all required parameters
			var url = $"https://archive-api.open-meteo.com/v1/archive" +
				$"?latitude={latitude}" +
				$"&longitude={longitude}" +
				$"&start_date={dateString}" +
				$"&end_date={dateString}" +
				$"&daily=sunrise,sunset,temperature_2m_mean,temperature_2m_max,temperature_2m_min," +
				$"apparent_temperature_mean,apparent_temperature_max,apparent_temperature_min," +
				$"rain_sum,wind_speed_10m_max,wind_gusts_10m_max" +
				$"&hourly=temperature_2m,apparent_temperature,wind_speed_10m," +
				$"wind_direction_10m,wind_gusts_10m,rain" +
				$"&timezone=America%2FNew_York" +
				$"&temperature_unit=fahrenheit" +
				$"&wind_speed_unit=mph" +
				$"&precipitation_unit=inch";

			_logger.LogInformation("Fetching weather data for race {RaceId} on {RaceDate} at location ({Latitude}, {Longitude})",
				race.Id, dateString, latitude, longitude);

			var httpClient = _httpClientFactory.CreateClient();
			var response = await httpClient.GetAsync(url);

			if (!response.IsSuccessStatusCode)
			{
				_logger.LogWarning("Failed to fetch weather data. Status code: {StatusCode}", response.StatusCode);
				return null;
			}

			var jsonString = await response.Content.ReadAsStringAsync();

			// Validate that we got valid JSON
			try
			{
				using var jsonDoc = JsonDocument.Parse(jsonString);
				// Basic validation - ensure we have the expected structure
				if (!jsonDoc.RootElement.TryGetProperty("hourly", out _) ||
					!jsonDoc.RootElement.TryGetProperty("daily", out _))
				{
					_logger.LogWarning("Weather data response missing expected properties");
					return null;
				}
			}
			catch (JsonException ex)
			{
				_logger.LogError(ex, "Failed to parse weather data JSON");
				return null;
			}

			return jsonString;
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Error fetching weather data for race {RaceId}", race.Id);
			return null;
		}
	}

	/// <summary>
	/// Determines the location (latitude/longitude) based on the event name.
	/// Defaults to Epcot if the location cannot be determined.
	/// </summary>
	/// <param name="eventName">The name of the event.</param>
	/// <returns>Tuple of (latitude, longitude).</returns>
	private (double latitude, double longitude) DetermineLocation(string eventName)
	{
		// Check if the event is at Disneyland (California)
		if (eventName.Contains("Disneyland", StringComparison.OrdinalIgnoreCase) ||
			eventName.Contains("California", StringComparison.OrdinalIgnoreCase))
		{
			_logger.LogDebug("Event '{EventName}' identified as Disneyland location", eventName);
			return (DISNEYLAND_LATITUDE, DISNEYLAND_LONGITUDE);
		}

		// Default to Epcot (Walt Disney World, Florida)
		_logger.LogDebug("Event '{EventName}' using default Epcot location", eventName);
		return (EPCOT_LATITUDE, EPCOT_LONGITUDE);
	}
}
