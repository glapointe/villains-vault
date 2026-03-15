import { ViewStyle } from "react-native";

export interface DropdownOption<T = any> {
    label: string;
    value: T;
}

export interface DropdownProps<T = any> {
	/**
	 * Currently selected value
	 */
    value: T;

	/**
	 * Array of options to display
	 */
    options: DropdownOption<T>[];

	/**
	 * Callback when value changes
	 */
    onChange: (value: T) => void;

	/**
	 * Placeholder text when no value selected
	 */
    placeholder?: string;

	/**
	 * Whether the dropdown is disabled
	 */
    disabled?: boolean;

	/**
	 * Optional container style to apply to the wrapper div
	 */
    containerStyle?: ViewStyle;
}
