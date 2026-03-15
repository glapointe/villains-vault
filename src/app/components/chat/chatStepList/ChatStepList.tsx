/**
 * ChatStepList Component
 *
 * Renders collapsible "thinking" tool-call steps within an assistant message.
 * Shows a summary toggle (e.g., "Used 3 tools") that expands to show each
 * tool call with its name, status, and optional truncated result.
 * The "Working..." summary shows the most recent tool name and animated ellipsis.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './ChatStepList.styles';
import type { ChatStep } from '../../../models/chat';

interface ChatStepListProps {
	steps: ChatStep[];
	/** Whether the parent message is still streaming. */
	isStreaming?: boolean;
}

export function ChatStepList({ steps, isStreaming = false }: ChatStepListProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const [isExpanded, setIsExpanded] = useState(false);

	if (steps.length === 0) return null;

	const completedCount = steps.filter(s => s.status === 'complete').length;
	const inProgressCount = steps.filter(s => s.status === 'in_progress').length;
	const cancelledCount = steps.filter(s => s.status === 'cancelled').length;
	const hasInProgress = inProgressCount > 0;
	const wasCancelled = cancelledCount > 0 && !hasInProgress;

	/** Returns an inline summary; when tools are running it shows the LAST tool name. */
	const getSummaryText = () => {
		if (hasInProgress) {
			// Find the last in-progress tool (most recently started)
			const inProgressTools = steps.filter(s => s.status === 'in_progress');
			const latestTool = inProgressTools[inProgressTools.length - 1];
			const prefix = completedCount > 0
				? `Working (${completedCount + inProgressCount} tools)`
				: 'Working';
			return { text: `${prefix} — ${formatToolName(latestTool?.toolName)}`, animated: true };
		}
		if (wasCancelled) {
			const finishedCount = completedCount + cancelledCount;
			return { text: `Cancelled (${finishedCount} tool${finishedCount !== 1 ? 's' : ''})`, animated: false };
		}
		const toolCount = steps.length;
		return { text: `Used ${toolCount} tool${toolCount !== 1 ? 's' : ''}`, animated: false };
	};

	const formatToolName = (name?: string): string => {
		if (!name) return 'Unknown tool';
		// Convert camelCase or snake_case to readable form
		return name
			.replace(/_/g, ' ')
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/\b\w/g, c => c.toUpperCase());
	};

	const summary = getSummaryText();

	return (
		<View style={styles.container}>
			<Pressable
				style={[styles.toggleButton, themedStyles.toggleButton]}
				onPress={() => setIsExpanded(!isExpanded)}
				accessibilityLabel={isExpanded ? 'Collapse tool steps' : 'Expand tool steps'}
				accessibilityRole="button"
			>
				<Text style={[styles.toggleIcon, themedStyles.toggleIcon]}>
					{isExpanded ? '▼' : '▶'}
				</Text>
				<Text style={[styles.toggleText, themedStyles.toggleText]}>
					{summary.text}
				</Text>
				{summary.animated && (
					<Text style={[styles.toggleText, themedStyles.toggleText]}>...</Text>
				)}
				{hasInProgress && (
					<ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
				)}
			</Pressable>

			{isExpanded && (
				<View style={styles.stepsList}>
					{steps.map((step, index) => {
						const isComplete = step.status === 'complete';
						return (
							<View
								key={step.toolCallId ?? `step-${index}`}
								style={[
									styles.stepItem,
									themedStyles.stepItem,
									isComplete && themedStyles.stepItemComplete,
								]}
							>
								<Text style={styles.stepIcon}>
								{isComplete ? '✓' : step.status === 'cancelled' ? '✕' : '⟳'}
								</Text>
								<View style={styles.stepContent}>
									<Text style={[styles.stepToolName, themedStyles.stepToolName]}>
										{formatToolName(step.toolName)}
									</Text>
									{step.result && (
										<Text
											style={[styles.stepResult, themedStyles.stepResult, styles.stepResultTruncated]}
											numberOfLines={3}
										>
											{step.result}
										</Text>
									)}
								</View>
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
}
