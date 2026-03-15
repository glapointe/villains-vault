/**
 * MarkdownViewer Component - Native Implementation
 * 
 * Uses react-native-markdown-display for React Native compatibility
 */

import React, { useCallback } from 'react';
import { Linking, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { getNativeMarkdownStyles } from './MarkdownViewer.styles';
import { tryNavigateInApp, getInAppPath } from './linkUtils';
import { parseChartDirective } from './chartDirective';
import { ChatChart } from '../../chat';
import { MarkdownViewerProps } from './MarkdownViewer.types';
import { FollowButton } from 'components/race';

/**
 * MarkdownViewer component for native platforms (iOS/Android)
 */
export function MarkdownViewer({ children }: MarkdownViewerProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const markdownStyles = getNativeMarkdownStyles(colors);
	const router = useRouter();

	const handleLinkPress = useCallback((url: string) => {
		if (tryNavigateInApp(url, router)) {
			return false; // prevent default handling
		}
		// External link — let the system handle it
		Linking.openURL(url).catch(err => console.error('Failed to open link:', err));
		return false; // we handled it
	}, [router]);
	
	const getResultIdFromUrl = (url: string): number | null => {
		const match = url.match(/\/results\/(\d+)/);
		return match ? parseInt(match[1], 10) : null;
	};

	const rules = {
		fence: (node: any, children: any, parent: any, markdownStylesArg: any) => {
			// Detect ```chart fenced blocks and render interactive charts
			if (node.sourceInfo === 'chart') {
				const text = node.content?.trim() ?? '';
				const directive = parseChartDirective(text);
				if (directive) {
					return <ChatChart key={node.key} directive={directive} />;
				}
			}
			// Fall through to default rendering for non-chart fences
			return undefined;
		},
		link: (node: any, children: any, parent: any, markdownStylesArg: any) => {
			const href = node.attributes?.href || '';
			const inAppPath = getInAppPath(href);
			return (
				<View key={node.key} style={markdownStyles.linkWrapper}>
					{children}
					{inAppPath && getResultIdFromUrl(inAppPath) !== null && (
						<FollowButton raceResultId={getResultIdFromUrl(inAppPath)!} mode="link" linkPrefixText="(" linkSuffixText=")" />
					)}
				</View>
			);
		},
		table: (node: any, children: any, parent: any, markdownStylesArg: any) => (
			<View key={node.key} style={{ marginBottom: 12 }}>
				{children}
			</View>
		),
	};

	return (
		<Markdown style={markdownStyles} rules={rules} onLinkPress={handleLinkPress}>
			{children}
		</Markdown>
	);
}
