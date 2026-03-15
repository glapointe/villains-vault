/**
 * DlsDeclarationsPanel Component
 *
 * Read-only panel that shows all declarations (runners) for a DLS race.
 * Displays each runner's name, bib number, badges (first DLS, going for kills),
 * and optional comments. Fetches declarations from the public API.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Panel, LoadingSpinner } from '../../ui';
import { api } from '../../../services/api';
import type { DlsDeclaration } from '../../../models';
import type { DlsDeclarationsPanelProps } from './DlsDeclarationsPanel.types';
import { styles, getThemedStyles } from './DlsDeclarationsPanel.styles';

/**
 * Panel displaying all declarations for a DLS race
 */
export const DlsDeclarationsPanel: React.FC<DlsDeclarationsPanelProps> = ({
	isOpen,
	race,
	onClose,
}) => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const [declarations, setDeclarations] = useState<DlsDeclaration[]>([]);
	const [loading, setLoading] = useState(false);

	const loadDeclarations = useCallback(async (dlsRaceId: number): Promise<void> => {
		setLoading(true);
		try {
			const result = await api.dls.getDeclarations(dlsRaceId);
			setDeclarations(result);
		} catch {
			setDeclarations([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen && race) {
			loadDeclarations(race.id);
		} else {
			setDeclarations([]);
		}
	}, [isOpen, race, loadDeclarations]);
	
	const getUserDisplayNameComment = (declaration: DlsDeclaration): { comment: string|null; userDisplayName: string|null } => {
		// If the userId is null, this declaration is unclaimed. In that case, if the comments field contains a name in brackets, extract that as the display name and remove it from the comment.
		let userDisplayName = declaration.userDisplayName;
		let comment = declaration.comments;
		if (!declaration.userId && comment?.startsWith('[')) {
			const endIndex = comment.indexOf(']');
			if (endIndex !== -1) {
				userDisplayName = `${comment.substring(1, endIndex).trim()} (unclaimed)`;
				comment = comment.substring(endIndex + 1).trim();
			}
		}
		if (comment === '') comment = null;
		if (userDisplayName === '') userDisplayName = null;
		return { comment, userDisplayName };
	};
	
	return (
		<Panel
			isOpen={isOpen}
			onClose={onClose}
			headerTitle={race?.name ?? 'DLS Declarations'}
			width="medium"
		>
			<ScrollView>
				<View style={styles.container}>
					{loading ? (
						<View style={styles.loadingContainer}>
							<LoadingSpinner size="small" />
						</View>
					) : declarations.length === 0 ? (
						<Text style={[styles.emptyText, themedStyles.emptyText]}>
							No declarations yet — be the first!
						</Text>
					) : (
						<>
							<Text style={[styles.countText, themedStyles.countText]}>
								{declarations.length} {declarations.length === 1 ? 'runner' : 'runners'} declared
							</Text>
							{declarations.map((d) => (
								<View key={d.id} style={[styles.declarationRow, themedStyles.declarationRow]}>
									<View style={styles.declarationInfo}>
										<Text style={[styles.declarationName, themedStyles.declarationName]}>
											{getUserDisplayNameComment(d).userDisplayName || 'Anonymous'}
										</Text>
										<Text style={[styles.declarationBib, themedStyles.declarationBib]}>
											{d.bibNumber ? `Bib #${d.bibNumber}` : 'Bib TBD'}
										</Text>
										{(d.isFirstDls || d.isGoingForKills) && (
											<View style={styles.declarationBadges}>
												{d.isFirstDls && (
													<Text style={[styles.declarationBadge, themedStyles.declarationBadgeFirst]}>
														First DLS
													</Text>
												)}
												{d.isGoingForKills && (
													<Text style={[styles.declarationBadge, themedStyles.declarationBadgeKills]}>
														Going for kills
													</Text>
												)}
											</View>
										)}
										{getUserDisplayNameComment(d).comment ? (
											<Text style={[styles.declarationComment, themedStyles.declarationComment]} numberOfLines={3}>
												{getUserDisplayNameComment(d).comment}
											</Text>
										) : null}
									</View>
								</View>
							))}
						</>
					)}
				</View>
			</ScrollView>
		</Panel>
	);
};
