/**
 * Admin features barrel export
 * Lazy loads admin panels for better code splitting
 */
import { lazy } from 'react';
import type { EventSubmissionPanelProps } from './eventSubmissionPanel/EventSubmissionPanel';
import type { JobStatusPanelProps } from './jobStatusPanel/JobStatusPanel';
import type { HeroImagePanelProps } from './heroImagePanel/HeroImagePanel';
import type { EditUserPanelProps } from '../../components/users/editUserPanel/EditUserPanel';
import type { UserManagementGridProps } from './userManagement/UserManagementGrid';
import type { DlsManagementPanelProps } from './dlsManagementPanel/DlsManagementPanel';
import type { CourseMapPanelProps } from './courseMapPanel/CourseMapPanel';

// Lazy loaded admin panels (only loaded when admin screen is accessed)
export const EventSubmissionPanel = lazy(() => 
	import('./eventSubmissionPanel/EventSubmissionPanel')
) as unknown as React.FC<EventSubmissionPanelProps>;

export const JobStatusPanel = lazy(() => 
	import('./jobStatusPanel/JobStatusPanel')
) as unknown as React.FC<JobStatusPanelProps>;

export const HeroImagePanel = lazy(() => 
	import('./heroImagePanel/HeroImagePanel')
) as unknown as React.FC<HeroImagePanelProps>;

export const UserManagementGrid = lazy(() => 
	import('./userManagement/UserManagementGrid')
) as unknown as React.FC<UserManagementGridProps>;

export const DlsManagementPanel = lazy(() => 
	import('./dlsManagementPanel/DlsManagementPanel')
) as unknown as React.FC<DlsManagementPanelProps>;

export const CourseMapPanel = lazy(() =>
	import('./courseMapPanel/CourseMapPanel')
) as unknown as React.FC<CourseMapPanelProps>;

// Re-export types for convenience
export type { EventSubmissionPanelProps } from './eventSubmissionPanel/EventSubmissionPanel';
export type { JobStatusPanelProps } from './jobStatusPanel/JobStatusPanel';
export type { HeroImagePanelProps } from './heroImagePanel/HeroImagePanel';
export type { UserManagementGridProps } from './userManagement/UserManagementGrid';
export type { DlsManagementPanelProps } from './dlsManagementPanel/DlsManagementPanel';
export type { CourseMapPanelProps } from './courseMapPanel/CourseMapPanel';
