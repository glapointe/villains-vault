/**
 * Date Utility Functions
 * 
 * Common date manipulation and formatting utilities for handling race dates.
 * All dates are stored with time at noon UTC to prevent timezone boundary issues.
 */

/**
 * Date format options
 */
export type DateFormat = 'long' | 'short' | 'numeric';

/**
 * Format ISO date string to user-friendly format
 * Handles both simple YYYY-MM-DD and full ISO strings with time component.
 * 
 * @param isoDate - ISO date string (e.g., "2026-01-15" or "2026-01-15T12:00:00.000Z")
 * @param format - Format style: 'long' (default), 'short', or 'numeric'
 * @returns Formatted date string in locale format
 * 
 * @example
 * formatDate("2026-01-15T12:00:00.000Z") // "January 15, 2026"
 * formatDate("2026-01-15", "short") // "Jan 15, 2026"
 * formatDate("2026-01-15", "numeric") // "1/15/2026"
 */
export function formatDate(isoDate: string, format: DateFormat = 'long'): string {
	try {
		// Extract date portion from ISO string
		const datePart = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate;
		const [year, month, day] = datePart.split('-');
		
		// Create date at noon local time to avoid timezone boundary issues
		const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
		
		if (format === 'short') {
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} else if (format === 'numeric') {
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
			});
		}
		
		// Default: long format
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch {
		return isoDate;
	}
}

/**
 * Ensure a date string has time component at noon UTC
 * Converts simple YYYY-MM-DD dates to full ISO strings with time at noon.
 * This prevents timezone boundary issues where dates can shift by a day.
 * 
 * @param dateStr - Optional date string (YYYY-MM-DD or full ISO)
 * @returns ISO string with time at noon UTC (YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * @example
 * ensureDateWithTime("2026-01-15") // "2026-01-15T12:00:00.000Z"
 * ensureDateWithTime("2026-01-15T12:00:00.000Z") // "2026-01-15T12:00:00.000Z"
 * ensureDateWithTime() // Today's date at noon UTC
 */
export function ensureDateWithTime(dateStr?: string): string {
	if (!dateStr) {
		// Return today's date at noon UTC
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}T12:00:00.000Z`;
	}
	
	// If already has time component, return as-is
	if (dateStr.includes('T')) {
		return dateStr;
	}
	
	// Add time component at noon UTC
	return `${dateStr}T12:00:00.000Z`;
}

/**
 * Parse ISO date string to Date object at noon local time
 * This prevents timezone boundary issues when displaying or manipulating dates.
 * 
 * @param dateString - ISO date string (with or without time component)
 * @returns Date object set to noon local time
 * 
 * @example
 * parseDate("2026-01-15T12:00:00.000Z") // Date object for Jan 15, 2026 at noon local
 * parseDate("2026-01-15") // Date object for Jan 15, 2026 at noon local
 */
export function parseDate(dateString: string): Date {
	const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
	const [year, month, day] = datePart.split('-');
	return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
}

/**
 * Create ISO date string from Date object at noon UTC
 * Useful for creating consistent date strings from date picker selections.
 * 
 * @param date - Date object to convert
 * @returns ISO string with time at noon UTC (YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * @example
 * const date = new Date(2026, 0, 15); // Jan 15, 2026
 * toISODateString(date) // "2026-01-15T12:00:00.000Z"
 */
export function toISODateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}T12:00:00.000Z`;
}

/**
 * Get current date as ISO string with time at noon UTC
 * 
 * @returns Today's date as ISO string at noon UTC
 * 
 * @example
 * getCurrentDateString() // "2026-02-01T12:00:00.000Z"
 */
export function getCurrentDateString(): string {
	const today = new Date();
	return toISODateString(today);
}


/**
 * Converts time string (HH:MM:SS or MM:SS) to seconds
 */
export function timeToSeconds(timeStr: string | undefined): number | null {
	if (!timeStr) return null;
	
	const parts = timeStr.split(':').map(p => parseInt(p, 10));
	if (parts.length === 3) {
		return parts[0] * 3600 + parts[1] * 60 + parts[2];
	} else if (parts.length === 2) {
		return parts[0] * 60 + parts[1];
	}
	return null;
};

/**
 * Converts pace string (HH:MM:SS.ms or MM:SS) to decimal minutes
 */
export function paceToMinutes(paceStr: string | undefined): number | null {
	if (!paceStr) return null;
	
	// Remove milliseconds if present (e.g., "00:05:59.5275608" -> "00:05:59")
	const timeWithoutMs = paceStr.split('.')[0];
	
	const parts = timeWithoutMs.split(':').map(p => parseInt(p, 10));
	
	if (parts.length === 3) {
		// HH:MM:SS format -> convert to decimal minutes
		const hours = parts[0];
		const minutes = parts[1];
		const seconds = parts[2];
		return hours * 60 + minutes + seconds / 60;
	} else if (parts.length === 2) {
		// MM:SS format -> convert to decimal minutes
		return parts[0] + parts[1] / 60;
	}
	
	return null;
};

/**
 * Convert pace in seconds per mile to MM:SS format
 * @param paceSeconds - Pace in total seconds per mile
 * @returns Formatted pace string (e.g., "8:30")
 */
export function secondsToPace(paceSeconds: number): string {
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format pace for display (convert decimal minutes to MM:SS format)
 * 
 * @param paceMinutes - Pace in decimal minutes (e.g., 8.4 = 8:24 per mile)
 * @returns Formatted pace string (e.g., "8:24")
 */
export function minutesToPace(paceMinutes: number): string {
	const minutes = Math.floor(paceMinutes);
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	const seconds = Math.round((paceMinutes - minutes) * 60);
	return `${hours > 0 ? `${hours}:` : ''}${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format time string for display
 * Returns "N/A" if time is null or undefined.
 * Removes decimal portion from time strings (e.g., "00:08:24.7709923" becomes "00:08:24")
 * 
 * @param time - Time string (e.g., "01:23:45" or "01:23:45.1234567")
 * @returns Formatted time string or "N/A"
 * 
 * @example
 * formatTime("01:23:45") // "01:23:45"
 * formatTime("01:23:45.7709923") // "01:23:45"
 * formatTime(null) // "N/A"
 * formatTime(undefined) // "N/A"
 */
export function formatTime(time?: string | null, removeEmptyHours?: boolean): string {
	if (!time) return 'N/A';
	// Remove decimal portion if present
	let formattedTime = time.split('.')[0];
    // Optionally remove leading "00:" if hours are zero and removeEmptyHours is true
    if (removeEmptyHours && formattedTime.startsWith('00:')) {
        formattedTime = formattedTime.substring(3);
    }
    return formattedTime;
}
