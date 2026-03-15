/**
 * Error Boundary Component
 * 
 * Catches unhandled React errors and displays a fallback UI.
 * Provides options to retry or reload the app.
 * Logs errors in development mode for debugging.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { Button, Card } from '../../ui';
import { styles, getThemedStyles } from './ErrorBoundary.styles';
import { getThemedColors } from '../../../theme';
import { ThemeContext } from '../../../contexts/ThemeContext';

interface ErrorBoundaryProps {
	children: ReactNode;
	/**
	 * Optional fallback UI to render when an error occurs
	 */
	fallback?: (error: Error, resetError: () => void) => ReactNode;
	/**
	 * Optional callback when an error is caught
	 */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	// Enable class component to access ThemeContext
	static contextType = ThemeContext;
	// this.context will be of type React.ContextType<typeof ThemeContext>
	context!: React.ContextType<typeof ThemeContext>;

	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	/**
	 * Update state when an error is caught
	 */
	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
		};
	}

	/**
	 * Log error details
	 */
	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error to console in development
		if (__DEV__) {
			console.error('ErrorBoundary caught an error:', error);
			console.error('Error Info:', errorInfo);
		}

		// Call optional error handler
		this.props.onError?.(error, errorInfo);

		// Store error info in state
		this.setState({
			errorInfo,
		});
	}

	/**
	 * Reset error state and retry rendering children
	 */
	resetError = (): void => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	/**
	 * Reload the app (platform-specific)
	 */
	reloadApp = (): void => {
		if (Platform.OS === 'web') {
			window.location.reload();
		} else {
			// For native, we can use expo-updates or just reset the error
			this.resetError();
		}
	};

	render(): ReactNode {
		const { hasError, error, errorInfo } = this.state;
		const { children, fallback } = this.props;

		// If there's an error, render fallback UI
		if (hasError && error) {
			// Use custom fallback if provided
			if (fallback) {
				return fallback(error, this.resetError);
			}

			// Default fallback UI
			// Use theme from context (accessed via static contextType)
			const colors = getThemedColors(this.context?.isDark ?? false);
			const themedStyles = getThemedStyles(colors);

			return (
				<View style={[styles.container, themedStyles.container]}>
					<Card style={styles.card}>
						<Text style={styles.icon}>⚠️</Text>
						
						<Text style={[styles.title, themedStyles.title]}>
							Something Went Wrong
						</Text>
						
						<Text style={[styles.message, themedStyles.message]}>
							{error.message || 'An unexpected error occurred'}
						</Text>

						{/* Show stack trace in development */}
						{__DEV__ && errorInfo && (
							<ScrollView style={[styles.stackTrace, themedStyles.stackTrace]}>
								<Text style={[styles.stackTraceTitle, themedStyles.stackTraceTitle]}>
									Stack Trace:
								</Text>
								<Text style={[styles.stackTraceText, themedStyles.stackTraceText]}>
									{error.stack}
								</Text>
								<Text style={[styles.stackTraceTitle, themedStyles.stackTraceTitle]}>
									Component Stack:
								</Text>
								<Text style={[styles.stackTraceText, themedStyles.stackTraceText]}>
									{errorInfo.componentStack}
								</Text>
							</ScrollView>
						)}

						<View style={styles.buttonContainer}>
							<Button
								title="Try Again"
								variant="primary"
								onPress={this.resetError}
								fullWidth
							/>

							<Button
								title="Reload App"
								variant="ghost"
								onPress={this.reloadApp}
								fullWidth
							/>
						</View>
					</Card>
				</View>
			);
		}

		// No error, render children normally
		return children;
	}
}
