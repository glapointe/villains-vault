/**
 * Validation Utility Functions
 * 
 * Common validation helpers for forms and data input.
 */

/**
 * Validate URL format
 * Checks if a string is a valid URL format.
 * 
 * @param url - URL string to validate
 * @returns True if valid URL format
 * 
 * @example
 * isValidUrl("https://example.com") // true
 * isValidUrl("not a url") // false
 * isValidUrl("") // false
 */
export function isValidUrl(url: string): boolean {
	if (!url.trim()) {
		return false;
	}

	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validate email format
 * Basic email format validation using regex.
 * 
 * @param email - Email string to validate
 * @returns True if valid email format
 * 
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid-email") // false
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

/**
 * Check if string is empty or only whitespace
 * 
 * @param value - String to check
 * @returns True if string is empty or only whitespace
 * 
 * @example
 * isEmpty("  ") // true
 * isEmpty("") // true
 * isEmpty("text") // false
 */
export function isEmpty(value: string): boolean {
	return !value.trim();
}

/**
 * Validate required field
 * Returns error message if field is empty, null otherwise.
 * 
 * @param value - Field value to validate
 * @param fieldName - Name of field for error message
 * @returns Error message or null
 * 
 * @example
 * validateRequired("", "Email") // "Email is required"
 * validateRequired("value", "Email") // null
 */
export function validateRequired(value: string, fieldName: string): string | null {
	return isEmpty(value) ? `${fieldName} is required` : null;
}

/**
 * Validate minimum length
 * Returns error message if string is shorter than minimum, null otherwise.
 * 
 * @param value - String to validate
 * @param minLength - Minimum required length
 * @param fieldName - Name of field for error message
 * @returns Error message or null
 * 
 * @example
 * validateMinLength("ab", 3, "Password") // "Password must be at least 3 characters"
 * validateMinLength("abc", 3, "Password") // null
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
	return value.length < minLength ? `${fieldName} must be at least ${minLength} characters` : null;
}

/**
 * Validate maximum length
 * Returns error message if string exceeds maximum, null otherwise.
 * 
 * @param value - String to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of field for error message
 * @returns Error message or null
 * 
 * @example
 * validateMaxLength("toolong", 5, "Name") // "Name must not exceed 5 characters"
 * validateMaxLength("ok", 5, "Name") // null
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
	return value.length > maxLength ? `${fieldName} must not exceed ${maxLength} characters` : null;
}
