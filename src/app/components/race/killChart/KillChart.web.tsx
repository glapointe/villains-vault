import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js/dist/plotly.min.js';
import { Dropdown, InfoTooltip } from '../../ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useStreamedRaceResults } from '../../../hooks/useStreamedRaceResults';
import type { Race, RaceResult, Division, Gender } from '../../../models';
import type { RaceResultDetailed } from '../../../models/races/RaceResultDetailed';
import { Gender as GenderEnum, RaceResultColumn } from '../../../models';
import { api } from '../../../services/api';
import { createStyles } from './KillChart.styles';
import {
	transformToChartData,
	calculateBalloonSweepLine,
	calculateDomains,
	generateTicks,
	calculateStats,
	formatPace,
	ChartDataPoint,
} from './KillChart.logic';
import { minutesToPace } from 'utils';
import { KillChartProps, KillChartByResultIdProps, KillChartDirectProps, ChartView } from './KillChart.types';

/** Plotly component using the full plotly.js bundle for WebGL canvas rendering */
const Plot = createPlotlyComponent(Plotly);

/**
 * Builds Plotly traces from chart data points grouped by category.
 * Uses scattergl for WebGL canvas-based rendering (handles 15k+ points).
 */
export const buildPlotlyTraces = (
	chartData: ChartDataPoint[],
	xDomain: [number, number],
	balloonSweepLineData: { x: number; y: number }[],
	showLegend: boolean = false,
): Plotly.Data[] => {
	// Separate data points by category for distinct traces
	const runners: ChartDataPoint[] = [];
	const kills: ChartDataPoint[] = [];
	const assassins: ChartDataPoint[] = [];
	const dls: ChartDataPoint[] = [];
	let evaluated: ChartDataPoint | null = null;

	for (const point of chartData) {
		switch (point.category) {
			case 'kill':
				kills.push(point);
				break;
			case 'assassin':
				assassins.push(point);
				break;
			case 'evaluated':
				evaluated = point;
				break;
			case 'dls':
				dls.push(point);
				break;
			default:
				runners.push(point);
				break;
		}
	}

	const buildHoverText = (points: ChartDataPoint[]): string[] =>
		points.map(p =>
			`<b>${p.label}</b><br>` +
			`Bib: ${p.bibNumber}<br>` +
			`Pace: ${formatPace(p.y)}/mi<br>` +
			`Start: ${minutesToPace(p.x)} min`
		);

	const traces: Plotly.Data[] = [];

	// Runners trace (blue hollow circles)
	if (runners.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'Runners',
			x: runners.map(p => p.x),
			y: runners.map(p => p.y),
			text: buildHoverText(runners),
			hoverinfo: 'text' as const,
			marker: {
				color: 'rgba(59, 130, 246, 0.4)',
				size: 4,
				line: { color: '#3b82f6', width: 1 },
			},
			showlegend: false,
		});
	}

	// Kills trace (red fill, orange border)
	if (kills.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'Kills',
			x: kills.map(p => p.x),
			y: kills.map(p => p.y),
			text: buildHoverText(kills),
			hoverinfo: 'text' as const,
			marker: {
				color: '#dc2626',
				size: 5,
				line: { color: '#f97316', width: 1 },
			},
			showlegend: true,
		});
	}

	// Assassins trace (dark green fill, green border)
	if (assassins.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'Assassins',
			x: assassins.map(p => p.x),
			y: assassins.map(p => p.y),
			text: buildHoverText(assassins),
			hoverinfo: 'text' as const,
			marker: {
				color: '#15803d',
				size: 5,
				line: { color: '#22c55e', width: 1 },
			},
			showlegend: true,
		});
	}
	
	// DLS trace (transparent fill, blue border)
	if (dls.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'DLS Players',
			x: dls.map(p => p.x),
			y: dls.map(p => p.y),
			text: buildHoverText(dls),
			hoverinfo: 'text' as const,
			marker: {
				color: 'transparent',
				size: 8,
				line: { color: '#cba418', width: 2 },
			},
			showlegend: true,
		});
	}

	// Evaluated runner trace (red fill, black border, larger)
	if (evaluated) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: evaluated.label,
			x: [evaluated.x],
			y: [evaluated.y],
			text: [
				`<b>${evaluated.label}</b><br>` +
				`Bib: ${evaluated.bibNumber}<br>` +
				`Pace: ${formatPace(evaluated.y)}/mi<br>` +
				`Start: ${minutesToPace(evaluated.x)} min`
			],
			hoverinfo: 'text' as const,
			marker: {
				color: '#dc2626',
				size: 12,
				line: { color: '#000000', width: 2 },
			},
			showlegend: true,
		});
	}

	// 16 min/mile pace reference line (horizontal dashed green)
	traces.push({
		type: 'scatter',
		mode: 'lines',
		name: '16 min/mile Pace',
		x: [xDomain[0], xDomain[1]],
		y: [16, 16],
		line: {
			color: '#05bf05',
			width: 2,
			dash: 'dash',
		},
		hoverinfo: 'skip' as const,
		showlegend: true,
	});

	// Balloon Ladies sweep line (diagonal orange dash-dot)
	if (balloonSweepLineData.length > 0) {
		traces.push({
			type: 'scatter',
			mode: 'lines',
			name: 'Balloons',
			x: balloonSweepLineData.map(p => p.x),
			y: balloonSweepLineData.map(p => p.y),
			line: {
				color: '#f97316',
				width: 2,
				dash: 'dashdot',
			},
			hoverinfo: 'skip' as const,
			showlegend: true,
		});
	}

	return traces;
};

