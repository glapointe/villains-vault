/**
 * UI Components
 * Reusable UI component exports
 */

import { Platform } from 'react-native';

export { Button } from './button/Button';
export { Card } from './card/Card';
export { LoadingSpinner } from './loadingSpinner/LoadingSpinner';
export { AppHeader } from '../layout/appHeader/AppHeader';
export { ThemeBackground } from './themeBackground/ThemeBackground';
export { MessageBox } from './messageBox/MessageBox';
export { Panel } from './panel/Panel';
export { Dialog } from './dialog';
export { ConfirmationDialog } from './dialog/ConfirmationDialog';
export { AlertDialog } from './dialog/AlertDialog';
export { WorkingDialog } from './dialog/WorkingDialog';
export { Checkbox } from './checkbox';
export { ErrorBoundary } from '../layout/errorBoundary/ErrorBoundary';
export { Tooltip, InfoTooltip } from './tooltip';
export { MarkdownViewer } from './markdownViewer';
export { SectionHeader } from './sectionHeader/SectionHeader';
export { DistanceBadge } from './distanceBadge/DistanceBadge';

// Platform-specific exports - select based on web vs native
const RichTextDialogModule = Platform.OS === 'web' 
	? require('./richTextDialog/RichTextDialog.web')
	: require('./richTextDialog/RichTextDialog.native');

const DatePickerModule = Platform.OS === 'web'
	? require('./datePicker/DatePicker.web')
	: require('./datePicker/DatePicker.native');

export const { RichTextDialog } = RichTextDialogModule;
export const { DatePicker } = DatePickerModule;

// Dropdown uses its own platform selection in index.ts
export { Dropdown } from './dropdown';

// Generic chart component (platform-specific: Victory on web, victory-native on mobile)
export { Chart } from './chart';
export type { ChartProps, ChartSeries, ChartDataPoint, ChartType } from './chart';

// Type exports
export type { MessageBoxProps, MessageBoxType } from './messageBox/MessageBox';
export type { PanelProps, PanelWidth } from './panel/Panel';
export type { DialogProps } from './dialog';
export type { ConfirmationDialogProps } from './dialog/ConfirmationDialog';
export type { AlertDialogProps } from './dialog/AlertDialog';
export type { WorkingDialogProps } from './dialog/WorkingDialog';
export type { RichTextDialogProps } from './richTextDialog';
export type { DatePickerProps } from './datePicker';
export type { DropdownProps, DropdownOption } from './dropdown';
export type { CheckboxProps } from './checkbox';
export type { TooltipProps, InfoTooltipProps, TooltipPlacement } from './tooltip';
