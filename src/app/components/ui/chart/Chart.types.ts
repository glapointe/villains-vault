/**
 * Chart Component Types
 *
 * Shared type definitions for the generic Chart component.
 * Supports line and bar charts with multiple data series.
 */

/**
 * The visual type of chart to render
 */
export type ChartType = 'line' | 'bar';

/**
 * A single data point in a chart series
 */
export interface ChartDataPoint {
	/** Category label (e.g. year "2024") or numeric position */
	x: string | number;
	/** Numeric value at this point */
	y: number;
}

/**
 * One named data series to plot on the chart
 */
export interface ChartSeries {
	/** Display name for this series (shown in legend) */
	name: string;
	/** Ordered array of data points */
	data: ChartDataPoint[];
	/** Optional override colour (hex or CSS string). Defaults to the series palette. */
	color?: string;
}

/**
 * Props accepted by the generic Chart component
 */
export interface ChartProps {
	/** Visual chart type */
	type: ChartType;
	/** Optional heading rendered above the chart */
	title?: string;
	/** One or more data series to plot */
	series: ChartSeries[];
	/** Optional x-axis label */
	xAxisLabel?: string;
	/** Optional y-axis label */
	yAxisLabel?: string;
	/** Chart height in logical pixels (default: 260) */
	height?: number;
	/**
	 * Chart width.
	 * - A number sets a fixed pixel width (default: 520).
	 * - `'100%'` makes the chart fill its parent container.
	 */
	width?: number | '100%';
	/** Format function for y-axis tick labels */
	formatYLabel?: (value: number) => string;
}
