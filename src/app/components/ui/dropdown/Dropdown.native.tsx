/**
 * Dropdown Component - Native Implementation
 * 
 * Uses React Native Picker for iOS/Android.
 */

import React from 'react';
import { View } from 'react-native';
import { Picker, PickerProps } from '@react-native-picker/picker';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './Dropdown.native.styles';
import { DropdownProps } from './Dropdown.types';

/**
 * Extended Picker props that properly types children support
 * The base PickerProps doesn't include children in its type definition,
 * but the component does accept them at runtime.
 */
interface PickerPropsWithChildren<T> extends PickerProps<T> {
	children?: React.ReactNode;
}

/**
 * Dropdown Component (Native)
 * 
 * React Native Picker styled to match app theme.
 */
export const Dropdown = <T extends any>({
	value,
	options,
	onChange,
	placeholder = 'Select...',
	disabled = false,
	containerStyle: customContainerStyle,
}: DropdownProps<T>): React.ReactElement => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);
	const itemTextColor = isDark ? colors.textInverse : colors.textPrimary;

	const containerStyle = [
		styles.container,
		themedStyles.container,
		{ opacity: disabled ? 0.6 : 1 },
		customContainerStyle,
	];

	// Type-safe cast: Picker accepts children at runtime but types don't reflect it
	const PickerComponent = Picker as React.ComponentType<PickerPropsWithChildren<T>>;

	return (
		<View style={containerStyle}>
			<PickerComponent
				selectedValue={value}
				onValueChange={(itemValue: T) => onChange(itemValue)}
				enabled={!disabled}
				
				style={{...styles.picker, ...themedStyles.picker}}
				dropdownIconColor={colors.textPrimary}
				itemStyle={{...styles.pickerItem, ...themedStyles.pickerItem}}
			>
				{placeholder && value === undefined && (
					<Picker.Item
						label={placeholder}
						value={undefined}
						enabled={false}
						style={{...styles.pickerItem, ...themedStyles.pickerItemDisabled}}
					/>
				)}
				{options.map((option) => (
					<Picker.Item
						key={`${option.value}`}
						label={option.label}
						value={option.value}
						style={{...styles.pickerItem, ...themedStyles.pickerItem}}						
					/>
				))}
			</PickerComponent>
		</View>
	);
};
