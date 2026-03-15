
export interface DatePickerProps {
	/**
	 * Whether the date picker is visible
	 */
	isVisible: boolean;
	
	/**
	 * Currently selected date (ISO string format)
	 */
	value: string;
	
	/**
	 * Callback when date is changed
	 * @param date - Selected date in ISO format (YYYY-MM-DD)
	 */
	onChange: (date: string) => void;
	
	/**
	 * Callback to close the date picker
	 */
	onDismiss: () => void;
}