/**
 * ScrollOffset Context
 * 
 * Provides a shared animated scroll offset value from the tabs layout
 * ScrollView. Used by the hero carousel for scroll-driven parallax
 * and fade effects on the home page.
 */

import React, { createContext, useContext } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface ScrollOffsetContextType {
	/** Current vertical scroll offset (animated shared value) */
	scrollY: SharedValue<number>;
}

const ScrollOffsetContext = createContext<ScrollOffsetContextType | null>(null);

/**
 * Provider that creates and exposes an animated scroll offset value.
 * Place this in the layout that owns the ScrollView.
 */
export function ScrollOffsetProvider({ children }: { children: React.ReactNode }): React.ReactElement {
	const scrollY = useSharedValue(0);

	return (
		<ScrollOffsetContext.Provider value={{ scrollY }}>
			{children}
		</ScrollOffsetContext.Provider>
	);
}

/**
 * Hook to consume the scroll offset shared value.
 * Returns null if used outside a ScrollOffsetProvider (safe for non-home tabs).
 */
export function useScrollOffset(): SharedValue<number> | null {
	const context = useContext(ScrollOffsetContext);
	return context?.scrollY ?? null;
}
