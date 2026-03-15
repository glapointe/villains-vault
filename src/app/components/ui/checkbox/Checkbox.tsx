/**
 * Checkbox Component
 * 
 * Reusable checkbox component with label and optional description.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './Checkbox.styles';

export interface CheckboxProps {
	/**
	 * Checkbox label text
	 */
	label: string;
	
	/**
	 * Optional description text shown below the label
	 */
	description?: string;
	
	/**
	 * Whether the checkbox is checked
	 */
	checked: boolean;
	
	/**
	 * Callback when checkbox is toggled
	 */
	onToggle: (checked: boolean) => void;
	
	/**
	 * Whether the checkbox is disabled
	 */
	disabled?: boolean;
}

/**
 * Checkbox Component
 * Displays a checkbox with label and optional description
 */
export function Checkbox({
	label,
	description,
	checked,
	onToggle,
	disabled = false,
}: CheckboxProps): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	const handlePress = (): void => {
		if (!disabled) {
			onToggle(!checked);
		}
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			disabled={disabled}
			style={styles.container}
			activeOpacity={0.7}
		>
			<View style={styles.row}>
				<View
					style={[
						styles.checkbox,
						disabled
							? (checked ? themedStyles.checkboxDisabledChecked : themedStyles.checkboxDisabled)
							: checked
							? themedStyles.checkboxChecked
							: themedStyles.checkbox,
					]}
				>
					{checked && (
						<Text style={[styles.checkmark, themedStyles.checkmark]}>✓</Text>
					)}
				</View>
				<View style={styles.textContainer}>
					<Text
						style={[
							styles.label,
							disabled ? themedStyles.labelDisabled : themedStyles.label,
						]}
					>
						{label}
					</Text>
					{Boolean(description) && (
						<Text
							style={[
								styles.description,
								themedStyles.description,
							]}
						>
							{description}
						</Text>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
}
