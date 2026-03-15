/**
 * Bulk Kill Chart Component (Web Only)
 *
 * Allows an admin to enter multiple bib numbers and view a kill chart for
 * each matching race result side-by-side in a panel. Includes an export
 * button that bundles every chart as a PNG inside a single zip download.
 *
 * Charts render with `hideHeader` and `embeddedLegend` to keep them
 * compact and self-contained for screenshot/export purposes.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import Plotly from 'plotly.js/dist/plotly.min.js';
import JSZip from 'jszip';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { useDialog } from '../../../contexts/DialogContext';
import { useStreamedRaceResults } from '../../../hooks/useStreamedRaceResults';
import { api } from '../../../services/api';
import { Button, Panel } from '../../ui';
import { buildPlotlyTraces } from '../killChart/KillChart.web';
import { createStyles } from './BulkKillChart.styles';
import type { Race, RaceResult } from '../../../models';
import { RaceResultColumn } from '../../../models';
import {
	transformToChartData,
	calculateBalloonSweepLine,
	calculateDomains,
	generateTicks,
	calculateStats,
	formatPace,
} from '../killChart/KillChart.logic';

/** Props for the BulkKillChart trigger button + panel */
export interface BulkKillChartProps {
	/** The race whose results will be queried */
	race: Race;
}

/**
 * Parse a comma-separated bib string into deduplicated numbers.
 * Ignores whitespace and non-numeric segments.
 */
const parseBibs = (input: string): number[] => {
	const bibs = input
		.split(',')
		.map(s => s.trim())
		.filter(s => /^\d+$/.test(s))
		.map(Number);
	return [...new Set(bibs)];
};

/**
 * Resolved bib entry – either a successful result or an error string.
 */
interface BibEntry {
	bib: number;
	result: RaceResult | null;
	error?: string;
}

/**
 * BulkKillChart
 *
 * Renders a button that, when clicked, opens a dialog to collect bib
 * numbers, then displays a full-screen panel with a kill chart per bib.
 */
