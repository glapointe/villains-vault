/**
 * Pass Stats Component
 *
 * Displays kill/assassin counts broken down by dimension (total, division, gender, hometown).
 * Layout mirrors the Runner Types / Race Dynamics tiles on the Race Stats Overview page.
 */

import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Card, InfoTooltip } from '../../ui';
import type { RaceResultDetailed } from '../../../models';
import { createStyles, getThemedStyles } from './PassStats.styles';

interface PassStatsProps {
	result: RaceResultDetailed;
}

interface StatCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	variant?: 'default' | 'kill' | 'assassin';
	tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, variant = 'default', tooltip }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);
	const { width } = useWindowDimensions();
	const styles = useMemo(() => createStyles(width), [width]);

	const valueStyle = variant === 'kill' ? themedStyles.valueKill
		: variant === 'assassin' ? themedStyles.valueAssassin
			: themedStyles.value;

	return (
		<Card style={styles.statCard}>
			<View style={styles.statTitle}>
				<Text style={themedStyles.statTitle}>{title}</Text>
				{Boolean(tooltip) && (
					<InfoTooltip tooltip={tooltip} />
				)}
			</View>
			<Text style={[styles.statValue, valueStyle]}>{value}</Text>
			{subtitle && (
				<Text style={[styles.statSubtitle, themedStyles.statSubtitle]}>{subtitle}</Text>
			)}
		</Card>
	);
};

/**
 * PassStats Component
 *
 * Shows kills and assassins side-by-side with per-dimension breakdowns.
 */
export const PassStats: React.FC<PassStatsProps> = ({ result }) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = useMemo(() => getThemedStyles(colors), [colors]);
	const { width } = useWindowDimensions();
	const styles = useMemo(() => createStyles(width), [width]);

	const passes = result.passes;
	const passers = result.passers;

	// Don't render if there's no pass data at all
	if (passes == null && passers == null) {
		return null;
	}

	const passBreakdowns = result.resultData?.passBreakdowns;
	const passerBreakdowns = result.resultData?.passerBreakdowns;

	const formatSubtitle = (dimension: number | null | undefined, total: number | null | undefined): string | undefined => {
		if (dimension == null || total == null || total === 0) return undefined;
		return `${((dimension / total) * 100).toFixed(1)}% of total`;
	};

	return (
		<View style={styles.container}>
			<View style={styles.sideBySideContainer}>
				{/* Kills */}
				<View style={styles.sideColumn}>
					<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Kills (Passed)</Text>
					<View style={styles.grid}>
						<StatCard
							title="Total"
							value={(passes ?? 0).toLocaleString()}
							variant="kill"
							subtitle={formatSubtitle(passes, result.raceRunners)}
						/>
						<StatCard
							title="By Division"
							value={(passBreakdowns?.byDivision ?? 0).toLocaleString()}
							subtitle={formatSubtitle(passBreakdowns?.byDivision, result.divisionRunners)}
						/>
						<StatCard
							title="By Gender"
							value={(passBreakdowns?.byGender ?? 0).toLocaleString()}
							subtitle={formatSubtitle(passBreakdowns?.byGender, result.resultData?.rankings?.genderTotal)}
							tooltip={`Considers the current runner type only (e.g. Runner, Handcycle, Push Rim) to provide a more relevant comparison among similar competitors.`}
						/>
						<StatCard
							title="By Hometown"
							value={(passBreakdowns?.byHometown ?? 0).toLocaleString()}
							subtitle={formatSubtitle(passBreakdowns?.byHometown, result.resultData?.rankings?.hometownTotal)}
						/>
					</View>
				</View>

				{/* Assassins */}
				<View style={styles.sideColumn}>
					<Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Assassins (Passers)</Text>
					<View style={styles.grid}>
						<StatCard
							title="Total"
							value={(passers ?? 0).toLocaleString()}
							variant="assassin"
							subtitle={formatSubtitle(passers, result.raceRunners)}
						/>
						<StatCard
							title="By Division"
							value={(passerBreakdowns?.byDivision ?? 0).toLocaleString()}
							subtitle={formatSubtitle(passerBreakdowns?.byDivision, result.divisionRunners)}
						/>
						<StatCard
							title="By Gender"
							value={(passerBreakdowns?.byGender ?? 0).toLocaleString()}
							subtitle={formatSubtitle(passerBreakdowns?.byGender, result.resultData?.rankings?.genderTotal)}
							tooltip={`Considers the current runner type only (e.g. Runner, Handcycle, Push Rim) to provide a more relevant comparison among similar competitors.`}
						/>
						<StatCard
							title="By Hometown"
							value={(passerBreakdowns?.byHometown ?? 0).toLocaleString()}
							subtitle={formatSubtitle(passerBreakdowns?.byHometown, result.resultData?.rankings?.hometownTotal)}
						/>
					</View>
				</View>
			</View>
		</View>
	);
};
