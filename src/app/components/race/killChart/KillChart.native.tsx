import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import { CartesianChart, Scatter, Line, PointsArray } from 'victory-native';
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
	ChartDataPoint,
} from './KillChart.logic';
import { useFont } from '@shopify/react-native-skia';
import segoeui from '../../../assets/fonts/SEGOEUI.TTF';
import { minutesToPace } from '../../../utils';
import { KillChartProps, KillChartByResultIdProps, KillChartDirectProps, ChartView } from './KillChart.types';

/**
 * KillChart – public entry point (Native).
 * Supports two usage modes:
 *   1. Direct: caller provides `race` + `evaluatedRunner`.
 *   2. Self-loading: caller provides `resultId` and the component fetches everything it needs.
 */
export const KillChart: React.FC<KillChartProps> = (props) => {
	if ('resultId' in props && typeof props.resultId === 'number') {
		const { resultId, ...rest } = props as KillChartByResultIdProps;
		return <KillChartSelfLoading resultId={resultId} {...rest} />;
	}
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
 * Inner KillChart implementation (Native).
 */
const KillChartInner: React.FC<KillChartDirectProps> = ({
	race,
	evaluatedRunner,
	divisions: providedDivisions,
	hideHeader,
	embeddedLegend,
	dlsResultIds: providedDlsResultIds,
}) => {
	const { isDark } = useTheme();
	const font = useFont(segoeui, 10);
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

	const [divisions, setDivisions] = useState<Division[]>(providedDivisions || []);
	const [dlsResultIds, setDlsResultIds] = useState<number[] | undefined>(providedDlsResultIds);
	const [loadingDivisions, setLoadingDivisions] = useState(!providedDivisions);
	const [loadingDlsResults, setLoadingDlsResults] = useState(!providedDlsResultIds || providedDlsResultIds.length === 0);
	const [loadingDependencies, setLoadingDependencies] = useState(true);
	const [divisionFilter, setDivisionFilter] = useState<number | null>(null);
	const [genderFilter, setGenderFilter] = useState<Gender | null>(null);
	const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get('window').width - 32);
	const [lastStarter, setLastStarter] = useState<RaceResult | null>(null);
	const [dnfCount, setDnfCount] = useState<number>(0);
	const [chartView, setChartView] = useState<ChartView>('pace');

	const { results, isLoading, progress, error, streamResults } = useStreamedRaceResults();

	
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

	// Stream results when race or filters change
	useEffect(() => {
		streamResults({
			raceId: race.id,
			divisionId: divisionFilter ?? undefined,
			gender: genderFilter ?? undefined,
			sortBy: RaceResultColumn.StartTime,
			sortDirection: 'asc',
			chunkSize: 1000,
		});
	}, [race.id, divisionFilter, genderFilter, streamResults]);

	// Transform results to chart data points
	const chartData = useMemo((): ChartDataPoint[] => {
		return transformToChartData(results, evaluatedRunner, dlsResultIds ?? []);
	}, [results, evaluatedRunner, dlsResultIds]);

	// Pre-group chartData indices by category for batched Scatter rendering.
	// This reduces Skia draw calls from N (one per runner) to 4 (one per category).
	const categoryIndices = useMemo(() => {
		const runner: number[] = [];
		const kill: number[] = [];
		const assassin: number[] = [];
		const evaluated: number[] = [];
		const dls: number[] = [];
		chartData.forEach((d, i) => {
			switch (d.category) {
				case 'runner': runner.push(i); break;
				case 'kill': kill.push(i); break;
				case 'assassin': assassin.push(i); break;
				case 'evaluated': evaluated.push(i); break;
				case 'dls': dls.push(i); break;
			}
		});
		return { runner, kill, assassin, evaluated, dls };
	}, [chartData]);

	// Balloon ladies sweep line
	const balloonLadiesSweepLine = useMemo(() => {
		return calculateBalloonSweepLine(lastStarter, race.distance);
	}, [lastStarter, race.distance]);

	// Calculate axis domains
	const { xDomain, yDomain } = useMemo(() => {
		return calculateDomains(chartData);
	}, [chartData]);

	// Generate axis ticks
	const { xTicks, yTicks } = useMemo(() => {
		return generateTicks(xDomain, yDomain);
	}, [xDomain, yDomain]);

	// Division filter options
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

	const handleDivisionChange = (value: string) => {
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
	};

	const selectedDivisionValue = useMemo(() => {
		if (genderFilter === GenderEnum.Male) return 'men';
		if (genderFilter === GenderEnum.Female) return 'women';
		if (divisionFilter) return divisionFilter.toString();
		return 'all';
	}, [divisionFilter, genderFilter]);

	// Corral view data: bib on x, start time on y
	const corralData = useMemo(() => {
		return chartData.map(d => ({ x: d.bibNumber, y: d.x, fill: d.fill, stroke: d.stroke, strokeWidth: d.strokeWidth, size: d.size, isEvaluatedRunner: d.isEvaluatedRunner }));
	}, [chartData]);

	// Count kills and assassins
	const stats = useMemo(() => {
		return calculateStats(results, evaluatedRunner, dlsResultIds ?? []);
	}, [results, evaluatedRunner, dlsResultIds, dlsResultIds]);

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
			onLayout={(event) => {
				const { width } = event.nativeEvent.layout;
				setContainerWidth(Math.max(300, width));
			}}
		>
			{/* Header */}
			<View style={[styles.header, hideHeader && styles.headerHidden]}>
				{!hideHeader && <View style={styles.titleRow}>
					<Text style={styles.title}>Kill Chart 
						<Text style={styles.titleNickname}>(aka, "Brian's Chart")</Text>
					</Text>
					<InfoTooltip tooltip={
						`The "Kill Chart" was conceived by Brian Davis to help visualize how many runners someone passes, particularly when dead last starting (DLS) a race. This can be used to understand race dynamics and individual performance.`} />
				</View>}

				{/* Filters */}
				{!hideHeader && <View style={styles.filterRow}>
					<Dropdown
						value={selectedDivisionValue}
						options={divisionOptions}
						onChange={handleDivisionChange}
						containerStyle={styles.dropdown}
					/>
					<View style={{ flexDirection: 'row', borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
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
				</View>}
				

				{/* Loading indicator */}
				<View style={styles.loadingIndicator}>
					{isLoading && (
						<>
							<ActivityIndicator size="small" />
							<Text style={styles.loadingText}>
								Loading... {progress.current} / {progress.total}
							</Text>
						</>
					)}
					{!isLoading && (
						<Text style={styles.loadingText}>
							{chartData.length} runners
						</Text>
					)}
				</View>

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
			</View>

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
						<View style={[styles.legendDot, { backgroundColor: colors.warning, borderWidth: 0, height: 2, width: 16 }]} />
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
			
			{chartData.length > 0 && chartView === 'pace' && (
                <View style={{ minHeight: 250 }}>
                    <CartesianChart<{ x: number; y: number }, 'x', 'y'>
                        data={chartData as { x: number; y: number }[]}
                        xKey="x"
                        yKeys={['y']}
                        domainPadding={{ left: 10, right: 10, top: 20, bottom: 0 }}
                        {...(font && {
                            axisOptions: {
                                font,
                                labelColor: colors.textPrimary,
                                lineColor: colors.border,
                                tickCount: { x: xTicks.length, y: yTicks.length },
                                tickValues: { x: xTicks, y: yTicks },
                                formatYLabel: (value: number) => minutesToPace(value)
                            }
                        })}
                    >
                        {({ points, yScale, xScale }) => {
                            // Convert 16 min/mile pace reference line to PointsArray format
                            const pace16Y = yScale(16);
                            const paceRefLine: PointsArray = [
                                { x: xScale(xDomain[0]), xValue: xDomain[0], y: pace16Y, yValue: 16 },
                                { x: xScale(xDomain[1]), xValue: xDomain[1], y: pace16Y, yValue: 16 },
                            ];
                            
                            // Convert balloon sweep line to PointsArray format
                            const balloonLine: PointsArray = (() => {
                                if (!balloonLadiesSweepLine) return [];
                                
                                const { balloonStartTime, balloonPace, raceDistance } = balloonLadiesSweepLine;
                                const paceAtStart = (balloonStartTime + raceDistance * balloonPace) / raceDistance;
                                
                                return [
                                    { x: xScale(0), xValue: 0, y: yScale(paceAtStart), yValue: paceAtStart },
                                    { x: xScale(balloonStartTime), xValue: balloonStartTime, y: yScale(balloonPace), yValue: balloonPace },
                                ];
                            })();
                            
                            return (
                                <>
                                    {/* 16 min/mile pace reference line (dashed) */}
                                    <Line
                                        points={paceRefLine}
                                        color={colors.warning}
                                        strokeWidth={2}
                                        opacity={0.5}
                                    />

                                    {/* Balloon ladies sweep line */}
                                    {balloonLine.length > 0 && (
                                        <Line
                                            points={balloonLine}
                                            color={colors.error}
                                            strokeWidth={2}
                                            opacity={0.7}
                                        />
                                    )}

                                    {/* Scatter points – 4 batched calls instead of one per runner */}
                                    <Scatter points={categoryIndices.runner.map(i => points.y[i]) as PointsArray} radius={2} color="#3b82f6" />
                                    <Scatter points={categoryIndices.kill.map(i => points.y[i]) as PointsArray} radius={2} color="#dc2626" />
                                    <Scatter points={categoryIndices.assassin.map(i => points.y[i]) as PointsArray} radius={2} color="#15803d" />
                                    <Scatter points={categoryIndices.evaluated.map(i => points.y[i]) as PointsArray} radius={5} color="#dc2626" />
									<Scatter points={categoryIndices.dls.map(i => points.y[i]) as PointsArray} radius={4} color="#cba418" />
                                </>
                            );
                        }}
                    </CartesianChart>
                </View>
			)}

			{chartData.length > 0 && chartView === 'corral' && (
                <View style={{ minHeight: 250 }}>
                    <CartesianChart<{ x: number; y: number }, 'x', 'y'>
                        data={corralData as { x: number; y: number }[]}
                        xKey="x"
                        yKeys={['y']}
                        domainPadding={{ left: 10, right: 10, top: 20, bottom: 0 }}
                        {...(font && {
                            axisOptions: {
                                font,
                                labelColor: colors.textPrimary,
                                lineColor: colors.border,
                                formatYLabel: (value: number) => `${value.toFixed(0)}m`
                            }
                        })}
                    >
                        {({ points }) => (
                            <>
                                {/* Scatter points – 4 batched calls instead of one per runner */}
                                <Scatter points={categoryIndices.runner.map(i => points.y[i]) as PointsArray} radius={2} color="#3b82f6" />
                                <Scatter points={categoryIndices.kill.map(i => points.y[i]) as PointsArray} radius={2} color="#dc2626" />
                                <Scatter points={categoryIndices.assassin.map(i => points.y[i]) as PointsArray} radius={2} color="#15803d" />
                                <Scatter points={categoryIndices.evaluated.map(i => points.y[i]) as PointsArray} radius={5} color="#dc2626" />
								<Scatter points={categoryIndices.dls.map(i => points.y[i]) as PointsArray} radius={4} color="#cba418" />
                            </>
                        )}
                    </CartesianChart>
                </View>
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

