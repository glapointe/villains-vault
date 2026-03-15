/**
 * Race components barrel export
 * Lazy loads heavy chart components for better code splitting
 */
import React, { lazy } from 'react';

// Eagerly loaded components (lightweight)
export { RaceResultsGrid } from './resultsGrid';
export { ResultDetailsCard, PassStats } from './resultDetails';
export { RaceStatsDashboard, RaceStatsOverview, AgeGroupChart, SplitsStatsTable } from './raceStats';
export { FollowButton } from './followButton/FollowButton';
export { CourseMapViewer } from './courseMapViewer/CourseMapViewer';
export type { CourseMapViewerProps } from './courseMapViewer/CourseMapViewer';

import type { BulkKillChartProps } from './bulkKillChart';
import type { KillChartProps } from './killChart';
import type { PaceChartProps } from './paceChart';
import type { RaceStatsDashboardProps } from './raceStats/RaceStatsDashboard';

// Lazy loaded components (heavy - use Victory/Skia charts)
// Cast through unknown to give explicit prop types; lazy loading still works at runtime.
export const BulkKillChart = lazy(() => import('./bulkKillChart')) as unknown as React.FC<BulkKillChartProps>;
export const KillChart = lazy(() => import('./killChart')) as unknown as React.FC<KillChartProps>;
export const PaceChart = lazy(() => import('./paceChart')) as unknown as React.FC<PaceChartProps>;

// Eagerly-loaded supplementary components
export { SeriesRunnersChart } from './seriesRunnersChart';
export { FollowedResultsList } from './followedResults';

// Re-export types for convenience
export type { BulkKillChartProps } from './bulkKillChart';
export type { KillChartProps } from './killChart';
export type { PaceChartProps } from './paceChart';
export type { RaceStatsDashboardProps } from './raceStats/RaceStatsDashboard';