/**
 * Builds "By Corral" view traces: Bib Number (x) vs Start Time (y).
 * No reference lines in this view.
 */
const buildCorralTraces = (
	chartData: ChartDataPoint[],
	showLegend: boolean = false,
): Plotly.Data[] => {
	const runners: ChartDataPoint[] = [];
	const kills: ChartDataPoint[] = [];
	const assassins: ChartDataPoint[] = [];
	const dls: ChartDataPoint[] = [];
	let evaluated: ChartDataPoint | null = null;

	for (const point of chartData) {
		switch (point.category) {
			case 'kill':
				kills.push(point);
				break;
			case 'assassin':
				assassins.push(point);
				break;
			case 'evaluated':
				evaluated = point;
				break;
			case 'dls':
				dls.push(point);
				break;
			default:
				runners.push(point);
				break;
		}
	}

	const buildHoverText = (points: ChartDataPoint[]): string[] =>
		points.map(p =>
			`<b>${p.label}</b><br>` +
			`Bib: ${p.bibNumber}<br>` +
			`Start: ${minutesToPace(p.x)} min<br>` +
			`Pace: ${formatPace(p.y)}/mi`
		);

	const traces: Plotly.Data[] = [];

	if (runners.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'Runners',
			x: runners.map(p => p.bibNumber),
			y: runners.map(p => p.x),
			text: buildHoverText(runners),
			hoverinfo: 'text' as const,
			marker: {
				color: 'rgba(59, 130, 246, 0.4)',
				size: 4,
				line: { color: '#3b82f6', width: 1 },
			},
			showlegend: false,
		});
	}

	if (kills.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'Kills',
			x: kills.map(p => p.bibNumber),
			y: kills.map(p => p.x),
			text: buildHoverText(kills),
			hoverinfo: 'text' as const,
			marker: {
				color: '#dc2626',
				size: 5,
				line: { color: '#f97316', width: 1 },
			},
			showlegend: true,
		});
	}

	if (assassins.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'Assassins',
			x: assassins.map(p => p.bibNumber),
			y: assassins.map(p => p.x),
			text: buildHoverText(assassins),
			hoverinfo: 'text' as const,
			marker: {
				color: '#15803d',
				size: 5,
				line: { color: '#22c55e', width: 1 },
			},
			showlegend: true,
		});
	}
	
	// DLS trace (transparent fill, blue border)
	if (dls.length > 0) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: 'DLS Players',
			x: dls.map(p => p.x),
			y: dls.map(p => p.y),
			text: buildHoverText(dls),
			hoverinfo: 'text' as const,
			marker: {
				color: 'transparent',
				size: 8,
				line: { color: '#cba418', width: 2 },
			},
			showlegend: true,
		});
	}

	if (evaluated) {
		traces.push({
			type: 'scattergl',
			mode: 'markers',
			name: evaluated.label,
			x: [evaluated.bibNumber],
			y: [evaluated.x],
			text: [
				`<b>${evaluated.label}</b><br>` +
				`Bib: ${evaluated.bibNumber}<br>` +
				`Start: ${minutesToPace(evaluated.x)} min<br>` +
				`Pace: ${formatPace(evaluated.y)}/mi`
			],
			hoverinfo: 'text' as const,
			marker: {
				color: '#dc2626',
				size: 12,
				line: { color: '#000000', width: 2 },
			},
			showlegend: true,
		});
	}

	return traces;
};

