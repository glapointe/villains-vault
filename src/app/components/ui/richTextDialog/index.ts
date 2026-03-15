/**
 * Rich Text Dialog components barrel export
 * Exports platform-specific implementations
 */
import { Platform } from 'react-native';
import type { RichTextDialogProps } from './RichTextDialog.types';

// Shared types - always available regardless of platform
export type { RichTextDialogProps } from './RichTextDialog.types';

// Platform-specific component exports
export const RichTextDialog: React.FC<RichTextDialogProps> = Platform.OS === 'web'
    ? require('./RichTextDialog.web').RichTextDialog
    : require('./RichTextDialog.native').RichTextDialog;