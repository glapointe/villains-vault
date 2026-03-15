/**
 * Job Status Panel Component
 * 
 * Displays the status of scraping/parsing jobs created from event submission.
 * Polls for updates every 15 seconds and allows canceling individual jobs.
 * Can be reused for monitoring existing race parsing jobs.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, Button, MessageBox } from '../../../components/ui';
import { api, setAuthToken } from '../../../services/api';
import type { Job, DivisionProgress } from '../../../models';
import { styles, getThemedStyles } from './JobStatusPanel.styles';
import { getJobTypeLabel, JobType } from 'models/enums/JobType';
import { JobStatus, getJobStatusLabel } from 'models/enums/JobStatus';

/**
 * Props for JobStatusPanel
 */
export interface JobStatusPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Callback when panel is closed */
    onClose: () => void;
    /** IDs of jobs to monitor (if not provided, will fetch recent jobs) */
    jobIds?: number[];
    /** Access token for API calls */
    accessToken: string;
    /** Poll interval in ms (default: 15000 = 15 seconds) */
    pollInterval?: number;
    /** Number of jobs per page when loading recent jobs (default: 5) */
    pageSize?: number;
}

/**
 * Get status color based on JobStatus enum value
 */
const getStatusColor = (status: JobStatus, colors: any): string => {
    switch (status) {
        case JobStatus.Queued: return colors.warning;
        case JobStatus.InProgress: return colors.info;
        case JobStatus.Completed: return colors.success;
        case JobStatus.PartiallyCompleted: return colors.error;
        case JobStatus.Failed: return colors.error;
        case JobStatus.Cancelled: return colors.textTertiary;
        default: return colors.textSecondary;
    }
};

/**
 * Job Status Panel Component
 * 
 * Monitors and displays job processing status with real-time updates.
 */
