/**
 * Chart Component – Platform-aware export
 *
 * Selects the correct implementation at runtime:
 *   web    → Chart.web.tsx   (Victory)
 *   native → Chart.native.tsx (victory-native / Skia)
 */

import { Platform } from 'react-native';
import type { ChartProps } from './Chart.types';

export const Chart: React.FC<ChartProps> = Platform.OS === 'web'
    ? require('./Chart.web').Chart 
    : require('./Chart.native').Chart;

export type { ChartProps, ChartSeries, ChartDataPoint, ChartType } from './Chart.types';
