/**
 * SectionHeader Component
 * 
 * Reusable section header with title, optional right-side content slot,
 * and a gradient accent underline for visual hierarchy.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors, palette } from '../../../theme';
import { styles, getThemedStyles } from './SectionHeader.styles';

const Gradient = LinearGradient as React.ComponentType<
	React.ComponentProps<typeof LinearGradient> & {
		style?: React.ComponentProps<typeof View>['style'];
	}
>;

interface SectionHeaderProps {
	/** Section title text */
	title?: string;
	/** Section subtitle text */
	subTitle?: string;
	/** Optional content rendered on the left side instead of the title (e.g., an icon) */
	leftContent?: React.ReactNode;
	/** Optional content rendered on the right side (e.g., filter dropdown) */
	rightContent?: React.ReactNode;
	/** Optional flag to indicate if this is a page header - applies larger bottom margins */
	isPageHeader?: boolean;
}

/**
 * SectionHeader Component
 * 
 * Renders a section title with optional left and right slots and
 * a gradient accent underline using the Villains brand colors.
 */
export function SectionHeader({ title, subTitle, leftContent, rightContent, isPageHeader }: SectionHeaderProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	return (
		<View style={styles.container}>
			<View style={[styles.headerRow, isPageHeader && styles.pageHeader]}>
				{Boolean(leftContent) ? (
					<View style={[styles.leftContent, isPageHeader && styles.pageHeaderLeftContent]}>
						{leftContent}
					</View>
				) : (
					<View style={[styles.leftContent, isPageHeader && styles.pageHeaderLeftContent]}>
						<Text style={[styles.title, themedStyles.title]}>
							{title}
						</Text>
						{Boolean(subTitle) && (
							<Text style={[styles.subTitle, themedStyles.subTitle]}>
								{subTitle}
							</Text>
						)}
					</View>
				)}
				{Boolean(rightContent) && (
					<View style={[styles.rightContent, isPageHeader && styles.pageHeaderRightContent]}>
						{rightContent}
					</View>
				)}
			</View>
			<Gradient
				colors={[palette.villains.purple, palette.villains.green]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={styles.accentLine}
			/>
		</View>
	);
}
