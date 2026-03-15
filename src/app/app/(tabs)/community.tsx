/**
 * Community Events Screen
 *
 * Dedicated tab for browsing, creating, and managing community events.
 * All users can browse; authenticated users can create events and participate.
 */

import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../hooks';
import { CommunityEventList } from '../../components/community';

/**
 * Community Route
 * Public page — all users can browse community events.
 */
export default function CommunityScreen(): React.ReactElement {
	const { isAuthenticated, user } = useAuth();

	return (
		<View style={{ flex: 1 }}>
			<CommunityEventList />
		</View>
	);
}
