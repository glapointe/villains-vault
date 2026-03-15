import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps, View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getVariantStyles, getVariantTextStyles } from './Button.styles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonPadding = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
	title?: string;
	variant?: ButtonVariant;
	padding?: ButtonPadding;
	loading?: boolean;
	fullWidth?: boolean;
	icon?: React.ReactNode;
}

export function Button({
	title,
	variant = 'primary',
	padding = 'lg',
	loading = false,
	fullWidth = false,
	disabled,
	icon,
	style,
	...props
}: ButtonProps) {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const variantStyles = getVariantStyles(colors);
	const variantTextStyles = getVariantTextStyles(colors);

	return (
		<Pressable
			style={(state) => [
				styles.button,
				padding === 'lg' && styles.buttonPaddingLg,
				padding === 'md' && styles.buttonPaddingMd,
				padding === 'sm' && styles.buttonPaddingSm,
				variantStyles[variant],
				fullWidth && styles.fullWidth,
				(disabled || loading) && styles.disabled,
				!disabled && !loading && state.hovered && styles.hovered,
				typeof style === 'function' ? style(state) : style,
			]}
			disabled={disabled || loading}
			{...props}
		>
			{loading ? (
				<ActivityIndicator color={variantTextStyles[variant].color} />
			) : (
				<View style={styles.content}>
					{icon && <View style={styles.icon}>{icon}</View>}
					{Boolean(title) && <Text style={[styles.text, variantTextStyles[variant]]}>{title}</Text>}
				</View>
			)}
		</Pressable>
	);
}