export const JobStatusPanel: React.FC<JobStatusPanelProps> = ({
    isOpen,
    onClose,
    jobIds,
    accessToken,
    pollInterval = 5000,
    pageSize = 5,
}): React.ReactElement => {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = getThemedStyles(colors);

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isPolling, setIsPolling] = useState<boolean>(false);
    const [expandedJobIds, setExpandedJobIds] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMoreJobs, setHasMoreJobs] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    // Ref to always have latest jobs for polling
    const jobsRef = useRef<Job[]>(jobs);

    // Keep jobsRef in sync with jobs
    useEffect(() => {
        jobsRef.current = jobs;
    }, [jobs]);

    // Determine if we're in "recent jobs" mode
    const isRecentMode = !jobIds || jobIds.length === 0;

	/**
	 * Fetch current job status from API
	 */
    const fetchJobStatus = async (): Promise<void> => {
        try {
            setAuthToken(accessToken);

            if (isRecentMode) {
                // In recent mode, always fetch page 1 for initial load
                const pageJobs = await api.jobs.getRecent(1, pageSize);
                setJobs(pageJobs);

                // Check if there are more jobs available
                if (pageJobs.length < pageSize) {
                    setHasMoreJobs(false);
                }
            } else {
                // Fetch specific jobs by IDs
                const fetchedJobs = await api.jobs.getByIds(jobIds!);
                setJobs(fetchedJobs);
            }

            setError('');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch job status';
            setError(errorMsg);
        }
    };

	/**
	 * Poll for updates to incomplete jobs only
	 */
    const pollIncompleteJobs = async (): Promise<void> => {
        try {
            setAuthToken(accessToken);
            // Always use the latest jobs array
            const incompleteJobIds = jobsRef.current
                .filter(job => job.status < JobStatus.Completed) // Only poll jobs that are not completed/failed/canceled
                .map(job => job.id);
            if (incompleteJobIds.length === 0) {
                return; // Nothing to poll
            }
            // Fetch only incomplete jobs
            const updatedJobs = await api.jobs.getByIds(incompleteJobIds);
            // Update jobs array by replacing updated jobs
            setJobs(prevJobs =>
                prevJobs.map(job => {
                    const updated = updatedJobs.find(u => u.id === job.id);
                    return updated || job;
                })
            );
            setError('');
        } catch (err) {
            console.error('Failed to poll job status:', err);
        }
    };

	/**
	 * Load more jobs (for recent mode only)
	 */
    const loadMoreJobs = async (): Promise<void> => {
        if (!isRecentMode || loadingMore) return;

        try {
            setLoadingMore(true);
            setAuthToken(accessToken);

            const nextPage = currentPage + 1;
            const newJobs = await api.jobs.getRecent(nextPage, pageSize);

            // Hide button if we get fewer results than page size or no results
            if (newJobs.length < pageSize) {
                setHasMoreJobs(false);
            }

            if (newJobs.length > 0) {
                setJobs(prev => [...prev, ...newJobs]);
                setCurrentPage(nextPage);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load more jobs';
            setError(errorMsg);
        } finally {
            setLoadingMore(false);
        }
    };

	/**
	 * Determine if all jobs are complete or failed
	 */
    const allJobsComplete = (): boolean => {
        return jobs.length > 0 && jobs.every((job) => job.status >= JobStatus.Completed); // Completed or Failed or Canceled
    };

	/**
	 * Setup polling when panel opens
	 */
    useEffect((): (() => void) => {
        // Don't start if panel is closed
        if (!isOpen) {
            return () => { };
        }

        // Reset state when panel opens
        setJobs([]);
        setCurrentPage(1);
        setHasMoreJobs(true);
        setError('');
        setExpandedJobIds(new Set());

        // For specific job IDs mode, need job IDs
        if (!isRecentMode && (!jobIds || jobIds.length === 0)) {
            return () => { };
        }

        let pollTimer: ReturnType<typeof setInterval> | null = null;

        // Initial fetch
        setLoading(true);
        fetchJobStatus()
            .catch((err) => {
                console.error('Failed to fetch job status:', err);
            })
            .finally(() => {
                setLoading(false);
            });

        // Start polling - only poll incomplete jobs
        pollTimer = setInterval(async () => {
            setIsPolling(true);
            await pollIncompleteJobs();
            setIsPolling(false);
        }, pollInterval);

        return () => {
            if (pollTimer) {
                clearInterval(pollTimer);
            }
        };
    }, [isOpen, jobIds, accessToken, pollInterval, isRecentMode]);

	/**
	 * Stop polling when all jobs are complete
	 */
    useEffect((): void => {
        if (allJobsComplete() && isPolling) {
            setIsPolling(false);
        }
    }, [jobs]);

	/**
	 * Determine overall success/failure status
	 */
    const getOverallStatus = (): { type: 'success' | 'error' | 'loading'; message: string } => {
        if (jobs.length === 0 && loading) {
            return { type: 'loading', message: 'Loading jobs...' };
        }
        if (jobs.length === 0) {
            return { type: 'error', message: 'No jobs found.' };
        }

        const completed = jobs.filter((j) => j.status === JobStatus.Completed).length;
        const failed = jobs.filter((j) => j.status === JobStatus.Failed).length;
        const pending = jobs.filter((j) => j.status === JobStatus.Queued || j.status === JobStatus.InProgress).length;

        if (pending > 0) {
            return {
                type: 'loading',
                message: `${completed} completed, ${pending} processing, ${failed} failed`,
            };
        }

        if (failed > 0) {
            return {
                type: 'error',
                message: `${completed} completed, ${failed} failed`,
            };
        }

        return {
            type: 'success',
            message: `All ${completed} jobs completed successfully`,
        };
    };

	/**
	 * Toggle expanded state for a job
	 */
    const toggleJobExpanded = (jobId: number): void => {
        setExpandedJobIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

	/**
	 * Get current division being processed (for running jobs)
	 */
    const getCurrentDivision = (job: Job): string | null => {
        if (!job.progressData?.divisions) return null;

        const runningDivision = job.progressData.divisions.find(d => d.status === JobStatus.InProgress);
        return runningDivision?.divisionName || null;
    };

	/**
	 * Render division details
	 */
    const renderDivisionItem = ({ item: division }: { item: DivisionProgress }): React.ReactElement => {
        const divStatusColor = getStatusColor(division.status, colors);

        return (
            <View style={[styles.divisionItem, { borderColor: colors.border }]}>
                <View style={styles.divisionHeader}>
                    <Text style={[styles.divisionStatus, { color: divStatusColor }]}>●</Text>
                    <Text style={[styles.divisionName, { color: colors.textPrimary }]}>{division.divisionName}</Text>
                </View>
                <View style={styles.divisionStats}>
                    <Text style={[styles.divisionStat, { color: colors.textSecondary }]}>
                        Parsed: {division.recordsParsed}
                    </Text>
                    <Text style={[styles.divisionStat, { color: colors.textSecondary }]}>
                        Added: {division.recordsAdded}
                    </Text>
                    <Text style={[styles.divisionStat, { color: colors.textSecondary }]}>
                        Updated: {division.recordsUpdated}
                    </Text>
                </View>
                {division.errorMessage && (
                    <Text style={[styles.divisionError, { color: colors.error }]}>
                        Error: {division.errorMessage}
                    </Text>
                )}
            </View>
        );
    };

	/**
	 * Render individual job item
	 */
    const renderJobItem = ({ item: job }: { item: Job }): React.ReactElement => {
        const statusLabel = getJobStatusLabel(job.status);
        const statusColor = getStatusColor(job.status, colors);
        const isExpanded = expandedJobIds.has(job.id);
        const currentDivision = getCurrentDivision(job);
        const totalDivisions = job.progressData?.divisions.length || 0;
        const completedDivisions = job.progressData?.divisions.filter(d => d.status === JobStatus.Completed).length || 0;
        const totalAdded = job.progressData?.totalAdded ?? -1;
        const totalUpdated = job.progressData?.totalUpdated ?? -1;

        return (
            <View style={[styles.jobItem, { borderColor: colors.border }]}>
                {/* Header row: Event/Race name and expand indicator */}
                <TouchableOpacity
                    style={styles.jobHeader}
                    onPress={() => toggleJobExpanded(job.id)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.jobLabel, { color: colors.textPrimary }]}><Text style={[styles.jobStatus, { color: statusColor }]}>●</Text>{job.eventName} - {job.raceName}</Text>
                    {totalDivisions > 0 && (
                        <Text style={[styles.expandIndicator, { color: colors.textSecondary }]}>
                            {isExpanded ? '▼' : '▶'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Status row: Status indicator, label, and current division */}
                <View style={styles.jobStatusRow}>				
                    <Text style={[styles.jobMeta, { color: colors.textSecondary, fontWeight: 'bold' }]}>
                        Job: <Text style={[{ color: statusColor }]}>{getJobTypeLabel(job.jobType)}</Text>
                    </Text>
                    <Text style={[styles.jobMeta, { color: colors.textSecondary, fontWeight: 'bold' }]}>
                        Status: <Text style={[{ color: statusColor }]}>{statusLabel}</Text>
                    </Text>
                    {currentDivision && job.status === JobStatus.InProgress && (
                        <Text style={[styles.jobMeta, { color: colors.textSecondary, marginLeft: 12 }]}>
                            Processing: {currentDivision}
                        </Text>
                    )}
                </View>

                {/* Stats row: Full width display of divisions, added, updated */}
                {job.jobType === JobType.Scrape && (totalDivisions > 0 || totalAdded >= 0 || totalUpdated >= 0) && (
                    <View style={[styles.jobStatsRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        {totalDivisions > 0 && (
                            <Text style={[styles.jobStat, { color: colors.textSecondary }]}>
                                Divisions: {completedDivisions}/{totalDivisions}
                            </Text>
                        )}
                        {totalAdded >= 0 && (
                            <Text style={[styles.jobStat, { color: colors.textSecondary }]}>
                                Total Added: {totalAdded.toLocaleString()}
                            </Text>
                        )}
                        {totalUpdated >= 0 && (
                            <Text style={[styles.jobStat, { color: colors.textSecondary }]}>
                                Total Updated: {totalUpdated.toLocaleString()}
                            </Text>
                        )}
                    </View>
                )}

                {/* Actions row: Spinner and cancel button */}
                {(job.status === JobStatus.InProgress || job.status < JobStatus.Completed) && (
                    <View style={styles.jobActions}>
                        {job.status === JobStatus.InProgress && (
                            <ActivityIndicator size="small" color={colors.primary} style={styles.jobSpinner} />
                        )}
                        {job.status < JobStatus.Completed && (
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={async (e) => {
                                    e?.stopPropagation?.();
                                    try {
                                        setAuthToken(accessToken);
                                        await api.jobs.cancelById(job.id);
                                        // Refetch to get updated status
                                        await fetchJobStatus();
                                    } catch (err) {
                                        console.error('Failed to cancel job:', err);
                                    }
                                }}
                                style={styles.cancelButton}
                            />
                        )}
                    </View>
                )}

                {/* Expanded division details */}
                {isExpanded && job.progressData?.divisions && job.progressData.divisions.length > 0 && (
                    <View style={styles.divisionsContainer}>
                        <Text style={[styles.divisionsHeader, { color: colors.textPrimary }]}>Division Details</Text>
                        <FlatList
                            data={job.progressData.divisions}
                            renderItem={renderDivisionItem}
                            keyExtractor={(division: DivisionProgress, index: number): string =>
                                `${division.divisionValue}-${index}`
                            }
                            scrollEnabled={false}
                        />
                    </View>
                )}
            </View>
        );
    };

    const overallStatus = getOverallStatus();

    return (
        <Panel
            isOpen={isOpen}
            onClose={onClose}
            headerTitle={isRecentMode ? "Recent Jobs" : "Processing Jobs"}
            width="large"
            showCloseButton={true}
            footer={                
				<View style={styles.footerActions}>
					<Button
						title="Close"
						onPress={onClose}
						style={styles.closeButton}
					/>
				</View>
            }
        >
            <>
                {loading ? (
                    <View style={[styles.centerContent, { minHeight: 400 }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[themedStyles.message, { marginTop: 16 }]}>
                            Fetching job status...
						</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContent}>
                        <MessageBox
                            type="error"
                            title="Error Loading Jobs"
                            message={error}
                            showIcon
                        />
                        <Button
                            title="Retry"
                            onPress={() => fetchJobStatus()}
                            style={styles.retryButton}
                        />
                    </View>
                ) : (
                            <>
                                <View
                                    style={[
                                        styles.statusBox,
                                        {
                                            borderColor:
                                                overallStatus.type === 'success'
                                                    ? colors.success
                                                    : overallStatus.type === 'error'
                                                        ? colors.error
                                                        : colors.info,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusMessage,
                                            {
                                                color:
                                                    overallStatus.type === 'success'
                                                        ? colors.success
                                                        : overallStatus.type === 'error'
                                                            ? colors.error
                                                            : colors.info,
                                            },
                                        ]}
                                    >
                                        {overallStatus.message}
                                    </Text>
                                    {isPolling && <ActivityIndicator size="small" color={colors.primary} />}
                                </View>

                                <View style={styles.jobList}>
                                    {jobs.map((job: Job) => (
                                        <View key={job.id.toString()}>
                                            {renderJobItem({ item: job })}
                                        </View>
                                    ))}
                                </View>

                                {/* Load More button for recent mode */}
                                {isRecentMode && hasMoreJobs && !loading && (
                                    <View style={styles.loadMoreContainer}>
                                        <Button
                                            title={loadingMore ? "Loading..." : "Load More"}
                                            onPress={loadMoreJobs}
                                            disabled={loadingMore}
                                            style={styles.loadMoreButton}
                                        />
                                    </View>
                                )}
                            </>
                        )}
            </>
        </Panel>
    );
};

export default JobStatusPanel;
