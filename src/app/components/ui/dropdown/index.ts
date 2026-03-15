import { Platform } from 'react-native';
import type { DropdownProps } from './Dropdown.types';

// Shared types - always available regardless of platform
export type { DropdownProps, DropdownOption } from './Dropdown.types';

// Platform-specific component export
export const Dropdown: React.FC<DropdownProps> = Platform.OS === 'web'
	? require('./Dropdown.web').Dropdown
	: require('./Dropdown.native').Dropdown;
