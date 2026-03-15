/**
 * Unified Authentication Hook
 * 
 * Platform-aware hook that provides consistent auth interface
 * across web and native platforms.
 */

import { Platform } from 'react-native';
import { useAuth as useAuthNative } from '../features/auth/providers/AuthProvider.native';
import { useAuth as useAuthWeb } from '../features/auth/providers/AuthProvider.web';

/**
 * Use the appropriate auth hook based on platform
 */
export const useAuth = Platform.OS === 'web' ? useAuthWeb : useAuthNative;
