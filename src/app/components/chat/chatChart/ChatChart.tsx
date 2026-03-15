/**
 * ChatChart Component
 *
 * Renders an inline chart within AI chat messages.
 * Accepts a parsed ChartDirective and delegates to:
 *   - KillChart (self-loads race data by resultId)
 *   - Generic Chart (bar / line) with inline data
 */

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { KillChart } from '../../race/killChart';
import { Chart } from '../../ui/chart';
import type { ChartDirective } from '../../ui/markdownViewer/chartDirective';
import { styles, getThemedStyles } from './ChatChart.styles';

interface ChatChartProps {
	directive: ChartDirective;
}

/**
 * Inline chart rendered within an AI chat message.
 * Kill directives self-load race/result data; generic directives render
 * directly from the provided inline data. The agent is expected to output
 * any accompanying data tables as standard markdown.
 */
export function ChatChart({ directive }: ChatChartProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themed = getThemedStyles(colors);

	if (directive.type === 'kill') {
		return (
			<View style={[styles.container, themed.container]}>
				<View style={styles.chartWrapper}>
					<KillChart
						resultId={directive.resultId}
						hideHeader
						embeddedLegend
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, themed.container]}>
			<View style={styles.chartWrapper}>
				<Chart
					type={directive.type}
					series={directive.series}
					title={directive.title}
					xAxisLabel={directive.xAxisLabel}
					yAxisLabel={directive.yAxisLabel}
					width="100%"
				/>
			</View>
		</View>
	);
}
