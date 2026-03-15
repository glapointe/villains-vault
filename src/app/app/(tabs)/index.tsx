/**
 * Home Screen (Main App View)
 * 
 * Public landing page with full-bleed hero carousel, race events list,
 * and legal disclaimer. The content sheet overlaps the hero bottom
 * with rounded top corners for a modern layered appearance.
 * Users can browse anonymously or sign in for personalized features.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemedColors } from '../../theme';

/** Typed wrapper to fix Animated.View children type issue with reanimated v4 */
const AnimatedContainer = Animated.View as React.ComponentType<any>;
import { Dropdown } from '../../components/ui';
import { SectionHeader } from '../../components/ui';
import { EventsList } from '../../components/events';
import { DlsRaceList } from '../../components/dls';
import { CommunityEventPreview } from '../../components/community';
import { HeroCarousel } from '../../components/layout/heroCarousel/HeroCarousel';
import { DisclaimerBanner } from '../../components/layout';
import { HERO_SLIDES, HERO_GRADIENT_PALETTE } from '../../components/layout/heroCarousel';
import type { HeroSlide } from '../../components/layout/heroCarousel';
import { useEvents } from '../../hooks/useEvents';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import type { HeroImage } from '../../models';
import { styles, getThemedStyles } from '../../styles/routes/index.styles';
import { ChatPromptBar } from '../../components/chat';
import { getDisableDlsDeclarations, getDisabledCommunityEvents } from 'utils';

/**
 * Home Screen Component
 * Main public view with full-bleed hero and content sheet overlay
 */
export default function HomeScreen(): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors, isDark);
	const router = useRouter();

	// Dynamic hero images from API, gradient fallback
	const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(HERO_SLIDES);

	useEffect(() => {
		api.heroImages.getRecent()
			.then((images: HeroImage[]) => {
				if (images.length > 0) {
					const slides: HeroSlide[] = images.map((img, i) => ({
						uri: img.fullUrl,
						gradientColors: HERO_GRADIENT_PALETTE[i % HERO_GRADIENT_PALETTE.length],
					}));
					setHeroSlides(slides);
				}
			})
			.catch(() => {
				// Silently fall back to gradient-only slides
			});
	}, []);

	// Year filter state — managed here, passed down
	const { yearOptions, currentYear, setCurrentYear } = useEvents({
		selectedYear: new Date().getFullYear(),
		fetchYearOptions: true,
	});

	const handleYearChange = (year: number): void => {
		setCurrentYear(year === 0 ? undefined : year);
	};

	const handleViewAllCommunity = useCallback(() => {
		router.push('/(tabs)/community' as any);
	}, [router]);

	const subtitle = 'Making magical runDisney memories through shenanigans and stats!';
	const disableDlsDeclarations = getDisableDlsDeclarations();
	const disabledCommunityEvents = getDisabledCommunityEvents();

	return (
		<View style={{ flex: 1 }}>
			{/* Hero Carousel — full bleed, no max-width */}
			<View style={styles.heroSection}>
				<HeroCarousel
					slides={heroSlides}
					title="Villains Vault"
					subtitle={subtitle}
				/>
			</View>

			{/* Content Sheet — overlaps hero, rounded top, themed background */}
			<View style={[styles.contentSheet, themedStyles.contentSheet]}>
				{/* AI Chat Prompt Bar */}
				<ChatPromptBar mode="navigate" />

				<AnimatedContainer
					entering={FadeInDown.duration(500).delay(400)}
				>
					<View style={styles.mainContentRow}>
						{/* Events column — 2/3 on web */}
						<View style={styles.eventsColumn}>
							<View style={styles.eventsSection}>
								<SectionHeader
									title="runDisney Events"
									rightContent={
										yearOptions.length > 0 ? (
											<Dropdown
												value={currentYear || 0}
												options={yearOptions}
												onChange={handleYearChange}
												placeholder="Select year..."
											/>
										) : undefined
									}
								/>
								<EventsList selectedYear={currentYear} />
							</View>
						</View>

						{/* DLS sidebar — 1/3 on web */}
						{(!disableDlsDeclarations || !disabledCommunityEvents) && (<View style={styles.miscColumn}>
							{!disableDlsDeclarations && <DlsRaceList />}
							{!disabledCommunityEvents && (
								<CommunityEventPreview

									onViewAll={handleViewAllCommunity}
								/>
							)}
						</View>)}
					</View>
				</AnimatedContainer>

				{/* Legal Disclaimer Banner */}
				<View style={styles.disclaimerSection}>
					<DisclaimerBanner />
				</View>
			</View>
		</View>
	);
}
