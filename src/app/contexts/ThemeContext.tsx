/**
 * Theme Context
 * 
 * Provides dark/light mode theming across the application
 * Persists theme preference in AsyncStorage and defaults to system settings
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
	theme: ThemeMode;
	toggleTheme: () => void;
	isDark: boolean;
}

// Export the context so class components can use static contextType
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const systemColorScheme = useColorScheme();
	const [theme, setTheme] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');
	const [isLoaded, setIsLoaded] = useState(false);

	// Load saved theme preference on mount
	useEffect(() => {
		const loadTheme = async () => {
			try {
				const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (savedTheme === 'light' || savedTheme === 'dark') {
					setTheme(savedTheme);
				} else {
					// Default to system preference if no saved preference
					setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
				}
			} catch (error) {
				console.error('Failed to load theme preference:', error);
			} finally {
				setIsLoaded(true);
			}
		};
		loadTheme();
	}, [systemColorScheme]);

	const toggleTheme = async () => {
		const newTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
		} catch (error) {
			console.error('Failed to save theme preference:', error);
		}
	};

	const isDark = theme === 'dark';

	// Don't render children until theme is loaded to prevent flash
	if (!isLoaded) {
		return null;
	}

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
