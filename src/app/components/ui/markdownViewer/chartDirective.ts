/**
 * Chart Directive Types & Parser
 *
 * Defines the JSON schema for chart directives embedded in AI chat
 * responses as fenced code blocks with the `chart` language tag.
 *
 * Two directive types are supported:
 *   - `kill`  → renders the interactive KillChart (self-loads by resultId)
 *   - `bar` / `line` → renders the generic Chart with inline data
 */

import type { ChartSeries } from '../../ui/chart/Chart.types';

// ── Directive variants ──────────────────────────────────────────────

/** Renders a full interactive KillChart for a specific race result */
export interface KillChartDirective {
	type: 'kill';
	/** Race result ID — the KillChart fetches all data it needs from this */
	resultId: number;
}

/** Renders a generic bar or line chart with inline data */
export interface GenericChartDirective {
	type: 'bar' | 'line';
	/** Optional heading rendered above the chart */
	title?: string;
	/** One or more data series to plot */
	series: ChartSeries[];
	/** Optional x-axis label */
	xAxisLabel?: string;
	/** Optional y-axis label */
	yAxisLabel?: string;
}

/** Discriminated union of all supported chart directives */
export type ChartDirective = KillChartDirective | GenericChartDirective;

// ── Parser ──────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string into a validated ChartDirective.
 * Returns `null` for malformed JSON, unrecognised types, or missing
 * required fields — the caller should fall back to default code-block
 * rendering in that case.
 */
export function parseChartDirective(json: string): ChartDirective | null {
	try {
		const obj = JSON.parse(json);
		if (!obj || typeof obj !== 'object' || typeof obj.type !== 'string') {
			return null;
		}

		if (obj.type === 'kill') {
			if (typeof obj.resultId !== 'number' || !Number.isFinite(obj.resultId)) {
				return null;
			}
			return { type: 'kill', resultId: obj.resultId };
		}

		if (obj.type === 'bar' || obj.type === 'line') {
			if (!Array.isArray(obj.series) || obj.series.length === 0) {
				return null;
			}
			// Validate each series has a name and non-empty data array
			for (const s of obj.series) {
				if (typeof s.name !== 'string' || !Array.isArray(s.data) || s.data.length === 0) {
					return null;
				}
				// Validate each data point
				for (const d of s.data) {
					if (d.y === undefined || typeof d.y !== 'number') return null;
					if (d.x === undefined) return null;
				}
			}

			const directive: GenericChartDirective = {
				type: obj.type,
				series: obj.series,
			};
			if (typeof obj.title === 'string') directive.title = obj.title;
			if (typeof obj.xAxisLabel === 'string') directive.xAxisLabel = obj.xAxisLabel;
			if (typeof obj.yAxisLabel === 'string') directive.yAxisLabel = obj.yAxisLabel;
			return directive;
		}

		return null;
	} catch {
		return null;
	}
}
