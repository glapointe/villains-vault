/**
 * Dropdown Component - Web Implementation
 * 
 * Native HTML select dropdown for web platform.
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { baseStyles, getThemedStyles } from './Dropdown.web.styles';
import { DropdownProps } from './Dropdown.types';

/**
 * Dropdown Component (Web)
 * 
 * Native HTML select element styled to match app theme.
 */
export const Dropdown = <T extends any>({
    value,
    options,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    containerStyle,
}: DropdownProps<T>): React.ReactElement => {
    const { isDark } = useTheme();
    const colors = getThemedColors(isDark);
    const themedStyles = getThemedStyles(colors);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const selectedOption = options.find((opt) => String(opt.value) === event.target.value);
        if (selectedOption) {
            onChange(selectedOption.value);
        }
    };

    /** Only show the placeholder option when the current value doesn't match any real option */
    const hasMatchingOption = options.some((opt) => String(opt.value) === String(value));

    return (
        <div style={containerStyle as React.CSSProperties}>
            <select
                value={String(value)}
                onChange={handleChange}
                disabled={disabled}
                style={{
                    ...baseStyles.select,
                    ...(disabled ? baseStyles.selectDisabled : {}),
                    ...themedStyles.select,
                    ...(disabled ? themedStyles.selectDisabled : {}),
                } as React.CSSProperties}
            >
                {placeholder && !hasMatchingOption && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option, index) => (
                    <option key={index} value={String(option.value)}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};