/**
 * Kill Chart Component (Web - Plotly WebGL)
 * 
 * Visualizes race results as a scatter plot showing kills (runners passed)
 * and assassins (runners who passed you) based on start time and pace.
 * Uses scattergl trace type for canvas-based WebGL rendering to handle
 * large datasets (15k+ points) without SVG performance issues.
 */
/**
 * KillChart – public entry point.
 * Supports two usage modes:
 *   1. Direct: caller provides `race` + `evaluatedRunner`.
 *   2. Self-loading: caller provides `resultId` and the component fetches everything it needs.
 */
export const KillChart: React.FC<KillChartProps> = (props) => {
	if ('resultId' in props && typeof props.resultId === 'number') {
		const { resultId, ...rest } = props as KillChartByResultIdProps;
		return <KillChartSelfLoading resultId={resultId} {...rest} />;
	}
	// Direct mode — race & evaluatedRunner are guaranteed by the union type
	const { race, evaluatedRunner, ...rest } = props as KillChartDirectProps;
	return <KillChartInner race={race} evaluatedRunner={evaluatedRunner} {...rest} />;
};

/**
 * Self‑loading wrapper: fetches Race + RaceResult by resultId then
 * delegates to KillChartInner once ready.
 */
const KillChartSelfLoading: React.FC<KillChartByResultIdProps> = ({
	resultId,
	...rest
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

	const [race, setRace] = useState<Race | null>(null);
	const [result, setResult] = useState<RaceResultDetailed | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const raceResult = await api.raceResults.getById(resultId);
				if (cancelled) return;
				const raceData = await api.races.getById(raceResult.raceId);
				if (cancelled) return;
				setResult(raceResult);
				setRace(raceData);
			} catch {
				if (!cancelled) setError('Failed to load chart data');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => { cancelled = true; };
	}, [resultId]);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading kill chart…</Text>
			</View>
		);
	}

	if (error || !race || !result) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.errorText}>{error ?? 'Unable to load chart data'}</Text>
			</View>
		);
	}

	return <KillChartInner race={race} evaluatedRunner={result} {...rest} />;
};

/**
 * Inner KillChart implementation (expects race + evaluatedRunner to already be resolved).
 */
