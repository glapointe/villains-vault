/**
 * Streaming Fetch Helper
 *
 * Provides a cross-platform `fetch` that supports `ReadableStream` on all platforms.
 *
 * - **Web**: uses the global `fetch` (already supports streaming).
 * - **Native (iOS/Android)**: uses `expo/fetch` which provides a WinterCG-compliant
 *   Fetch API with `ReadableStream` support on native platforms.
 *
 * Usage: `import { streamFetch } from './streamFetch';` then use exactly like `fetch()`.
 *
 * NOTE: The global web `fetch` is deliberately kept in some call sites as a reference
 * implementation. This helper is for call sites that need cross-platform streaming.
 */

import { Platform } from 'react-native';

/**
 * A `fetch` function guaranteed to return a `Response` with a readable `.body` stream
 * on all platforms (web, iOS, Android).
 */
export const streamFetch: typeof globalThis.fetch =
	Platform.OS === 'web'
		? globalThis.fetch.bind(globalThis)
		: require('expo/fetch').fetch;
