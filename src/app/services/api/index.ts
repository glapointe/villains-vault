/**
 * API Service - Main Export
 * 
 * Centralized API client for all backend endpoints.
 * Organized by resource/domain for maintainability.
 */

// Export client and auth helpers
export { apiClient, setAuthToken } from './client';

// Export all API modules
export { usersApi } from './users.api';
export { eventsApi } from './events.api';
export { racesApi } from './races.api';
export { raceResultsApi } from './raceResults.api';
export { jobsApi } from './jobs.api';
export { heroImagesApi } from './heroImages.api';
export { chatApi } from './chat.api';
export { followsApi } from './follows.api';
export { dlsApi } from './dls.api';
export { communityApi } from './community.api';
export { notificationsApi } from './notifications.api';

// Import all API modules for unified export
import { usersApi } from './users.api';
import { eventsApi } from './events.api';
import { racesApi } from './races.api';
import { raceResultsApi } from './raceResults.api';
import { jobsApi } from './jobs.api';
import { heroImagesApi } from './heroImages.api';
import { chatApi } from './chat.api';
import { followsApi } from './follows.api';
import { dlsApi } from './dls.api';
import { communityApi } from './community.api';
import { notificationsApi } from './notifications.api';

/**
 * Unified API object for convenience
 * Usage: api.events.getAll(), api.users.getCurrentUser(), etc.
 */
export const api = {
    users: usersApi,
    events: eventsApi,
    races: racesApi,
	raceResults: raceResultsApi,
    jobs: jobsApi,
    heroImages: heroImagesApi,
    chat: chatApi,
    follows: followsApi,
    dls: dlsApi,
    community: communityApi,
    notifications: notificationsApi,
};
