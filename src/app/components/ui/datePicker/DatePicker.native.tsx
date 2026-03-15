/**
 * DatePicker Component - Native Implementation
 * 
 * Uses @react-native-community/datetimepicker for iOS/Android.
 */

import React from 'react';
import { Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { parseDate, toISODateString } from '../../../utils';
import { DatePickerProps } from './DatePicker.types';


/**
 * DatePicker Component (Native)
 * 
 * Displays a native date picker for iOS/Android.
 */
export const DatePicker: React.FC<DatePickerProps> = ({
	value,
	onChange,
	isVisible,
	onDismiss,
}): React.ReactElement | null => {
	const dateValue = typeof value === 'string' ? parseDate(value) : value;

	/**
	 * Handle date change from native picker
	 * Returns ISO string with time at noon to prevent timezone boundary issues
	 */
	const handleChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
		if (event.type === 'dismissed' || !selectedDate) {
			onDismiss();
			return;
		}

		// Convert to ISO string with time at noon
		const isoString = toISODateString(selectedDate);
		
		onChange(isoString);
		onDismiss();
	};

	if (!isVisible) {
		return null;
	}

	return (
		<DateTimePicker
			value={dateValue}
			mode="date"
			display={Platform.OS === 'ios' ? 'spinner' : 'default'}
			onChange={handleChange}
		/>
	);
};
