import { Division, RaceResult, Race } from "models";

/** Available chart view modes */
export type ChartView = 'pace' | 'corral';

/**
 * Props for KillChart component
 */
/** Shared optional props for KillChart */
export interface KillChartBaseProps {
	/** Optional divisions array */
	divisions?: Division[];
	/** If true, hides the header including the filter, stats, and DNF note. */
	hideHeader?: boolean;
	/** If true, shows the embedded legend within the chart instead of the default legend above the chart. */
	embeddedLegend?: boolean;
	/** Optional pre-loaded race results. When provided, the chart skips its internal streaming fetch. */
	preloadedResults?: RaceResult[];
	/** If true, renders the chart as a static image (no hover, zoom, pan). */
	staticPlot?: boolean;
	/** Optional preloaded DLS results */
	dlsResultIds?: number[];
}

/** Direct props: caller provides race + evaluatedRunner */
export interface KillChartDirectProps extends KillChartBaseProps {
	race: Race;
	evaluatedRunner: RaceResult;
	resultId?: never;
}

/** Self-loading props: chart fetches race + evaluatedRunner by resultId */
export interface KillChartByResultIdProps extends KillChartBaseProps {
	/** Race result ID — the component fetches all data it needs from this */
	resultId: number;
	race?: never;
	evaluatedRunner?: never;
}

export type KillChartProps = KillChartDirectProps | KillChartByResultIdProps;
