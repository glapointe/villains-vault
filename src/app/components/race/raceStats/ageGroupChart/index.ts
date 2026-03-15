import { Platform } from 'react-native';
import type { AgeGroupChartProps } from './AgeGroupChart.types';

export type { AgeGroupChartProps, AgeGroupMetric } from './AgeGroupChart.types';

// Platform-specific exports
export const AgeGroupChart: React.FC<AgeGroupChartProps> = Platform.OS === 'web' 
    ? require('./AgeGroupChart.web').AgeGroupChart
    : require('./AgeGroupChart.native').AgeGroupChart;

export default AgeGroupChart;