/**
 * DatePicker components barrel export
 * Exports platform-specific implementations
 */
import { Platform } from 'react-native';
import type { DatePickerProps } from './DatePicker.types';

// Shared types - always available regardless of platform
export type { DatePickerProps } from './DatePicker.types';

// Platform-specific component exports
export const DatePicker: React.FC<DatePickerProps> = Platform.OS === 'web'
    ? require('./DatePicker.web').DatePicker
    : require('./DatePicker.native').DatePicker;