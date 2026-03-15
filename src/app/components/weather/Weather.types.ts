
/**
 * Props for the Weather component
 */
export interface WeatherProps {
	/** Race ID to fetch weather data for */
	raceId: number;
	/** Whether to show the daily summary section (default: true) */
	showDailySummary?: boolean;
	/** Whether to show hourly temperature chart (default: true) */
	showTemperatureChart?: boolean;
	/** Whether to show hourly wind chart (default: true) */
	showWindChart?: boolean;
	/** Whether to show hourly rain chart (default: true) */
	showRainChart?: boolean;
}