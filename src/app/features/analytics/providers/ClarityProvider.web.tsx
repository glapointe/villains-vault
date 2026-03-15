/**
 * Web-specific Clarity Provider
 * 
 * Injects Microsoft Clarity tracking script into the DOM for web platforms.
 * Uses the standard Clarity JavaScript snippet approach for browser-based tracking.
 */

import { useEffect } from 'react';
import Constants from 'expo-constants';

interface ClarityProviderProps {
	children: React.ReactNode;
}

/**
 * Web-specific Clarity provider
 * Injects Clarity tracking script into DOM
 */
export function ClarityProvider({ children }: ClarityProviderProps) {
	useEffect(() => {
		const projectId = Constants.expoConfig?.extra?.clarityWebProjectId;
		
		if (!projectId) {
			console.warn('[Clarity Web] Project ID not configured');
			return;
		}

		// Inject Clarity script
		(function(c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
			c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments) };
			t = l.createElement(r);
			t.async = 1;
			t.src = `https://www.clarity.ms/tag/${i}`;
			y = l.getElementsByTagName(r)[0];
			y.parentNode.insertBefore(t, y);
		})(window, document, 'clarity', 'script', projectId);

		console.log('[Clarity Web] Initialized with project ID:', projectId);
	}, []);

	return <>{children}</>;
}
