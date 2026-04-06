/**
 * Panel Component
 * 
 * Mimics Fluent UI Panel with slide-in animation, customizable header/footer,
 * overlay backdrop, and close button. Typically slides in from the right side.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, BackHandler, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors, spacing } from '../../../theme';
import { styles, getThemedStyles } from './Panel.styles';

/**
 * Panel width types matching Fluent UI breakpoints
 */
export type PanelWidth = 'small' | 'medium' | 'large' | 'largeFixed' | 'xLarge' | 'full';

/**
 * Props for the Panel component
 */
export interface PanelProps {
	/** Whether the panel is visible */
	isOpen: boolean;
	/** Callback when panel close button is clicked or backdrop is tapped */
	onClose: () => void;
	/** Optional header title text */
	headerTitle?: string;
	/** Optional close button text (default: close icon) */
	closeButtonText?: string;
	/** Main content of the panel */
	children: React.ReactNode;
	/** Optional footer content - typically buttons */
	footer?: React.ReactNode;
	/** Whether clicking backdrop closes the panel (default: true) */
	lightDismiss?: boolean;
	/** Whether to show close button (default: true) */
	showCloseButton?: boolean;
	/** Animation duration in ms (default: 300) */
	animationDuration?: number;
	/** Panel width variant (default: 'medium') */
	width?: PanelWidth;
	/** Whether the content area should be scrollable (default: true).
	 * Set to false when hosting content that manages its own scroll (e.g. ChatInterface). */
	scrollable?: boolean;
}

/**
 * Panel Component
 * 
 * Full-height panel that slides in from the right with customizable header and footer.
 * Supports themed colors and responds to light/dark mode.
 * 
 * @example
 * <Panel
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   headerTitle="Submit Event"
 *   footer={<Button onPress={handleSubmit}>Submit</Button>}
 * >
 *   <Form />
 * </Panel>
 */
export const Panel: React.FC<PanelProps> = ({
	isOpen,
	onClose,
	headerTitle,
	closeButtonText,
	children,
	footer,
	lightDismiss = true,
	showCloseButton = true,
	animationDuration = 300,
	width = 'medium',
	scrollable = true,
}): React.ReactElement | null => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors, isDark);
	const screenWidth = Dimensions.get('window').width;
	const insets = useSafeAreaInsets();
	// On web the SafeAreaView wrapper is not used, so we apply the bottom inset
	// manually so the footer/content is never obscured by the system navigation bar.
	const webBottomInset = Platform.OS === 'web' ? insets.bottom : 0;

	// Guard against ghost taps on mobile web: the backdrop is disabled for a short
	// window after the panel opens so that the same touch event that triggered the
	// open cannot immediately land on the backdrop and close the panel again.
	const backdropReadyRef = useRef(false);
	useEffect(() => {
		if (isOpen) {
			backdropReadyRef.current = false;
			const timer = setTimeout(() => { backdropReadyRef.current = true; }, 350);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	/**
	 * Calculate responsive panel width based on variant and screen size
	 * On mobile devices (<600px), uses full screen width
	 * On larger screens, respects the width preset with 90% max constraint
	 */
	const getPanelWidth = (): number => {
		const MOBILE_BREAKPOINT = 600;
		const widthPresets: Record<PanelWidth, number> = {
			small: 272,
			medium: 365,
			large: 548,
			largeFixed: 640,
			xLarge: 800,
			full: screenWidth,
		};

		// On mobile devices, use full width
		if (screenWidth < MOBILE_BREAKPOINT) {
			return screenWidth;
		}

		const baseWidth = widthPresets[width];
		// On larger screens, use preset width or 90% of screen if smaller
		return Math.min(baseWidth, screenWidth * 0.9);
	};

	const panelWidth = getPanelWidth();
	const [slideAnim] = useState(new Animated.Value(panelWidth));

	/**
	 * Setup hardware back button handler for Android
	 * When panel is open, back button triggers onClose instead of exiting app
	 */
	useEffect((): (() => void) => {
		if (!isOpen || Platform.OS !== 'android') {
			return () => { };
		}

		const backHandler = BackHandler.addEventListener('hardwareBackPress', (): boolean => {
			onClose();
			return true; // Consume the back press event
		});

		return () => {
			backHandler.remove();
		};
	}, [isOpen, onClose]);

	/**
	 * Trigger slide-in animation when panel opens
	 */
	useEffect((): (() => void) => {
		if (isOpen) {
			Animated.timing(slideAnim, {
				toValue: 0,
				duration: animationDuration,
				useNativeDriver: false,
			}).start();
		} else {
			Animated.timing(slideAnim, {
				toValue: panelWidth,
				duration: animationDuration,
				useNativeDriver: false,
			}).start();
		}

		return () => {
			// Cleanup
		};
	}, [isOpen, slideAnim, panelWidth, animationDuration]);

	/**
	 * Handle backdrop tap to close panel if lightDismiss is enabled
	 */
	const handleBackdropPress = (): void => {
		if (!backdropReadyRef.current) return;
		if (lightDismiss) {
			onClose();
		}
	};

	const AnimatedView = Animated.View as any;

	if (!isOpen) {
		return <></>;
	}

	const panelBody = <View style={[styles.panel, themedStyles.panel]}>
		{/* Header */}
		{(Boolean(headerTitle) || Boolean(showCloseButton)) && (
			<View style={[styles.header, themedStyles.header]}>
				{Boolean(headerTitle) && (
					<Text style={[styles.headerTitle, themedStyles.headerTitle]}>{headerTitle}</Text>
				)}
				{Boolean(showCloseButton) && (
					<TouchableOpacity
						onPress={onClose}
						style={styles.closeButton}
						activeOpacity={0.7}
					>
						<Text style={[styles.closeButtonText, themedStyles.closeButtonText]}>
							{closeButtonText || '✕'}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		)}

		{/* Content */}
		{scrollable ? (
			<ScrollView
				style={[styles.content]}
				contentContainerStyle={{ paddingBottom: footer ? 0 : webBottomInset }}
				showsVerticalScrollIndicator={true}
			>
				{children}
			</ScrollView>
		) : (
			<View style={[styles.content, { paddingBottom: footer ? 0 : webBottomInset }]}>
				{children}
			</View>
		)}
		{/* Footer */}
		{Boolean(footer) && (
			<View style={[styles.footer, themedStyles.footer, webBottomInset > 0 && { paddingBottom: webBottomInset }]}>
				{footer}
			</View>
		)}
	</View>;

	return (
		<Modal
			visible={isOpen}
			transparent
			animationType="none"
			onRequestClose={onClose}
		>
			{/* Backdrop */}
			<TouchableOpacity
				style={themedStyles.backdrop}
				activeOpacity={1}
				onPress={handleBackdropPress}
			/>

			{/* Panel */}
			<AnimatedView style={[styles.panelContainer, { transform: [{ translateX: slideAnim }], width: panelWidth }]}>				
				{/* {Platform.OS === 'web' ? panelBody : ( */}
					<View style={{ flex: 1 }}>
						<SafeAreaView edges={['top', 'bottom', 'left', 'right']} {...{ style: { flex: 1 } }}>
							{panelBody}
						</SafeAreaView>
					</View>
				{/* )} */}
			</AnimatedView>
		</Modal>
	);
};
