import { lazy } from 'react';
import { EditUserPanelProps } from './editUserPanel/EditUserPanel';

export const EditUserPanel = lazy(() =>
	import('./editUserPanel/EditUserPanel')
) as unknown as React.FC<EditUserPanelProps>;

export type { EditUserPanelProps, EditUserMode } from './editUserPanel/EditUserPanel';

export { UserMenu } from './userMenu';
export type { UserMenuProps } from './userMenu';