const KillChartInner: React.FC<KillChartDirectProps> = ({
	race,
	evaluatedRunner,
	divisions: providedDivisions,
	hideHeader = false,
	embeddedLegend = false,
	preloadedResults,
	staticPlot,
	dlsResultIds: providedDlsResultIds,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

	const [divisions, setDivisions] = useState<Division[]>(providedDivisions || []);
	const [dlsResultIds, setDlsResultIds] = useState<number[] | undefined>(providedDlsResultIds);
	const [loadingDivisions, setLoadingDivisions] = useState(!providedDivisions);
	const [loadingDlsResults, setLoadingDlsResults] = useState(!providedDlsResultIds || providedDlsResultIds.length === 0);
	const [loadingDependencies, setLoadingDependencies] = useState(true);
	const [divisionFilter, setDivisionFilter] = useState<number | null>(null);
	const [genderFilter, setGenderFilter] = useState<Gender | null>(null);
	const [lastStarter, setLastStarter] = useState<RaceResult | null>(null);
	const [dnfCount, setDnfCount] = useState<number>(0);
	const [chartView, setChartView] = useState<ChartView>('pace');

	const { results: streamedResults, isLoading: streamLoading, progress, error, streamResults } = useStreamedRaceResults();

	// Use preloaded results when provided, otherwise use streamed results
	const results = preloadedResults ?? streamedResults;
	const isLoading = preloadedResults ? false : streamLoading;

	// Track revision to force Plotly re-render on data changes (Plotly.react optimization)
	const dataRevision = useRef(0);

	// Load divisions if not provided
	useEffect(() => {
		if (hideHeader) {
			// We don't need the divisions loaded if we're hiding the filters.
			setDivisions([]);
			setLoadingDivisions(false);
			return;
		}
		if (providedDivisions) {
			setDivisions(providedDivisions);
			setLoadingDivisions(false);
			return;
		}

		const fetchData = async () => {
			setLoadingDivisions(true);
			try {
				const divs = await api.raceResults.getDivisions(race.id);
				setDivisions(divs);
			} catch (error) {
				console.error('Error fetching divisions:', error);
			} finally {
				setLoadingDivisions(false);
			}
		};

		fetchData();
	}, [race.id, providedDivisions, hideHeader]);
	
	// Load DLS results if not provided
	useEffect(() => {
		if (providedDlsResultIds) {
			setDlsResultIds(providedDlsResultIds);
			setLoadingDlsResults(false);
			return;
		}

		const fetchData = async () => {
			setLoadingDlsResults(true);
			try {
				const dlsResults = await api.dls.getDlsResultIds(race.id);
				setDlsResultIds(dlsResults);
			} catch (error) {
				console.error('Error fetching DLS results:', error);
			} finally {
				setLoadingDlsResults(false);
			}
		};

		fetchData();
	}, [race.id, providedDlsResultIds]);

	// Load DNF count and last starter if not provided
	useEffect(() => {
		const fetchData = async () => {
			setLoadingDependencies(true);
			try {
				const [lastStarterData, dnfCountData] = await Promise.all([
					api.raceResults.getLastStarter(race.id),
					api.races.getDnfCount(race.id),
				]);
				setLastStarter(lastStarterData);
				setDnfCount(dnfCountData);
			} catch (error) {
				console.error('Error fetching dependencies:', error);
			} finally {
				setLoadingDependencies(false);
			}
		};

		fetchData();
	}, [race.id]);

	// Stream results when race or filters change (skip when preloaded)
	useEffect(() => {
		if (preloadedResults) return;
		streamResults({
			raceId: race.id,
			divisionId: divisionFilter ?? undefined,
			gender: genderFilter ?? undefined,
			sortBy: RaceResultColumn.StartTime, // Sort by start time for left-to-right progression
			sortDirection: 'asc',
			chunkSize: 500,
		});
	}, [race.id, divisionFilter, genderFilter, streamResults, preloadedResults]);

	// Transform results to chart data points
	const chartData = useMemo((): ChartDataPoint[] => {
		return transformToChartData(results, evaluatedRunner, dlsResultIds ?? []);
	}, [results, evaluatedRunner, dlsResultIds]);

	// Balloon ladies sweep line - diagonal line showing which runners would get swept
	const balloonLadiesSweepLine = useMemo(() => {
		return calculateBalloonSweepLine(lastStarter, race.distance);
	}, [lastStarter, race.distance]);

	// Calculate axis domains
	const { xDomain, yDomain } = useMemo(() => {
		return calculateDomains(chartData);
	}, [chartData]);

	// Generate axis ticks
	const { yTicks } = useMemo(() => {
		return generateTicks(xDomain, yDomain);
	}, [xDomain, yDomain]);

	// Balloon sweep line data points
	const balloonSweepLineData = useMemo(() => {
		if (!balloonLadiesSweepLine) return [];

		const { balloonStartTime, balloonPace, raceDistance } = balloonLadiesSweepLine;
		const paceAtStart = (balloonStartTime + raceDistance * balloonPace) / raceDistance;

		return [
			{ x: 0, y: paceAtStart },
			{ x: balloonStartTime, y: balloonPace },
		];
	}, [balloonLadiesSweepLine]);
	
	// Count kills and assassins
	const stats = useMemo(() => {
		return calculateStats(results, evaluatedRunner, dlsResultIds ?? []);
	}, [results, evaluatedRunner, dlsResultIds]);

	// Build Plotly traces from chart data
	const plotlyTraces = useMemo(() => {
		dataRevision.current += 1;
		if (chartView === 'corral') {
			return buildCorralTraces(chartData, embeddedLegend);
		}
		return buildPlotlyTraces(chartData, xDomain, balloonSweepLineData, embeddedLegend);
	}, [chartData, xDomain, balloonSweepLineData, chartView]);

	// Plotly layout configuration - themed to match app colors
	const plotlyLayout = useMemo((): Partial<Plotly.Layout> => {
		const baseLayout: Partial<Plotly.Layout> = {
			autosize: true,
			height: 600,
			margin: { t: 50, b: 60, l: 65, r: 20 },
			paper_bgcolor: colors.surface,
			plot_bgcolor: colors.surface,
			font: {
				color: colors.textPrimary,
				family: "'Helvetica Neue', 'Helvetica', sans-serif",
			},
			hovermode: 'closest',
			showlegend: !!embeddedLegend,
			legend: embeddedLegend ? {
				x: 0.98,
				y: 0.96,
				xanchor: 'right',
				yanchor: 'top',
				bgcolor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
				bordercolor: colors.border,
				borderwidth: 1,
				font: { size: 12 },
			} : undefined,
			dragmode: 'zoom',
			datarevision: dataRevision.current,
			title: {
				text: ('Kill Chart') + ` - ${evaluatedRunner.name}`,
				font: { size: 18 },
				subtitle: {
					text: `${stats.kills} kills (${((stats.kills / chartData.length) * 100).toFixed(2)}%), ${stats.assassins} assassins (${((stats.assassins / chartData.length) * 100).toFixed(2)}%)`,
					font: { size: 14 },
				}
			},
			
		};

		if (chartView === 'corral') {
			// Bib Number (x) vs Start Time (y)
			const bibNumbers = chartData.map(d => d.bibNumber);
			const minBib = bibNumbers.length > 0 ? Math.min(...bibNumbers) : 0;
			const maxBib = bibNumbers.length > 0 ? Math.max(...bibNumbers) : 100;
			return {
				...baseLayout,
				xaxis: {
					title: { text: 'Bib Number', font: { size: 14 } },
					range: [minBib - 50, maxBib + 50],
					gridcolor: colors.border,
					gridwidth: 0.5,
					zeroline: false,
					color: colors.textSecondary,
				},
				yaxis: {
					title: { text: 'Start Time (minutes)', font: { size: 14 } },
					range: [xDomain[0], xDomain[1]],
					dtick: 5,
					gridcolor: colors.border,
					gridwidth: 0.5,
					zeroline: false,
					color: colors.textSecondary,
				},
			};
		}

		return {
			...baseLayout,
			xaxis: {
				title: { text: 'Start Time (minutes)', font: { size: 14 } },
				range: xDomain,
				dtick: 5,
				gridcolor: colors.border,
				gridwidth: 0.5,
				zeroline: false,
				color: colors.textSecondary,
			},
			yaxis: {
				title: { text: 'Overall Pace (min/mile)', font: { size: 14 } },
				range: yDomain,
				tickvals: yTicks,
				ticktext: yTicks.map(t => formatPace(t)),
				gridcolor: colors.border,
				gridwidth: 0.5,
				zeroline: false,
				color: colors.textSecondary,
			},
		};
	}, [colors, xDomain, yDomain, yTicks, chartView, chartData, dataRevision.current]);

	// Plotly config
	const plotlyConfig = useMemo((): Partial<Plotly.Config> => {
		/** Legend config that matches the embedded-legend layout settings */
		const legendConfig: Partial<Plotly.Legend> = {
			x: 0.98,
			y: 0.96,
			xanchor: 'right' as const,
			yanchor: 'top' as const,
			bgcolor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
			bordercolor: colors.border,
			borderwidth: 1,
			font: { size: 12 },
		};

		/**
		 * Custom download button that forces the embedded legend to appear in the
		 * exported image even when the chart is currently rendering the external
		 * React-Native legend. Steps:
		 *   1. Temporarily relayout to show legend inside the Plotly figure.
		 *   2. Wait a tick so WebGL re-renders with the legend present.
		 *   3. Download the image.
		 *   4. Restore the original showlegend state.
		 */
		const downloadButton = {
			name: 'Download Plot',
			title: 'Download plot as PNG',
			icon: (Plotly as any).Icons.camera,
			click: async (gd: any) => {
				const needsLegendInjection = !embeddedLegend;
				if (needsLegendInjection) {
					await Plotly.relayout(gd, { showlegend: true, legend: legendConfig });
					// Give the WebGL renderer a frame to paint the legend
					await new Promise<void>(resolve => setTimeout(resolve, 150));
				}
				await Plotly.downloadImage(gd, {
					format: 'png',
					filename: `kill-chart-${evaluatedRunner.name.replace(/\s+/g, '-').toLowerCase()}`,
					width: gd.offsetWidth || 1200,
					height: gd.offsetHeight || 600,
				});
				if (needsLegendInjection) {
					await Plotly.relayout(gd, { showlegend: false });
				}
			},
		};

		return {
			responsive: true,
			staticPlot: !!staticPlot,
			displayModeBar: !staticPlot,
			modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toImage'] as Plotly.ModeBarDefaultButtons[],
			modeBarButtonsToAdd: [downloadButton as any],
			scrollZoom: !staticPlot,
			displaylogo: false,
		};
	}, [staticPlot, embeddedLegend, isDark, colors.border, evaluatedRunner.name]);

	// Division filter options (include All Men / All Women)
	const divisionOptions = useMemo(() => {
		const options = [
			{ label: 'All Divisions', value: 'all' },
			{ label: 'All Men', value: 'men' },
			{ label: 'All Women', value: 'women' },
			...divisions.map(div => ({
				label: div.name,
				value: div.id.toString(),
			})),
		];
		return options;
	}, [divisions]);

	const handleDivisionChange = useCallback((value: string) => {
		if (value === 'all') {
			setDivisionFilter(null);
			setGenderFilter(null);
		} else if (value === 'men') {
			setDivisionFilter(null);
			setGenderFilter(GenderEnum.Male);
		} else if (value === 'women') {
			setDivisionFilter(null);
			setGenderFilter(GenderEnum.Female);
		} else {
			setDivisionFilter(parseInt(value, 10));
			setGenderFilter(null);
		}
	}, []);

	const selectedDivisionValue = useMemo(() => {
		if (genderFilter === GenderEnum.Male) return 'men';
		if (genderFilter === GenderEnum.Female) return 'women';
		if (divisionFilter) return divisionFilter.toString();
		return 'all';
	}, [divisionFilter, genderFilter]);

	if (loadingDivisions || loadingDlsResults || loadingDependencies) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View
			style={styles.container}
		>
			{/* Header with filters */}
			{(!hideHeader || isLoading) && <View style={[styles.header, hideHeader && styles.headerHidden]}>
				{!hideHeader && <View style={styles.titleRow}>
					<Text style={styles.title}>Kill Chart
						<Text style={styles.titleNickname}>(aka, "Brian's Chart")</Text>
					</Text>
					<InfoTooltip maxWidth={250} tooltip={
						`The "Kill Chart" was conceived by Brian Davis to help visualize how many runners someone passes, particularly when dead last starting (DLS) a race. This can be used to understand race dynamics and individual performance.`} />
				</View>}

				{!hideHeader && <View style={styles.filterRow}>
					<Dropdown
						options={divisionOptions}
						value={selectedDivisionValue}
						onChange={handleDivisionChange}
						containerStyle={styles.dropdown}
					/>
					<View style={{ flexDirection: 'row', gap: 0, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
						<Pressable
							onPress={() => setChartView('pace')}
							style={{
								paddingHorizontal: 10,
								paddingVertical: 5,
								backgroundColor: chartView === 'pace' ? colors.primary : 'transparent',
							}}
						>
							<Text style={{ fontSize: 12, fontWeight: '600', color: chartView === 'pace' ? colors.textInverse : colors.textSecondary }}>By Pace</Text>
						</Pressable>
						<Pressable
							onPress={() => setChartView('corral')}
							style={{
								paddingHorizontal: 10,
								paddingVertical: 5,
								backgroundColor: chartView === 'corral' ? colors.primary : 'transparent',
							}}
						>
							<Text style={{ fontSize: 12, fontWeight: '600', color: chartView === 'corral' ? colors.textInverse : colors.textSecondary }}>By Corral</Text>
						</Pressable>
					</View>
					{isLoading && (
						<View style={styles.loadingIndicator}>
							<ActivityIndicator size="small" />
							<Text style={styles.loadingText}>
								Loading {progress.current} / {progress.total} ({chartData.length} runners)
							</Text>
						</View>
					)}
					{!isLoading && (
						<Text style={styles.loadingText}>
							{chartData.length} runners
						</Text>
					)}
				</View>}
				{hideHeader && isLoading && (
					<View style={styles.loadingIndicator}>
						<ActivityIndicator size="small" />
						<Text style={styles.loadingText}>
							Loading {progress.current} / {progress.total} ({chartData.length} runners)
						</Text>
					</View>
				)}

				{/* Stats */}
				{!hideHeader && <View style={styles.statsRow}>
					<View style={styles.stat}>
						<Text style={styles.killValue}>{stats.kills} ({((stats.kills / chartData.length) * 100).toFixed(2)}%)</Text>
						<Text style={styles.statLabel}>Kills (Passed)</Text>
					</View>
					<View style={styles.stat}>
						<Text style={styles.assassinValue}>{stats.assassins} ({((stats.assassins / chartData.length) * 100).toFixed(2)}%)</Text>
						<Text style={styles.statLabel}>Assassins (Passed By)</Text>
					</View>
				</View>}
			</View>}

			{/* DNF Note */}
			{!hideHeader && dnfCount > 0 && (
				<View style={styles.dnfNote}>
					<Text style={styles.dnfNoteText}>
						Note: {dnfCount} runner{dnfCount !== 1 ? 's' : ''} did not finish (DNF) and {dnfCount !== 1 ? 'are' : 'is'} not included in these calculations.
					</Text>
				</View>
			)}
			{/* Legend */}
			{!embeddedLegend && <View style={styles.legend}>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: 'transparent', borderColor: '#3b82f6', borderWidth: 1 }]} />
					<Text style={styles.legendText}>Runners</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#dc2626', borderColor: '#f97316', borderWidth: 1 }]} />
					<Text style={styles.legendText}>Kills</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#15803d', borderColor: '#22c55e', borderWidth: 1 }]} />
					<Text style={styles.legendText}>Assassins</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: 'transparent', borderColor: '#cba418', borderWidth: 3 }]} />
					<Text style={styles.legendText}>DLS Players</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#dc2626', borderColor: '#000000', borderWidth: 2 }]} />
					<Text style={styles.legendText}>{evaluatedRunner.name}</Text>
				</View>
				{chartView === 'pace' && (
					<View style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: '#05bf05', borderWidth: 0, height: 2, width: 16 }]} />
						<Text style={styles.legendText}>16 min/mile Pace</Text>
					</View>
				)}
				{chartView === 'pace' && balloonLadiesSweepLine && (
					<View style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: '#f97316', borderWidth: 0, height: 2, width: 16 }]} />
						<Text style={styles.legendText}>Balloons</Text>
					</View>
				)}
			</View>}

			{/* Chart */}
			{chartData.length === 0 && !isLoading && (
				<View style={{ padding: 20, alignItems: 'center' }}>
					<Text style={styles.legendText}>No race data available. Waiting for results...</Text>
				</View>
			)}
			<style>{`.modebar-container { top: 55px !important; }`}</style>

			{chartData.length > 0 && (
				<Plot
					data={plotlyTraces}
					layout={plotlyLayout}
					config={plotlyConfig}
					style={{ width: '100%', height: 600 }}
					useResizeHandler
				/>
			)}

			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>
						Error loading results: {error.message}
					</Text>
				</View>
			)}
		</View>
	);
};
