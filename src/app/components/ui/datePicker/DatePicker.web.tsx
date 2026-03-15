/**
 * DatePicker Component - Web Implementation
 * 
 * Calendar-based date picker for web platform using react-datepicker and Dialog component.
 */

import React, { useState, useEffect } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { Dialog } from '../dialog';
import { parseDate, toISODateString } from '../../../utils';
import { DatePickerProps } from './DatePicker.types';

/**
 * DatePicker Component (Web - Calendar UI)
 * 
 * Displays a calendar picker using react-datepicker wrapped in a Dialog.
 */
export const DatePicker: React.FC<DatePickerProps> = ({
	value,
	onChange,
	isVisible,
	onDismiss,
}): React.ReactElement | null => {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	// Parse value when dialog opens
	useEffect(() => {
		if (isVisible && value) {
			setSelectedDate(parseDate(value));
		}
	}, [isVisible, value]);

	/**
	 * Handle date selection - format as ISO string with time at noon to prevent timezone boundary issues
	 */
	const handleDateChange = (date: Date | null): void => {
		if (date) {
			// Convert to ISO string with time at noon
			const newDateString = toISODateString(date);
			
			// Always call onChange and close - even if same date selected
			onChange(newDateString);
			onDismiss();
		}
	};

	return (
		<Dialog
			isOpen={isVisible}
			title="Select Date"
			onCancel={onDismiss}
			cancelText="Close"
		>
			<div>
				<style>
					{`
						.react-datepicker {
							background-color: ${colors.surface} !important;
							border: 1px solid ${colors.border} !important;
							color: ${colors.textPrimary} !important;
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						}
						.react-datepicker__header {
							background-color: ${isDark ? '#1a1a2e' : '#f3f4f6'} !important;
							border-bottom: 1px solid ${colors.border} !important;
						}
                        .react-datepicker__year-dropdown, .react-datepicker__month-dropdown, .react-datepicker__month-year-dropdown {
                            background-color: ${colors.surface} !important;
                            color: ${colors.textPrimary} !important;
                        }
						.react-datepicker__current-month,
						.react-datepicker__day-name {
							color: ${colors.textPrimary} !important;
						}
						.react-datepicker__day {
							color: ${colors.textPrimary} !important;
						}
						.react-datepicker__day:hover {
							background-color: ${isDark ? '#2d3748' : '#e5e7eb'} !important;
						}
						.react-datepicker__day--selected {
							background-color: #3b82f6 !important;
							color: white !important;
						}
						.react-datepicker__day--keyboard-selected {
							background-color: ${isDark ? '#2563eb' : '#60a5fa'} !important;
							color: white !important;
						}
						.react-datepicker__day--disabled {
							color: ${colors.textSecondary} !important;
						}
						.react-datepicker__navigation-icon::before {
							border-color: ${colors.textPrimary} !important;
						}
						.react-datepicker__triangle {
							display: none;
						}
					`}
				</style>
				<ReactDatePicker
					selected={selectedDate}
					onChange={handleDateChange}
					inline
                    showMonthDropdown
                    showYearDropdown
                    peekNextMonth
                    dropdownMode="scroll"
					calendarStartDay={0}
				/>
			</div>
		</Dialog>
	);
};
