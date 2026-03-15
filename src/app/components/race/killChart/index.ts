/**
 * Kill Chart components barrel export
 * Exports platform-specific implementations via require() so Metro
 * can tree-shake the unused platform branch.
 */
import { Platform } from 'react-native';
import type { KillChartProps } from './KillChart.types'

// Shared types - always available regardless of platform
export type { KillChartProps, KillChartByResultIdProps, KillChartDirectProps, ChartView } from './KillChart.types';

// Platform-specific component exports
export const KillChart: React.FC<KillChartProps> = Platform.OS === 'web'
	? require('./KillChart.web').KillChart
	: require('./KillChart.native').KillChart;

export default KillChart;