export const BulkKillChart: React.FC<BulkKillChartProps> = ({ race }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = useMemo(() => createStyles(colors), [colors]);
	const { showConfirm, showWorking, hideWorking, showAlert } = useDialog();

	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const [entries, setEntries] = useState<BibEntry[]>([]);
	const [dlsResultIds, setDlsResultIds] = useState<number[]|undefined>(undefined); // IDs of DLS results for special styling
	const [bibText, setBibText] = useState('');
	const [loading, setLoading] = useState(false);
	const [exporting, setExporting] = useState(false);

	// Stream all race results once for the entire bulk view
	const {
		results: raceResults,
		isLoading: resultsLoading,
		progress: resultsProgress,
		streamResults,
	} = useStreamedRaceResults();

	// Trigger streaming when the panel opens
	useEffect(() => {
		if (isPanelOpen && raceResults.length === 0 && !resultsLoading) {
			streamResults({
				raceId: race.id,
				sortBy: RaceResultColumn.StartTime,
				sortDirection: 'asc',
				chunkSize: 500,
			});
		}
	}, [isPanelOpen, race.id]);

	// --- Imperative image-capture pipeline ---
	// Uses a single hidden div to render each chart via Plotly.newPlot,
	// capture it as a PNG, then Plotly.purge before the next. Only 1
	// Plotly instance (and 0 WebGL contexts, since we use scatter) exists
	// at any time.
	const [chartImages, setChartImages] = useState<Map<number, string>>(new Map());
	const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 });
	const [isRendering, setIsRendering] = useState(false);
	const renderDivRef = useRef<HTMLDivElement>(null);
	const renderAbortRef = useRef(false);

	// Valid entries that actually have a result to chart
	const validEntries = useMemo(
		() => entries.filter((e): e is BibEntry & { result: RaceResult } => e.result !== null),
		[entries],
	);

	/**
	 * Sequentially render each chart into the hidden div, capture as PNG,
	 * and purge before the next. Uses scatter (SVG) since only one chart
	 * at a time means 15k SVG nodes is fine.
	 */
	const runRenderPipeline = useCallback(async (entriesToRender: (BibEntry & { result: RaceResult })[]) => {
		const el = renderDivRef.current;
		if (!el || entriesToRender.length === 0 || raceResults.length === 0) return;

		renderAbortRef.current = false;
		setIsRendering(true);
		setRenderProgress({ current: 0, total: entriesToRender.length });
		const images = new Map<number, string>();

		// Fetch last starter once for the balloon ladies sweep line
		let balloonSweepLineData: { x: number; y: number }[] = [];
		try {
			const lastStarter = await api.raceResults.getLastStarter(race.id);
			const sweepLine = calculateBalloonSweepLine(lastStarter, race.distance);
			if (sweepLine) {
				const paceAtStart = (sweepLine.balloonStartTime + sweepLine.raceDistance * sweepLine.balloonPace) / sweepLine.raceDistance;
				balloonSweepLineData = [
					{ x: 0, y: paceAtStart },
					{ x: sweepLine.balloonStartTime, y: sweepLine.balloonPace },
				];
			}
		} catch {
			// Non-critical — continue without sweep line
		}

		for (let i = 0; i < entriesToRender.length; i++) {
			if (renderAbortRef.current) break;

			const entry = entriesToRender[i];
			setRenderProgress({ current: i + 1, total: entriesToRender.length });

			try {
				// Build chart data using shared logic
				const chartData = transformToChartData(raceResults, entry.result, dlsResultIds ?? []);
				const { xDomain, yDomain } = calculateDomains(chartData);
				const { yTicks } = generateTicks(xDomain, yDomain);
				const stats = calculateStats(raceResults, entry.result, dlsResultIds ?? []);

				// Build traces (use scatter not scattergl — only 1 chart at a time)
				const traces = buildPlotlyTraces(chartData, xDomain, balloonSweepLineData, true)
					.map(t => (t as any).type === 'scattergl' ? { ...t, type: 'scatter' } : t) as Plotly.Data[];

				// Build layout
				const layout: Partial<Plotly.Layout> = {
					autosize: true,
					width: 1400,
					height: 700,
					margin: { t: 50, b: 60, l: 65, r: 20 },
					paper_bgcolor: colors.surface,
					plot_bgcolor: colors.surface,
					font: {
						color: colors.textPrimary,
						family: "'Helvetica Neue', 'Helvetica', sans-serif",
					},
					hovermode: false as const,
					showlegend: true,
					legend: {
						x: 0.98, y: 1.05, xanchor: 'right', yanchor: 'top',
						bgcolor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
						bordercolor: colors.border, borderwidth: 1,
						font: { size: 12 },
					},
					title: {
						text: `Kill Chart - ${entry.result.name}`,
						font: { size: 18 },
						subtitle: {
							text: `${stats.kills} kills (${((stats.kills / chartData.length) * 100).toFixed(2)}%), ${stats.assassins} assassins (${((stats.assassins / chartData.length) * 100).toFixed(2)}%)`,
							font: { size: 14 },
						},
					},
					xaxis: {
						title: { text: 'Start Time (minutes)', font: { size: 14 } },
						range: xDomain, dtick: 5,
						gridcolor: colors.border, gridwidth: 0.5,
						zeroline: false, color: colors.textSecondary,
					},
					yaxis: {
						title: { text: 'Overall Pace (min/mile)', font: { size: 14 } },
						range: yDomain,
						tickvals: yTicks,
						ticktext: yTicks.map(t => formatPace(t)),
						gridcolor: colors.border, gridwidth: 0.5,
						zeroline: false, color: colors.textSecondary,
					},
				};

				// Render → capture → purge
				await (Plotly as any).newPlot(el, traces, layout, { staticPlot: true });
				const dataUrl: string = await (Plotly as any).toImage(el, {
					format: 'png', width: 1400, height: 700, scale: 2,
				});
				(Plotly as any).purge(el);

				images.set(entry.bib, dataUrl);
				// Update images progressively so the UI shows charts as they finish
				setChartImages(new Map(images));
			} catch (err) {
				console.error(`Failed to render chart for bib ${entry.bib}:`, err);
			}
		}

		setIsRendering(false);
	}, [raceResults, colors, isDark, dlsResultIds]);

	// Kick off the pipeline once entries, results, and dlsResultIds are ready
	useEffect(() => {
		if (!loading && !resultsLoading && validEntries.length > 0 && raceResults.length > 0 && dlsResultIds !== undefined) {
			setChartImages(new Map());
			runRenderPipeline(validEntries);
		}
	}, [loading, resultsLoading, validEntries, raceResults.length, dlsResultIds, runRenderPipeline]);

	/**
	 * Resolve an array of bib numbers to race results using the batch endpoint.
	 */
	const resolveBibs = useCallback(
		async (bibs: number[]): Promise<BibEntry[]> => {
			try {
				const results = await api.raceResults.getByBibNumbers(race.id, bibs);
				const resultsByBib = new Map(results.map(r => [r.bibNumber, r]));

				return bibs.map(bib => {
					const result = resultsByBib.get(bib) ?? null;
					return result
						? { bib, result }
						: { bib, result: null, error: `Bib ${bib} not found` };
				});
			} catch {
				// Fallback: mark all as errors
				return bibs.map(bib => ({ bib, result: null, error: `Failed to look up bib ${bib}` }));
			}
		},
		[race.id],
	);

	/**
	 * Open the bib-input dialog. On confirm, resolve bibs and open panel.
	 */
	const handleOpenDialog = useCallback(async () => {
		// State used to capture value from the dialog's TextInput.
		// We store it in a local variable (captured via closure in onChangeText)
		// because the dialog children are rendered once at showConfirm time.
		let inputValue = '';

		const confirmed = await showConfirm({
			title: 'Bulk Kill Charts',
			submitText: 'Generate',
			cancelText: 'Cancel',
			children: (
				<View>
					<Text style={{ color: colors.textSecondary, marginBottom: 4 }}>
						Enter bib numbers separated by commas:
					</Text>
					<TextInput
						defaultValue=""
						onChangeText={(text: string) => {
							inputValue = text;
						}}
						placeholder="e.g. 1234, 5678, 9012"
						placeholderTextColor={colors.textTertiary}
						style={styles.dialogInput}
						autoFocus
					/>
					<Text style={styles.dialogHint}>
						Each bib will generate its own kill chart.
					</Text>
				</View>
			),
		});

		if (!confirmed || !inputValue.trim()) return;

		const bibs = parseBibs(inputValue);
		if (bibs.length === 0) {
			await showAlert({ title: 'No valid bibs', message: 'Please enter at least one numeric bib number.' });
			return;
		}

		setLoading(true);
		setBibText(bibs.join(', '));
		setIsPanelOpen(true);

		const [dls, resolved] = await Promise.all([api.dls.getDlsResultIds(race.id), resolveBibs(bibs)]);
		setDlsResultIds(dls);
		setEntries(resolved);
		setLoading(false);
	}, [showConfirm, showAlert, colors, styles, resolveBibs]);

	/**
	 * Allow the user to update the bib list from within the panel.
	 */
	const handleUpdate = useCallback(async () => {
		const bibs = parseBibs(bibText);
		if (bibs.length === 0) {
			await showAlert({ title: 'No valid bibs', message: 'Please enter at least one numeric bib number.' });
			return;
		}

		setLoading(true);
		const [dls, resolved] = await Promise.all([api.dls.getDlsResultIds(race.id), resolveBibs(bibs)]);
		setDlsResultIds(dls);
		setEntries(resolved);
		setLoading(false);
	}, [bibText, resolveBibs, showAlert]);

	/**
	 * Export every captured chart image and bundle them into a zip.
	 */
	const handleExport = useCallback(async () => {
		if (chartImages.size === 0) {
			await showAlert({ title: 'Nothing to export', message: 'No valid charts to export.' });
			return;
		}

		setExporting(true);
		showWorking({ title: 'Exporting Charts', message: 'Generating PNG images...' });

		try {
			const zip = new JSZip();

			for (const entry of validEntries) {
				const dataUrl = chartImages.get(entry.bib);
				if (!dataUrl) continue;

				const base64 = dataUrl.split(',')[1];
				const runnerName = entry.result.name.replace(/[^a-zA-Z0-9]/g, '_');
				zip.file(`kill-chart-bib-${entry.bib}-${runnerName}.png`, base64, { base64: true });
			}

			const blob = await zip.generateAsync({ type: 'blob' });

			// Trigger browser download
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `kill-charts-race-${race.id}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Export failed:', err);
			await showAlert({ title: 'Export failed', message: String(err) });
		} finally {
			hideWorking();
			setExporting(false);
		}
	}, [chartImages, validEntries, race.id, showWorking, hideWorking, showAlert]);

	/**
	 * Close and reset
	 */
	const handleClose = useCallback(() => {
		renderAbortRef.current = true;
		setIsPanelOpen(false);
		setEntries([]);
		setDlsResultIds(undefined);
		setBibText('');
		setChartImages(new Map());
		setIsRendering(false);
	}, []);

	const allCaptured = validEntries.length > 0 && chartImages.size >= validEntries.length;

	return (
		<>
			{/* Trigger button – rendered inline on the race page */}
			<Button
				title="Bulk Kill Charts"
				variant="primary"
				onPress={handleOpenDialog}
			/>

			{/* Full-width panel with all charts */}
			<Panel
				isOpen={isPanelOpen}
				onClose={handleClose}
				headerTitle="Bulk Kill Charts"
				width="full"
				footer={
					<View style={styles.footerRow}>
						<Button
							title="Export All as ZIP"
							variant="primary"
							onPress={handleExport}
							disabled={!allCaptured || exporting}
							loading={exporting}
						/>
						<Button title="Close" variant="ghost" onPress={handleClose} />
					</View>
				}
			>
				<View style={styles.panelContent}>
					{/* Editable bib input */}
					<View style={styles.bibInputRow}>
						<TextInput
							value={bibText}
							onChangeText={setBibText}
							placeholder="e.g. 1234, 5678, 9012"
							placeholderTextColor={colors.textTertiary}
							style={styles.bibInput}
						/>
						<Button
							title="Update"
							variant="secondary"
							onPress={handleUpdate}
							disabled={loading}
							loading={loading}
						/>
					</View>

					{/* Loading indicator */}
					{loading && (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" />
							<Text style={styles.loadingText}>Looking up bibs…</Text>
						</View>
					)}

					{/* Race results loading indicator */}
					{resultsLoading && (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" />
							<Text style={styles.loadingText}>
								Loading race results… {resultsProgress.current} / {resultsProgress.total}
							</Text>
						</View>
					)}

					{/* Rendering progress */}
					{isRendering && (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" />
							<Text style={styles.loadingText}>
								Rendering charts… {renderProgress.current} / {renderProgress.total}
							</Text>
						</View>
					)}

					{/* Hidden div used by the imperative Plotly pipeline */}
					<div
						ref={renderDivRef}
						style={{ position: 'absolute', left: -9999, top: -9999, width: 1400, height: 700 }}
					/>

					{/* Charts as captured images */}
					{!loading && !resultsLoading && entries.length > 0 && (
						<View style={styles.chartsContainer}>
							{entries.map(entry => {
								if (!entry.result) {
									return (
										<View key={entry.bib} style={styles.chartWrapper}>
											<Text style={styles.errorText}>{entry.error ?? `Bib ${entry.bib} not found`}</Text>
										</View>
									);
								}

								const imageUrl = chartImages.get(entry.bib);

								return (
									<View key={entry.bib} style={styles.chartWrapper}>
										{imageUrl ? (
											<img
												src={imageUrl}
												alt={`Kill chart for ${entry.result.name}`}
												style={{ width: '100%', height: 'auto' }}
											/>
										) : (
											<View style={{ padding: 40, alignItems: 'center' }}>
												<ActivityIndicator size="large" />
												<Text style={styles.loadingText}>Rendering…</Text>
											</View>
										)}
									</View>
								);
							})}
						</View>
					)}

					{/* Empty state */}
					{!loading && entries.length === 0 && (
						<Text style={styles.emptyText}>
							Enter bib numbers above and press Update to generate kill charts.
						</Text>
					)}
				</View>
			</Panel>
		</>
	);
};

export default BulkKillChart;
