import { Platform } from 'react-native';
import type { MarkdownViewerProps } from './MarkdownViewer.types';

// Shared types - always available regardless of platform
export type { MarkdownViewerProps } from './MarkdownViewer.types';

// Platform-specific component export
export const MarkdownViewer: React.FC<MarkdownViewerProps> = Platform.OS === 'web'
	? require('./MarkdownViewer.web').MarkdownViewer
	: require('./MarkdownViewer.native').MarkdownViewer;

