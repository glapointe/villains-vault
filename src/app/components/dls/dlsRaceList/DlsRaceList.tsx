/**
 * DlsRaceList Component
 *
 * Displays upcoming DLS (Dead Last Start) races with declaration counts.
 * Authenticated users can self-declare their intent to DLS via a dialog
 * that captures bib number, first-DLS flag, going-for-kills flag, and comments.
 * Clicking the "Declared" badge re-opens the dialog for editing or withdrawing.
 * Anonymous users see race info and counts but no action buttons.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks';
import { useDlsDeclarations } from '../../../hooks';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Button, LoadingSpinner, SectionHeader } from '../../ui';
import { MessageBox } from '../../ui';
import { DlsDeclarationDialog } from '../dlsDeclarationDialog';
import { DlsDeclarationsPanel } from '../dlsDeclarationsPanel';
import { styles, getThemedStyles } from './DlsRaceList.styles';
import type { DlsRace, DlsDeclaration } from '../../../models';
import type { DlsDeclarationFormData } from '../dlsDeclarationDialog';

/** Typed wrapper for Animated.View with reanimated v4 */
const AnimatedContainer = Animated.View as React.ComponentType<any>;

/** Track which races the current user has declared for */
type UserDeclarationMap = Record<number, DlsDeclaration>;

/**
 * DlsRaceList — sidebar component for the home page
 * Shows upcoming DLS races, declaration counts, and self-declare actions
 */
