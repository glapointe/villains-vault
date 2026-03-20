/**
 * Card Component
 * 
 * Reusable card container with consistent styling
 * Supports popout modal mode for expanding content like charts
 */

import React, { ReactNode, useState, isValidElement, cloneElement } from 'react';
import { StyleProp, View, ViewProps, ViewStyle, Pressable, Modal, TouchableOpacity, ScrollView, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './Card.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CardProps extends ViewProps {
	children: ReactNode | ((props: { isModal: boolean }) => ReactNode);
	noPadding?: boolean;
	/**
	 * When true, clicking the card opens it in a modal dialog
	 * Useful for expanding charts or other content that needs more space
	 */
	allowPopout?: boolean;
	style?: StyleProp<ViewStyle>;
}

export function Card({ children, noPadding = false, allowPopout = false, style, ...props }: CardProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const insets = useSafeAreaInsets();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { width } = useWindowDimensions();

	// Responsive modal width: 800px for screens < 1300px, 1280px for larger screens
	const modalMaxWidth = (width < 1300 ? 800 : 1280) - insets.left - insets.right;

	/**
	 * Render content based on whether children is a function or regular ReactNode
	 * If function: call it with { isModal }
	 * If ReactNode: inject isModal prop via cloneElement (backward compatible)
	 */
	const renderContent = (isModal: boolean): ReactNode => {
		// Check if children is a function (render prop pattern)
		if (typeof children === 'function') {
			return children({ isModal });
		}

		// Backward compatible: inject isModal prop into children
		// Skip Fragments as they don't accept custom props
		return React.Children.map(children, (child) => {
			if (isValidElement(child)) {
				// Don't inject props into Fragments
				if (child.type === React.Fragment) {
					return child;
				}
				return cloneElement(child, { isModal } as any);
			}
			return child;
		});
	};

	const cardContent = renderContent(false);
	const modalContent = renderContent(true);

	const cardStyle = [
		noPadding ? styles.cardNoPadding : styles.card,
		themedStyles.card,
		allowPopout && styles.popoutCard,
		style
	];
	
	const CardWrapper = allowPopout ? Pressable : View;
	const wrapperProps = allowPopout
		? {
				onPress: () => setIsModalOpen(true),
				style: cardStyle,
				...props,
		  }
		: {
				style: cardStyle,
				...props,
		  };

	return (
		<>
			<CardWrapper {...wrapperProps}>
				{cardContent}
			</CardWrapper>

			{/* Modal for popout */}
			{allowPopout && (
				<Modal
					visible={isModalOpen}
					transparent
					animationType="fade"
					onRequestClose={() => setIsModalOpen(false)}
				>
					<TouchableOpacity
						style={themedStyles.modalBackdrop}
						activeOpacity={1}
						onPress={() => setIsModalOpen(false)}
					>
						<View style={styles.modalContainer}>
							<TouchableOpacity
								activeOpacity={1}
								onPress={(e) => e.stopPropagation()}
								style={[styles.modalContentWrapper, { maxWidth: modalMaxWidth, paddingLeft: insets.left, paddingRight: insets.right }]}
							>							
								{/* Close button */}
								<TouchableOpacity
									style={[styles.closeButton, themedStyles.closeButton, { marginRight: insets.right }]}
									onPress={() => setIsModalOpen(false)}
									accessibilityLabel="Close modal"
								>
									<View><Text style={[styles.closeButtonText, themedStyles.closeButtonText]}>✕</Text></View>
								</TouchableOpacity>
								<ScrollView
									contentContainerStyle={styles.modalScrollContent}
									showsVerticalScrollIndicator={true}
								>
									<View style={[noPadding ? styles.cardNoPadding : styles.card, themedStyles.card, styles.modalCard]}>
										{modalContent}
									</View>
								</ScrollView>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</Modal>
			)}
		</>
	);
}
