/**
 * Shared helpers for the followedResults components.
 */

import type { EnrichedFollow } from '../../../models';
import type { EventGroup } from './FollowedResultsList.types';

/** Format a TimeSpan string (HH:MM:SS or H:MM:SS) to a display string */
export function formatTime(ts: string | null): string {
	if (!ts) return '—';
	// Backend returns "HH:MM:SS" or "H:MM:SS" or "D.HH:MM:SS.fff"
	const parts = ts.split('.')[0]; // strip fractional seconds
	// Remove leading zeros on hours: "00:42:13" → "42:13", "01:12:30" → "1:12:30"
	const segments = parts.split(':');
	if (segments.length === 3) {
		const hours = parseInt(segments[0], 10);
		if (hours === 0) return `${segments[1]}:${segments[2]}`;
		return `${hours}:${segments[1]}:${segments[2]}`;
	}
	return parts;
}

/** Format a date string to a short display format */
export function formatDate(dateStr: string): string {
	const d = new Date(dateStr);
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Group follows by event */
export function groupByEvent(items: EnrichedFollow[]): EventGroup[] {
	const map = new Map<number, EventGroup>();
	for (const item of items) {
		let group = map.get(item.eventId);
		if (!group) {
			group = {
				eventId: item.eventId,
				eventName: item.eventName,
				eventSeries: item.eventSeries,
				results: [],
			};
			map.set(item.eventId, group);
		}
		group.results.push(item);
	}
	return Array.from(map.values());
}
