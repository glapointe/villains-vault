/**
 * Admin Dashboard Screen
 * 
 * Restricted area for administrators only. Requires authentication.
 * Redirects to login if not authenticated, redirects to home if not admin.
 */

import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedColors, spacing } from '../../theme';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState, Suspense } from 'react';
import { api, setAuthToken } from '../../services/api';
import { LoadingSpinner, Card, MessageBox, Button, Checkbox } from '../../components/ui';
import { EventSubmissionPanel, JobStatusPanel, HeroImagePanel, DlsManagementPanel } from '../../features/admin';
import { AdminEventsList } from '../../components/events';
import { styles } from '../../styles/routes/admin.styles';
import { text } from '../../theme/commonStyles';
import type { SubmitEventResponse } from '../../models';
import { getCacheBypassEnabled, setCacheBypassEnabled } from '../../utils';

/**
 * Admin Dashboard Component
 * Route guard ensures only administrators can access this screen
 */
export default function AdminScreen(): React.ReactElement {
	const { isAuthenticated, user, accessToken } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [isEventPanelOpen, setIsEventPanelOpen] = useState<boolean>(false);
	const [isJobsPanelOpen, setIsJobsPanelOpen] = useState<boolean>(false);
	const [isHeroImagePanelOpen, setIsHeroImagePanelOpen] = useState<boolean>(false);
	const [isDlsPanelOpen, setIsDlsPanelOpen] = useState<boolean>(false);
	const [jobIds, setJobIds] = useState<number[]>([]);
	const [bypassCache, setBypassCache] = useState<boolean>(false);

	/**
	 * Verifies administrative access and redirects non-admin users.
	 * Also ensures loading state is updated for all auth paths.
	 */
	const verifyAdminAccess = (): void => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		if (!accessToken) {
			// Wait for token to be available before evaluating admin status.
			setLoading(true);
			return;
		}

		setAuthToken(accessToken);
		api.users.getCurrentUser()
			.then((profile: { isAdmin: boolean }): void => {
				setIsAdmin(profile.isAdmin);
				if (!profile.isAdmin) {
					router.replace('/(tabs)');
				}
			})
			.catch((err: unknown): void => {
				console.error('Failed to fetch user profile:', err);
			})
			.finally((): void => {
				setLoading(false);
			});
	};

	/**
	 * Runs the admin verification flow when auth state changes.
	 */
	useEffect((): void => {
		// Trigger admin verification when auth state changes.
		verifyAdminAccess();
	}, [accessToken, isAuthenticated]);

	/**
	 * Load cache bypass state from storage on mount
	 */
	useEffect((): void => {
		const loadCacheBypassState = async (): Promise<void> => {
			const enabled = await getCacheBypassEnabled();
			setBypassCache(enabled);
		};
		loadCacheBypassState();
	}, []);

	/**
	 * Handle cache bypass toggle
	 */
	const handleCacheBypassToggle = async (enabled: boolean): Promise<void> => {
		setBypassCache(enabled);
		await setCacheBypassEnabled(enabled);
	};

	/**
	 * Handle successful event submission - show job status panel
	 */
	const handleJobsCreated = (response: SubmitEventResponse): void => {
		setJobIds(response.jobIds);
		setIsEventPanelOpen(false);
		setIsJobsPanelOpen(true);
	};

	/**
	 * Open job status panel in recent mode
	 */
	const handleOpenRecentJobs = (): void => {
		setJobIds([]);
		setIsJobsPanelOpen(true);
	};

	// Show loading state while checking permissions
	if (loading) {
		return <LoadingSpinner />;
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	// Redirect if not admin
	if (!isAdmin) {
		return <Redirect href="/(tabs)" />;
	}

	return (
		<View style={{ flex: 1 }}>
			<View style={{ flexGrow: 1, paddingBottom: spacing.lg }}>
				<View style={styles.content}>
					<Card style={styles.headerCard}>
						<Text style={[styles.title, { color: colors.textPrimary }]}>Admin Dashboard</Text>
						<Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage races and scraping jobs</Text>
					</Card>

					{/* Event Submission */}
					<View style={styles.featureCardsContainer}>
						<Card style={styles.featureCard}>
							<Text style={[text.featureTitle, { color: colors.textPrimary }]}>Submit Event</Text>
							<Text style={[text.featureDescription, { color: colors.textSecondary }]}>
								Submit a new race weekend event for parsing
							</Text>
							<Button
								title="Submit Event"
								onPress={() => setIsEventPanelOpen(true)}
								style={styles.actionButton}
							/>
						</Card>

						<Card style={styles.featureCard}>
							<Text style={[text.featureTitle, { color: colors.textPrimary }]}>Background Services</Text>
							<Text style={[text.featureDescription, { color: colors.textSecondary }]}>
								Monitor scraper health and job queue
							</Text>
							<Button
								title="View Recent Jobs"
								onPress={handleOpenRecentJobs}
								style={styles.actionButton}
							/>
						</Card>

						<Card style={styles.featureCard}>
							<Text style={[text.featureTitle, { color: colors.textPrimary }]}>Hero Images</Text>
							<Text style={[text.featureDescription, { color: colors.textSecondary }]}>
								Manage carousel images on the home page
							</Text>
							<Button
								title="Manage Images"
								onPress={() => setIsHeroImagePanelOpen(true)}
								style={styles.actionButton}
							/>
						</Card>

						<Card style={styles.featureCard}>
							<Text style={[text.featureTitle, { color: colors.textPrimary }]}>DLS Declarations</Text>
							<Text style={[text.featureDescription, { color: colors.textSecondary }]}>
								Manage DLS races and runner declarations
							</Text>
							<Button
								title="Manage DLS"
								onPress={() => setIsDlsPanelOpen(true)}
								style={styles.actionButton}
							/>
						</Card>

						<Card style={styles.featureCard}>
							<Text style={[text.featureTitle, { color: colors.textPrimary }]}>User Management</Text>
							<Text style={[text.featureDescription, { color: colors.textSecondary }]}>
								Manage user accounts, roles, and permissions
							</Text>
							<Button
								title="Manage Users"
								onPress={() => router.push('/(tabs)/users')}
								style={styles.actionButton}
							/>
						</Card>
					</View>
					{accessToken && (
						<AdminEventsList
							selectedYear={new Date().getFullYear()}
							showYearFilter={true}
							adminMode={true}
							isAdmin={isAdmin}
							accessToken={accessToken}
						/>
					)}

					{/* Cache Bypass Control */}
					<Card style={styles.featureCard}>
						<Text style={[text.featureTitle, { color: colors.textPrimary }]}>Developer Options</Text>
						<Checkbox
							label="Bypass Server Cache"
							description="When enabled, API requests will skip cached data and fetch fresh results from the database. Useful for immediately viewing results after job completion."
							checked={bypassCache}
							onToggle={handleCacheBypassToggle}
						/>
					</Card>
				</View>
				{/* Event Submission Panel - Lazy loaded */}
				{accessToken && (
					<Suspense fallback={null}>
						<EventSubmissionPanel
							isOpen={isEventPanelOpen}
							onClose={() => setIsEventPanelOpen(false)}
							onJobsCreated={handleJobsCreated}
							accessToken={accessToken}
						/>
					</Suspense>
				)}

				{/* Job Status Panel - Lazy loaded */}
				{accessToken && (
					<Suspense fallback={null}>
						<JobStatusPanel
							isOpen={isJobsPanelOpen}
							onClose={() => setIsJobsPanelOpen(false)}
							jobIds={jobIds}
							accessToken={accessToken}
						/>
					</Suspense>
				)}

				{/* Hero Image Panel - Lazy loaded */}
				{accessToken && (
					<Suspense fallback={null}>
						<HeroImagePanel
							isOpen={isHeroImagePanelOpen}
							onClose={() => setIsHeroImagePanelOpen(false)}
							accessToken={accessToken}
						/>
					</Suspense>
				)}

				{/* DLS Management Panel - Lazy loaded */}
				{accessToken && (
					<Suspense fallback={null}>
						<DlsManagementPanel
							isOpen={isDlsPanelOpen}
							onClose={() => setIsDlsPanelOpen(false)}
							accessToken={accessToken}
						/>
					</Suspense>
				)}
			</View>
		</View>
	);
}
