/**
 * Weather components barrel export
 * Exports platform-specific implementations
 */
import { Platform } from 'react-native';
import type { WeatherProps } from './Weather.types';

// Shared types - always available regardless of platform
export type { WeatherProps } from './Weather.types';

// Platform-specific component exports
export const Weather: React.FC<WeatherProps> = Platform.OS === 'web'
    ? require('./Weather.web').Weather
    : require('./Weather.native').Weather;