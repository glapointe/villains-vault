/**
 * MarkdownViewer Component - Web Implementation
 * 
 * Uses react-markdown for better CSS support on web
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { getWebMarkdownStyles } from './MarkdownViewer.styles';
import { getInAppPath } from './linkUtils';
import { parseChartDirective } from './chartDirective';
import { ChatChart } from '../../chat';
import { MarkdownViewerProps } from './MarkdownViewer.types';
import { FollowButton } from 'components/race';
import { Text } from 'react-native';

/**
 * MarkdownViewer component for web platform
 */
export function MarkdownViewer({ children }: MarkdownViewerProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const styles = getWebMarkdownStyles(colors);

	const getResultIdFromUrl = (url: string): number | null => {
		const match = url.match(/\/results\/(\d+)/);
		return match ? parseInt(match[1], 10) : null;
	};

	return (
		<div style={styles.wrapper as React.CSSProperties}>
			<ReactMarkdown 
				remarkPlugins={[remarkGfm]}
				components={{
					h1: ({ node, ...props }) => <h1 style={styles.h1 as React.CSSProperties} {...props} />,
					h2: ({ node, ...props }) => <h2 style={styles.h2 as React.CSSProperties} {...props} />,
					h3: ({ node, ...props }) => <h3 style={styles.h3 as React.CSSProperties} {...props} />,
					p: ({ node, ...props }) => <p style={styles.p as React.CSSProperties} {...props} />,
					ul: ({ node, ...props }) => <ul style={styles.ul as React.CSSProperties} {...props} />,
					ol: ({ node, ...props }) => <ol style={styles.ol as React.CSSProperties} {...props} />,
					li: ({ node, ...props }) => <li style={styles.li as React.CSSProperties} {...props} />,
					a: ({ node, href, ...props }) => {
						const inAppPath = href ? getInAppPath(href) : null;
						const resultId = inAppPath ? getResultIdFromUrl(inAppPath) : null;			
						return (
							<span style={styles.linkWrapper as React.CSSProperties}>
								<a
									style={styles.a as React.CSSProperties}
									{...props}
									href={inAppPath ?? href}
									target="_blank"
									rel="noopener noreferrer"
								/>
								{/* If it's an in-app link to a race result, render a FollowButton */}
								{inAppPath && resultId !== null && (
									<>
										{" "}
										<FollowButton raceResultId={resultId} mode="link" linkPrefixText="(" linkSuffixText=")" />
									</>
								)}
							</span>
						);
					},
					strong: ({ node, ...props }) => <strong style={styles.strong as React.CSSProperties} {...props} />,
					code: ({ node, className, children, ...props }) => {
						// Detect ```chart fenced blocks and render interactive charts
						if (typeof className === 'string' && className.includes('language-chart')) {
							const text = String(children).replace(/\n$/, '');
							const directive = parseChartDirective(text);
							if (directive) {
								return <ChatChart directive={directive} />;
							}
						}
						return <code style={styles.code as React.CSSProperties} className={className} {...props}>{children}</code>;
					},
					pre: ({ node, children, ...props }) => {
						// If the child is a ChatChart (from the code handler), render without <pre> wrapper
						if (React.isValidElement(children) && (children as any).type === ChatChart) {
							return <>{children}</>;
						}
						return <pre style={styles.pre as React.CSSProperties} {...props}>{children}</pre>;
					},
					table: ({ node, ...props }) => (
						<div style={styles.tableScrollWrapper as React.CSSProperties}>
							<table style={styles.table as React.CSSProperties} {...props} />
						</div>
					),
					thead: ({ node, ...props }) => <thead style={styles.thead as React.CSSProperties} {...props} />,
					th: ({ node, ...props }) => <th style={styles.th as React.CSSProperties} {...props} />,
					td: ({ node, ...props }) => <td style={styles.td as React.CSSProperties} {...props} />,
					tr: ({ node, children, ...props }) => {
						// Find the row index from the parent tbody/thead for alternating colors
						const parent = node?.position;
						const rowIndex = parent?.start?.line ?? 0;
						const isEven = rowIndex % 2 === 0;
						const rowStyle = isEven ? styles.trEven : styles.trOdd;
						return <tr style={rowStyle as React.CSSProperties} {...props}>{children}</tr>;
					},
				}}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}
