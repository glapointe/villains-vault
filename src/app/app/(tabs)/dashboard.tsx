/**
 * Dashboard Screen
 *
 * Authenticated user dashboard showing followed race results and
 * aggregate statistics. Requires sign-in to access.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth, useMyFollows } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedColors } from '../../theme';
import { LoadingSpinner, SectionHeader } from '../../components/ui';
import { FollowedResultsList } from '../../components/race';
import { styles, getThemedStyles } from '../../styles/routes/dashboard.styles';

/**
 * Dashboard Route
 * Requires the user to be authenticated; redirects to login otherwise.
 */
export default function DashboardScreen(): React.ReactElement {
	const { isAuthenticated, isLoading, accessToken, user } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const {
		claimed,
		interested,
		loading,
		error,
		actionLoading,
		yearOptions,
		seriesOptions,
		filterYear,
		filterSeries,
		setFilterYear,
		setFilterSeries,
		unfollowResult,
		claimResult,
		claimResults,
		updateFollow,
		searchMyResults,
	} = useMyFollows({ accessToken });

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (!isAuthenticated) {
		return <Redirect href="/(auth)/login" />;
	}

	return (
		<ScrollView style={[styles.container, themedStyles.container]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="always">
			<View style={[styles.content, themedStyles.content]}>
				<SectionHeader
					title="My Dashboard"
					subTitle="View your claimed and followed results."
					isPageHeader
				/>
				<FollowedResultsList
					claimed={claimed}
					interested={interested}
					loading={loading}
					error={error}
					actionLoading={actionLoading}
					yearOptions={yearOptions}
					seriesOptions={seriesOptions}
					filterYear={filterYear}
					filterSeries={filterSeries}
					onFilterYearChange={setFilterYear}
					onFilterSeriesChange={setFilterSeries}
					onUnfollow={unfollowResult}
					onClaim={claimResult}
					onClaimBatch={claimResults}
					onSearchMyResults={searchMyResults}
					onUpdateFollow={updateFollow}
				/>
			</View>
		</ScrollView>
	);
}