export function DlsRaceList(): React.ReactElement | null {
	const { isAuthenticated, accessToken } = useAuth();
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const {
		races,
		loading,
		error,
		refreshRaces,
		selfDeclare,
		getMyDeclarations,
		deleteMyDeclaration,
		updateMyDeclaration,
		actionLoading,
	} = useDlsDeclarations({ accessToken });

	// Map of dlsRaceId → user's declaration (null if not declared)
	const [userDeclarations, setUserDeclarations] = useState<UserDeclarationMap>({});
	const [declarationsLoaded, setDeclarationsLoaded] = useState(false);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogRace, setDialogRace] = useState<DlsRace | null>(null);

	// Declarations panel state
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelRace, setPanelRace] = useState<DlsRace | null>(null);

	// Fetch user's declarations once races are loaded — single batch call
	// Depends on races.length so it re-runs when races first arrive but not on
	// every object-reference change from refreshRaces().
	const fetchGeneration = useRef(0);

	useEffect(() => {
		if (!isAuthenticated || races.length === 0) {
			setDeclarationsLoaded(true);
			return;
		}

		const generation = ++fetchGeneration.current;
		let cancelled = false;
		const fetchMyDeclarations = async (): Promise<void> => {
			const dlsRaceIds = races.map((r) => r.id);
			const declarations = await getMyDeclarations(dlsRaceIds);
			if (!cancelled && fetchGeneration.current === generation) {
				const map: UserDeclarationMap = {};
				for (const decl of declarations) {
					map[decl.dlsRaceId] = decl;
				}
				setUserDeclarations(map);
				setDeclarationsLoaded(true);
			}
		};

		fetchMyDeclarations();
		return () => { cancelled = true; };
	}, [isAuthenticated, races.length]);

	/** Open the declare/edit dialog for a race */
	const openDialog = useCallback((race: DlsRace) => {
		setDialogRace(race);
		setDialogOpen(true);
	}, []);

	/** Close the dialog */
	const closeDialog = useCallback(() => {
		setDialogOpen(false);
		setDialogRace(null);
	}, []);

	/** Open the declarations panel for a race */
	const openDeclarationsPanel = useCallback((race: DlsRace) => {
		setPanelRace(race);
		setPanelOpen(true);
	}, []);

	/** Close the declarations panel */
	const closeDeclarationsPanel = useCallback(() => {
		setPanelOpen(false);
		setPanelRace(null);
	}, []);

	/** Handle submission from the dialog (create or update) */
	const handleDialogSubmit = useCallback(async (data: DlsDeclarationFormData): Promise<void> => {
		if (!dialogRace) return;
		const existing = userDeclarations[dialogRace.id];

		if (existing) {
			// Update existing declaration
			const updated = await updateMyDeclaration(existing.id, {
				bibNumber: data.bibNumber ?? null,
				isFirstDls: data.isFirstDls,
				isGoingForKills: data.isGoingForKills,
				comments: data.comments,
			});
			if (updated) {
				setUserDeclarations((prev) => ({ ...prev, [dialogRace.id]: updated }));
			}
		} else {
			// Create new declaration
			const result = await selfDeclare({
				dlsRaceId: dialogRace.id,
				bibNumber: data.bibNumber,
				isFirstDls: data.isFirstDls,
				isGoingForKills: data.isGoingForKills,
				comments: data.comments,
			});
			if (result) {
				setUserDeclarations((prev) => ({ ...prev, [dialogRace.id]: result }));
			}
		}
		closeDialog();
	}, [dialogRace, userDeclarations, selfDeclare, updateMyDeclaration, closeDialog]);

	/** Handle withdraw from the dialog */
	const handleDialogWithdraw = useCallback(async (): Promise<void> => {
		if (!dialogRace) return;
		const existing = userDeclarations[dialogRace.id];
		if (!existing) return;

		const success = await deleteMyDeclaration(existing.id, dialogRace.id);
		if (success) {
			setUserDeclarations((prev) => {
				const next = { ...prev };
				delete next[dialogRace.id];
				return next;
			});
		}
		closeDialog();
	}, [dialogRace, userDeclarations, deleteMyDeclaration, closeDialog]);

	/** Format date for display */
	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	// Don't render anything if no races exist and not loading
	if (!loading && races.length === 0 && !error) {
		return null;
	}

	if (loading && races.length === 0) {
		return (
			<View style={styles.container}>
				<SectionHeader title="DLS Declarations" />
				<View style={styles.loadingContainer}>
					<LoadingSpinner size="small" />
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.container}>
				<SectionHeader title="DLS Declarations" />
				<MessageBox type="error" title="Error" message={error} showIcon />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<SectionHeader title="DLS Declarations" />
			{!isAuthenticated && declarationsLoaded && <View><Text style={[styles.loginPrompt, themedStyles.loginPrompt]}>Sign in to declare your participation.</Text></View>}

			{races.map((race, index) => {
				const myDeclaration = userDeclarations[race.id];
				const hasDeclared = !!myDeclaration;

				return (
					<AnimatedContainer
						key={race.id}
						entering={FadeInDown.duration(400).delay(index * 80)}
					>
						<View style={[styles.raceCard, themedStyles.raceCard]}>
							<View style={styles.raceInfo}>
								<Text style={[styles.raceName, themedStyles.raceName]}>
									{race.name}
								</Text>
								<Text style={[styles.raceDate, themedStyles.raceDate]}>
									{formatDate(race.raceDate)}
								</Text>
								{isAuthenticated && <Pressable
									onPress={() => openDeclarationsPanel(race)}
								>
									{({ hovered }: { hovered?: boolean }) => (
										<Text style={[styles.declarationCount, hovered ? themedStyles.declarationCountLinkHover : themedStyles.declarationCountLink]}>
											{race.declarationCount} {race.declarationCount === 1 ? 'runner' : 'runners'} declared
										</Text>
									)}
								</Pressable>}
								{!isAuthenticated && <Text style={[styles.declarationCount, themedStyles.declarationCount]}>
									{race.declarationCount} {race.declarationCount === 1 ? 'runner' : 'runners'} declared
								</Text>}
							</View>

							<View style={styles.actionRow}>
								{isAuthenticated && declarationsLoaded && (
									hasDeclared ? (
										<Pressable
											style={[styles.declaredBadge, themedStyles.declaredBadge]}
											onPress={() => openDialog(race)}
											disabled={actionLoading}
										>
											<Ionicons name="checkmark-circle" size={14} color={colors.success} />
											{myDeclaration?.isGoingForKills && <Ionicons name="skull-outline" size={14} color={colors.success} />}
											<Text style={[styles.declaredText, themedStyles.declaredText]}>
												Declared
											</Text>
										</Pressable>
									) : (
										<Button
											title="I'm DLSing!"
											variant="secondary"
											padding="md"
											onPress={() => openDialog(race)}
											loading={actionLoading}
										/>
									)
								)}
							</View>
						</View>
					</AnimatedContainer>
				);
			})}

			{/* Declarations panel */}
			<DlsDeclarationsPanel
				isOpen={panelOpen}
				race={panelRace}
				onClose={closeDeclarationsPanel}
			/>

			{/* Declaration dialog */}
			{dialogRace && (
				<DlsDeclarationDialog
					isOpen={dialogOpen}
					raceName={dialogRace.name}
					existingDeclaration={userDeclarations[dialogRace.id] ?? null}
					loading={actionLoading}
					onSubmit={handleDialogSubmit}
					onWithdraw={handleDialogWithdraw}
					onClose={closeDialog}
				/>
			)}
		</View>
	);
}
