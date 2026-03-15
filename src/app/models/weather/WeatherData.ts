/**
 * Weather data types based on Open-Meteo API response format.
 * See: https://open-meteo.com/en/docs/historical-weather-api
 */

/**
 * Units for hourly weather data.
 */
export interface HourlyUnits {
	time: string;
	temperature_2m: string;
	apparent_temperature: string;
	wind_speed_10m: string;
	wind_direction_10m: string;
	wind_gusts_10m: string;
	rain: string;
}

/**
 * Hourly weather data arrays.
 * Each array contains 24 values (one per hour).
 */
export interface HourlyData {
	time: string[]; // ISO 8601 datetime strings
	temperature_2m: number[];
	apparent_temperature: number[];
	wind_speed_10m: number[];
	wind_direction_10m: number[];
	wind_gusts_10m: number[];
	rain: number[];
}

/**
 * Units for daily weather data.
 */
export interface DailyUnits {
	time: string;
	sunrise: string;
	sunset: string;
	temperature_2m_mean: string;
	temperature_2m_max: string;
	temperature_2m_min: string;
	apparent_temperature_mean: string;
	apparent_temperature_max: string;
	apparent_temperature_min: string;
	rain_sum: string;
	wind_speed_10m_max: string;
	wind_gusts_10m_max: string;
}

/**
 * Daily weather data arrays.
 * For a single day, each array contains 1 value.
 */
export interface DailyData {
	time: string[]; // ISO 8601 date strings
	sunrise: string[]; // ISO 8601 datetime strings
	sunset: string[]; // ISO 8601 datetime strings
	temperature_2m_mean: number[];
	temperature_2m_max: number[];
	temperature_2m_min: number[];
	apparent_temperature_mean: number[];
	apparent_temperature_max: number[];
	apparent_temperature_min: number[];
	rain_sum: number[];
	wind_speed_10m_max: number[];
	wind_gusts_10m_max: number[];
}

/**
 * Complete weather data response from Open-Meteo API.
 */
export interface WeatherData {
	latitude: number;
	longitude: number;
	generationtime_ms: number;
	utc_offset_seconds: number;
	timezone: string;
	timezone_abbreviation: string;
	elevation: number;
	hourly_units: HourlyUnits;
	hourly: HourlyData;
	daily_units: DailyUnits;
	daily: DailyData;
}

/**
 * Processed hourly weather entry for easier rendering.
 */
export interface HourlyWeatherEntry {
	time: Date;
	temperature: number;
	apparentTemperature: number;
	windSpeed: number;
	windDirection: number;
	windGusts: number;
	rain: number;
}

/**
 * Processed daily weather summary for easier rendering.
 */
export interface DailyWeatherSummary {
	date: Date;
	sunrise: Date;
	sunset: Date;
	temperatureMean: number;
	temperatureMax: number;
	temperatureMin: number;
	apparentTemperatureMean: number;
	apparentTemperatureMax: number;
	apparentTemperatureMin: number;
	rainSum: number;
	windSpeedMax: number;
	windGustsMax: number;
}
