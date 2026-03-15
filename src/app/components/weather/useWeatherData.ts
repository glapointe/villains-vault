/**
 * Shared hook for weather data fetching and processing
 * Used by both web and native Weather components
 */

import { useState, useEffect } from 'react';
import { racesApi } from '../../services/api';
import type { WeatherData, HourlyWeatherEntry, DailyWeatherSummary } from '../../models';

export const useWeatherData = (raceId: number) => {
	const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadWeatherData();
	}, [raceId]);

	const loadWeatherData = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await racesApi.getWeather(raceId);
			setWeatherData(data);
		} catch (err) {
			console.error('Failed to load weather data:', err);
			setError('Failed to load weather data. Please try again later.');
		} finally {
			setLoading(false);
		}
	};

	const getHourlyData = (): HourlyWeatherEntry[] => {
		if (!weatherData) return [];

		const { hourly } = weatherData;
		return hourly.time.map((isoString, index) => ({
			time: new Date(isoString),
			temperature: hourly.temperature_2m[index],
			apparentTemperature: hourly.apparent_temperature[index],
			windSpeed: hourly.wind_speed_10m[index],
			windDirection: hourly.wind_direction_10m[index],
			windGusts: hourly.wind_gusts_10m[index],
			rain: hourly.rain[index],
		}));
	};

	const getDailySummary = (): DailyWeatherSummary | null => {
		if (!weatherData) return null;

		const { daily } = weatherData;
		return {
			date: new Date(daily.time[0]),
			sunrise: new Date(daily.sunrise[0]),
			sunset: new Date(daily.sunset[0]),
			temperatureMean: daily.temperature_2m_mean[0],
			temperatureMax: daily.temperature_2m_max[0],
			temperatureMin: daily.temperature_2m_min[0],
			apparentTemperatureMean: daily.apparent_temperature_mean[0],
			apparentTemperatureMax: daily.apparent_temperature_max[0],
			apparentTemperatureMin: daily.apparent_temperature_min[0],
			rainSum: daily.rain_sum[0],
			windSpeedMax: daily.wind_speed_10m_max[0],
			windGustsMax: daily.wind_gusts_10m_max[0],
		};
	};

	return {
		weatherData,
		loading,
		error,
		hourlyData: getHourlyData(),
		dailySummary: getDailySummary(),
	};
};
